import unicodedata
import requests
from enums import Position


def normalize_name(name: str) -> str:
    """
    Normalize a name by:
    1. Converting to lowercase
    2. Removing diacritics (accents)
    3. Converting special characters to their basic form
    """
    # Convert to lowercase
    name = name.lower()

    # Normalize unicode characters and remove diacritics
    normalized = unicodedata.normalize("NFKD", name)
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))

    # Replace special characters with their basic form
    replacements = {"ø": "o", "æ": "ae", "å": "a", "ß": "ss", "ð": "d", "þ": "th"}

    for old, new in replacements.items():
        normalized = normalized.replace(old, new)

    return normalized


FPL_API_URL = "https://fantasy.premierleague.com/api"


def get_fpl_data():
    response = requests.get(f"{FPL_API_URL}/bootstrap-static/")
    return response.json()


def get_gameweek_data(gameweek):
    """Get detailed stats for a specific gameweek"""
    response = requests.get(f"{FPL_API_URL}/event/{gameweek}/live/")
    return response.json()


def calculate_base_points(player, position: Position):
    """Calculate the base points (goals, assists, clean sheets) for a player"""
    goals_points = player["goals_scored"] * position.goal_points
    assists_points = player["assists"] * 3

    clean_sheet_points = 0
    if player["minutes"] >= 60:
        clean_sheet_points = player["clean_sheets"] * position.clean_sheet_points

    return {
        "goals": goals_points,
        "assists": assists_points,
        "clean_sheets": clean_sheet_points,
    }


def calculate_other_points(player, base_points):
    """Calculate other points (appearances, bonus, deductions) as the remainder"""
    total_base_points = sum(base_points.values())
    return player["total_points"] - total_base_points


def calculate_points_breakdown(player, position: Position):
    """Calculate complete points breakdown for a player"""
    base_points = calculate_base_points(player, position)
    other_points = calculate_other_points(player, base_points)

    return {**base_points, "other": other_points, "total": player["total_points"]}


def calculate_expected_points_breakdown(player, position: Position):
    """Calculate expected points breakdown for a player"""
    # Calculate expected goals and assists
    expected_goals = round(float(player.get("expected_goals", "0")))
    expected_assists = round(float(player.get("expected_assists", "0")))

    # Calculate base expected points
    expected_base_points = {
        "goals": expected_goals * position.goal_points,
        "assists": expected_assists * 3,
        "clean_sheets": calculate_base_points(player, position)[
            "clean_sheets"
        ],  # Use actual clean sheets
    }

    # Use the same other points as actual
    other_points = calculate_other_points(
        player, calculate_base_points(player, position)
    )

    total_points = sum(expected_base_points.values()) + other_points

    return {**expected_base_points, "other": other_points, "total": total_points}


def get_player_stats(player, position: Position):
    """Get complete stats and points breakdown for a player"""
    actual_stats = {
        "goals": player["goals_scored"],
        "assists": player["assists"],
        "clean_sheets": player["clean_sheets"],
        "minutes": player["minutes"],
    }

    expected_stats = {
        "raw_xg": float(player.get("expected_goals", "0")),
        "raw_xa": float(player.get("expected_assists", "0")),
        "expected_goals": round(float(player.get("expected_goals", "0"))),
        "expected_assists": round(float(player.get("expected_assists", "0"))),
        "clean_sheets": player["clean_sheets"],
    }

    return {
        "actual": {
            "stats": actual_stats,
            "points": calculate_points_breakdown(player, position),
        },
        "expected": {
            "stats": expected_stats,
            "points": calculate_expected_points_breakdown(player, position),
        },
    }


def calculate_player_xpts(player, position: Position):
    """Calculate total expected points for a player"""
    return calculate_expected_points_breakdown(player, position)["total"]
