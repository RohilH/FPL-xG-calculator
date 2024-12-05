from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from enums import Position
from helpers import (
    calculate_player_xpts,
    get_fpl_data,
    normalize_name,
    get_player_stats,
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
        return jsonify(get_player_stats(player, position))

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
