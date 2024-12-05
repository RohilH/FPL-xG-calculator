import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from enum import Enum
from helpers import normalize_name


class Position(Enum):
    GK = 1
    DEF = 2
    MID = 3
    FWD = 4

    @property
    def goal_points(self) -> int:
        """Points awarded for scoring a goal"""
        return {Position.GK: 6, Position.DEF: 6, Position.MID: 5, Position.FWD: 4}[self]

    @property
    def clean_sheet_points(self) -> int:
        """Points awarded for a clean sheet"""
        return {Position.GK: 4, Position.DEF: 4, Position.MID: 1, Position.FWD: 0}[self]

    @classmethod
    def from_element_type(cls, element_type: int) -> "Position":
        """Convert FPL element_type to Position enum"""
        try:
            return cls(element_type)
        except ValueError:
            raise ValueError(f"Invalid element_type: {element_type}")


app = Flask(__name__, static_folder="static", static_url_path="/static")
CORS(app)


# Serve static files
@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


# Serve our single page app for all routes
@app.route("/", defaults={"path": ""})
def serve_app(path):
    # if path.startswith("api/"):
    #     return {"error": "Not found"}, 404
    return send_from_directory("static", "index.html")


FPL_API_URL = "https://fantasy.premierleague.com/api"


def get_fpl_data():
    response = requests.get(f"{FPL_API_URL}/bootstrap-static/")
    return response.json()


def get_gameweek_data(gameweek):
    """Get detailed stats for a specific gameweek"""
    response = requests.get(f"{FPL_API_URL}/event/{gameweek}/live/")
    return response.json()


def calculate_player_xpts(player, position: Position):
    """Calculate expected points for a player"""
    # Calculate expected goals and assists points
    expected_goals = round(float(player.get("expected_goals", "0")))
    expected_assists = round(float(player.get("expected_assists", "0")))

    expected_goals_points = expected_goals * position.goal_points
    expected_assists_points = expected_assists * 3

    # Calculate clean sheet points based on position and minutes
    expected_clean_sheet_points = 0
    if player["minutes"] >= 60:
        expected_clean_sheet_points = (
            player["clean_sheets"] * position.clean_sheet_points
        )

    # Calculate appearance points
    appearance_points = 0
    if player["minutes"] > 0:
        appearance_points = 1 if player["minutes"] < 60 else 2

    # Calculate bonus and deductions
    bonus_and_deductions = player["total_points"] - (
        player["goals_scored"] * position.goal_points
        + player["assists"] * 3
        + (
            player["clean_sheets"] * position.clean_sheet_points
            if player["minutes"] >= 60
            else 0
        )
        + (
            1
            if player["minutes"] > 0 and player["minutes"] < 60
            else 2
            if player["minutes"] >= 60
            else 0
        )
    )

    return (
        expected_goals_points
        + expected_assists_points
        + expected_clean_sheet_points
        + appearance_points
        + bonus_and_deductions
    )


@app.route("/api/players", methods=["GET"])
def get_players():
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
                    "team": fpl_data["teams"][player["team"] - 1]["name"],
                    "photo": player["code"],
                }
            )

    return jsonify(players)


@app.route("/api/stats", methods=["GET"])
def get_stats():
    fpl_data = get_fpl_data()

    players = []
    for player in fpl_data["elements"]:
        position = Position.from_element_type(player["element_type"])
        xpts = calculate_player_xpts(player, position)

        players.append(
            {
                "id": player["id"],
                "first_name": player["first_name"],
                "second_name": player["second_name"],
                "team": fpl_data["teams"][player["team"] - 1]["name"],
                "position": position.name,
                "photo": player["code"],
                "cost": player["now_cost"] / 10,
                "selected": player["selected_by_percent"],
                "form": player["form"],
                "points": player["total_points"],
                "minutes": player["minutes"],
                "goals": player["goals_scored"],
                "assists": player["assists"],
                "clean_sheets": player["clean_sheets"],
                "xG": float(player.get("expected_goals", "0")),
                "xA": float(player.get("expected_assists", "0")),
                "xPts": xpts,
            }
        )

    return jsonify(players)


