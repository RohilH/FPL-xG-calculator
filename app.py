from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from enums import Position
from helpers import calculate_player_xpts, get_fpl_data, normalize_name


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

        # Calculate points from goals and assists
        goals_points = player["goals_scored"] * position.goal_points
        assists_points = player["assists"] * 3

        # Calculate clean sheet points based on position and minutes
        clean_sheet_points = 0
        if player["minutes"] >= 60:
            clean_sheet_points = player["clean_sheets"] * position.clean_sheet_points

        # Calculate other points (appearances + bonus + deductions)
        other_points = player["total_points"] - (
            goals_points + assists_points + clean_sheet_points
        )

        # Actual stats
        actual_stats = {
            "goals": player["goals_scored"],
            "assists": player["assists"],
            "clean_sheets": player["clean_sheets"],
            "minutes": player["minutes"],
        }

        # Actual points breakdown
        actual_points = {
            "goals": goals_points,
            "assists": assists_points,
            "clean_sheets": clean_sheet_points,
            "other": other_points,
            "total": player["total_points"],
        }

        # Calculate expected goals and assists points
        expected_goals = round(float(player.get("expected_goals", "0")))
        expected_assists = round(float(player.get("expected_assists", "0")))

        expected_goals_points = expected_goals * position.goal_points
        expected_assists_points = expected_assists * 3

        # Calculate expected clean sheet points (using actual clean sheets)
        expected_clean_sheet_points = 0
        if player["minutes"] >= 60:
            expected_clean_sheet_points = (
                player["clean_sheets"] * position.clean_sheet_points
            )

        # Expected stats
        expected_stats = {
            "raw_xg": float(player.get("expected_goals", "0")),
            "raw_xa": float(player.get("expected_assists", "0")),
            "expected_goals": expected_goals,
            "expected_assists": expected_assists,
            "clean_sheets": player["clean_sheets"],
        }

        # Expected points breakdown
        expected_points = {
            "goals": expected_goals_points,
            "assists": expected_assists_points,
            "clean_sheets": expected_clean_sheet_points,
            "other": other_points,
            "total": expected_goals_points
            + expected_assists_points
            + expected_clean_sheet_points
            + other_points,
        }

        return jsonify(
            {
                "actual": {"stats": actual_stats, "points": actual_points},
                "expected": {"stats": expected_stats, "points": expected_points},
            }
        )

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
