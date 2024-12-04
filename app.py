from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from enum import Enum
import os


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


app = Flask(__name__)
CORS(app)

FPL_API_URL = "https://fantasy.premierleague.com/api"


def get_fpl_data():
    response = requests.get(f"{FPL_API_URL}/bootstrap-static/")
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


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/stats")
def stats():
    return send_from_directory(".", "stats.html")


@app.route("/api/players", methods=["GET"])
def get_players():
    search_term = request.args.get("search", "").lower()
    fpl_data = get_fpl_data()

    players = []
    for player in fpl_data["elements"]:
        player_name = f"{player['first_name']} {player['second_name']}".lower()
        if search_term in player_name:
            players.append(
                {
                    "id": player["id"],
                    "name": f"{player['first_name']} {player['second_name']}",
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
                "name": f"{player['first_name']} {player['second_name']}",
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

        player_name = f"{player['first_name']} {player['second_name']}"
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
            "name": player_name,
            "team": team_name,
            "position": position.name,
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