@app.route("/api/player/<int:player_id>", methods=["GET"])
def get_player_stats(player_id):
    try:
        fpl_data = get_fpl_data()
        player = None
        for p in fpl_data["elements"]:
            if p["id"] == player_id:
                player = p
                break

        if not player:
            return jsonify({"error": "Player not found"}), 404

        team_name = fpl_data["teams"][player["team"] - 1]["name"]
        position = Position.from_element_type(player["element_type"])

        # Calculate points from goals and assists
        goals_points = player["goals_scored"] * position.goal_points
        assists_points = player["assists"] * 3

        # Calculate clean sheet points based on position and minutes
        clean_sheet_points = 0
        if (
            player["minutes"] >= 60
        ):  # Only award clean sheet points if player played 60+ mins
            clean_sheet_points = player["clean_sheets"] * position.clean_sheet_points

        # Calculate appearance points
        appearance_points = 0
        if player["minutes"] > 0:
            appearance_points = 1 if player["minutes"] < 60 else 2

        # Calculate bonus and deductions
        bonus_and_deductions = player["total_points"] - (
            goals_points + assists_points + clean_sheet_points + appearance_points
        )

        # Actual points breakdown
        actual_points = {
            "goals": goals_points,
            "assists": assists_points,
            "clean_sheets": clean_sheet_points,
            "appearances": appearance_points,
            "bonus_and_deductions": bonus_and_deductions,
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

        # Use the same appearance points and bonus for expected
        expected_points = {
            "goals": expected_goals_points,
            "assists": expected_assists_points,
            "clean_sheets": expected_clean_sheet_points,
            "appearances": appearance_points,
            "bonus_and_deductions": bonus_and_deductions,
            "total": expected_goals_points
            + expected_assists_points
            + expected_clean_sheet_points
            + appearance_points
            + bonus_and_deductions,
        }

        response_data = {
            "first_name": player["first_name"],
            "second_name": player["second_name"],
            "team": team_name,
            "position": position.name,
            "photo": player["code"],
            "actual_stats": {
                "goals": player["goals_scored"],
                "assists": player["assists"],
                "clean_sheets": player["clean_sheets"],
                "minutes": player["minutes"],
                "points": actual_points,
            },
            "expected_stats": {
                "goals": expected_goals,
                "assists": expected_assists,
                "clean_sheets": player["clean_sheets"],
                "xG": float(player.get("expected_goals", "0")),
                "xA": float(player.get("expected_assists", "0")),
                "points": expected_points,
            },
        }

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/squad-stats", methods=["POST"])
def get_squad_stats():
    """Calculate total points and xPts for a given squad"""
    player_ids = request.json.get("player_ids", [])
    fpl_data = get_fpl_data()

    total_points = 0
    total_xpts = 0
    squad_info = []

    for player_id in player_ids:
        player = next((p for p in fpl_data["elements"] if p["id"] == player_id), None)
        if player:
            position = Position.from_element_type(player["element_type"])
            xpts = calculate_player_xpts(player, position)

            squad_info.append(
                {
                    "id": player["id"],
                    "first_name": player["first_name"],
                    "second_name": player["second_name"],
                    "team": fpl_data["teams"][player["team"] - 1]["name"],
                    "position": position.name,
                    "photo": player["code"],
                    "points": player["total_points"],
                    "minutes": player["minutes"],
                    "ppg": round(player["total_points"] / (player["minutes"] / 90), 2)
                    if player["minutes"] > 0
                    else 0,
                    "xPts": xpts,
                }
            )

            total_points += player["total_points"]
            total_xpts += xpts

    return jsonify(
        {
            "squad": squad_info,
            "total_points": total_points,
            "total_xpts": round(total_xpts),
        }
    )


@app.route("/api/gameweeks", methods=["GET"])
def get_gameweeks():
    """Get list of played gameweeks"""
    fpl_data = get_fpl_data()
    gameweeks = []

    for gw in fpl_data["events"]:
        if gw["finished"]:  # Only include finished gameweeks
            gameweeks.append(
                {
                    "id": gw["id"],
                    "name": f"Gameweek {gw['id']}",
                    "average_points": gw["average_entry_score"],
                    "highest_points": gw["highest_score"],
                    "is_current": gw["is_current"],
                }
            )

    return jsonify(gameweeks)


@app.route("/api/player/<int:player_id>/gameweek/<int:gameweek>", methods=["GET"])
def get_player_gameweek_stats(player_id, gameweek):
    """Get player stats for a specific gameweek"""
    try:
        gw_data = get_gameweek_data(gameweek)
        player_stats = next(
            (p for p in gw_data["elements"] if p["id"] == player_id), None
        )

        if not player_stats:
            return jsonify({"error": "Player not found"}), 404

        fpl_data = get_fpl_data()
        player = next((p for p in fpl_data["elements"] if p["id"] == player_id), None)
        position = Position.from_element_type(player["element_type"])

        stats = player_stats["stats"]

        # Calculate expected points for the gameweek
        xpts = 0
        if "expected_goals" in stats:
            xpts += float(stats["expected_goals"]) * position.goal_points
        if "expected_assists" in stats:
            xpts += float(stats["expected_assists"]) * 3
        if stats["minutes"] >= 60 and stats["clean_sheets"]:
            xpts += position.clean_sheet_points
        if stats["minutes"] > 0:
            xpts += 1 if stats["minutes"] < 60 else 2

        return jsonify(
            {
                "points": stats["total_points"],
                "minutes": stats["minutes"],
                "goals": stats["goals_scored"],
                "assists": stats["assists"],
                "clean_sheets": stats["clean_sheets"],
                "xPts": round(xpts, 2),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
