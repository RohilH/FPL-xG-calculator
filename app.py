from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from enums import Position
from helpers import (
    calculate_player_xpts,
    get_fpl_data,
    normalize_name,
    get_completed_gameweeks,
    get_player_season_stats,
    get_player_gameweek_stats,
)


app = Flask(__name__, static_folder="dist")
CORS(app)


@app.route("/api/players")
def search_players():
    search_term = request.args.get("search", "")
    search_term = normalize_name(search_term)
    fpl_data = get_fpl_data()

    players = []
    for player in fpl_data["elements"]:
        player_name = f"{player['first_name']} {player['second_name']}"
        normalized_name = normalize_name(player_name)
        if search_term in normalized_name:
            players.append(
                {
                    "id": player["id"],
                    "first_name": player["first_name"],
                    "second_name": player["second_name"],
                    "name": player_name,
                    "team": fpl_data["teams"][player["team"] - 1]["name"],
                    "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['code']}.png",
                }
            )

    return jsonify(players)


@app.route("/api/league-stats")
def get_league_stats():
    fpl_data = get_fpl_data()
    players = []

    for player in fpl_data["elements"]:
        position = Position.from_element_type(player["element_type"])
        xpts = calculate_player_xpts(player, position)

        players.append(
            {
                "id": player["id"],
                "name": f"{player['first_name']} {player['second_name']}",
                "team": fpl_data["teams"][player["team"] - 1]["name"],
                "position": position.name,
                "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['code']}.png",
                "cost": player["now_cost"] / 10,
                "selected": float(player["selected_by_percent"]),
                "form": float(player["form"]),
                "points": player["total_points"],
                "xPts": xpts,
                "minutes": player["minutes"],
                "goals": player["goals_scored"],
                "assists": player["assists"],
                "cleanSheets": player["clean_sheets"],
                "xG": float(player.get("expected_goals", "0")),
                "xA": float(player.get("expected_assists", "0")),
            }
        )

    return jsonify(players)


@app.route("/api/player/<int:player_id>")
def get_player(player_id):
    try:
        fpl_data = get_fpl_data()
        player = next((p for p in fpl_data["elements"] if p["id"] == player_id), None)

        if not player:
            return jsonify({"error": "Player not found"}), 404

        position = Position.from_element_type(player["element_type"])
        return jsonify(get_player_season_stats(player, position))

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/position-players")
def get_position_players():
    position = request.args.get("position")
    search = request.args.get("search", "").lower()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    if not position:
        return jsonify({"error": "Position is required"}), 400

    fpl_data = get_fpl_data()
    players = []

    for player in fpl_data["elements"]:
        player_position = Position.from_element_type(player["element_type"]).name
        if player_position != position:
            continue

        player_name = f"{player['first_name']} {player['second_name']}"
        if search and search not in player_name.lower():
            continue

        players.append(
            {
                "id": player["id"],
                "name": player_name,
                "team": fpl_data["teams"][player["team"] - 1]["name"],
                "position": player_position,
                "photo": f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{player['code']}.png",
                "points": player["total_points"],
                "xPts": calculate_player_xpts(
                    player, Position.from_element_type(player["element_type"])
                ),
            }
        )

    # Sort by points
    players.sort(key=lambda x: x["points"], reverse=True)

    # Calculate pagination
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_players = players[start_idx:end_idx]

    return jsonify({"players": paginated_players, "has_more": end_idx < len(players)})


@app.route("/api/gameweeks")
def get_gameweeks():
    """Get list of completed gameweeks"""
    completed = get_completed_gameweeks()
    return jsonify(
        {"gameweeks": [{"id": "season", "name": "Entire Season"}, *completed]}
    )


@app.route("/api/players/stats", methods=["POST"])
def get_players_stats():
    """Get stats for multiple players, optionally for a specific gameweek"""
    data = request.get_json()
    if not data or "players" not in data:
        return jsonify({"error": "Players list is required"}), 400

    gameweek = data.get("gameweek")
    players = data["players"]
    fpl_data = get_fpl_data()

    result = {}
    for player_id in players:
        # Get player data from bootstrap-static
        player = next((p for p in fpl_data["elements"] if p["id"] == player_id), None)
        if not player:
            continue

        position = Position.from_element_type(player["element_type"])

        if gameweek == "season" or not gameweek:
            result[player_id] = get_player_season_stats(player, position)
        else:
            gw_stats = get_player_gameweek_stats(player_id, gameweek, position)
            if gw_stats:
                result[player_id] = gw_stats

    return jsonify(result)


@app.route("/api/fpl-data")
def get_raw_fpl_data():
    try:
        data = get_fpl_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True)
