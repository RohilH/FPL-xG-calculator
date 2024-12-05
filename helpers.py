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


def get_completed_gameweeks():
    """Get list of completed gameweeks"""
    fpl_data = get_fpl_data()
    completed_gws = []

    for gw in fpl_data["events"]:
        if gw["finished"]:
            completed_gws.append({"id": gw["id"], "name": f"Gameweek {gw['id']}"})

    return completed_gws


def calculate_base_points(player, position: Position, stats):
    """Calculate the base points (goals, assists, clean sheets) for a player"""
    goals_points = stats["goals_scored"] * position.goal_points
    assists_points = stats["assists"] * 3

    clean_sheet_points = 0
    if stats["minutes"] >= 60:
        clean_sheet_points = stats["clean_sheets"] * position.clean_sheet_points

    return {
        "goals": goals_points,
        "assists": assists_points,
        "clean_sheets": clean_sheet_points,
    }


def calculate_other_points(total_points, base_points):
    """Calculate other points (appearances, bonus, deductions) as the remainder"""
    total_base_points = sum(base_points.values())
    return total_points - total_base_points


def calculate_points_breakdown(total_points, stats, position: Position):
    """Calculate complete points breakdown for a player"""
    base_points = calculate_base_points(None, position, stats)
    other_points = calculate_other_points(total_points, base_points)

    return {**base_points, "other": other_points, "total": total_points}


def calculate_expected_points_breakdown(
    stats, position: Position, actual_points_breakdown
):
    """Calculate expected points breakdown for a player"""
    # Calculate expected goals and assists
    expected_goals = round(float(stats.get("expected_goals", "0")))
    expected_assists = round(float(stats.get("expected_assists", "0")))

    # Calculate base expected points
    expected_base_points = {
        "goals": expected_goals * position.goal_points,
        "assists": expected_assists * 3,
        "clean_sheets": actual_points_breakdown[
            "clean_sheets"
        ],  # Use actual clean sheets
    }

    # Use the same other points as actual
    other_points = actual_points_breakdown["other"]

    total_points = sum(expected_base_points.values()) + other_points

    return {**expected_base_points, "other": other_points, "total": total_points}


def get_player_season_stats(player, position: Position):
    """Get complete season stats and points breakdown for a player"""
    actual_stats = {
        "goals_scored": player["goals_scored"],
        "assists": player["assists"],
        "clean_sheets": player["clean_sheets"],
        "minutes": player["minutes"],
        "expected_goals": player.get("expected_goals", "0"),
        "expected_assists": player.get("expected_assists", "0"),
    }

    actual_points_breakdown = calculate_points_breakdown(
        player["total_points"], actual_stats, position
    )

    return {
        "actual": {
            "stats": {
                "goals": actual_stats["goals_scored"],
                "assists": actual_stats["assists"],
                "clean_sheets": actual_stats["clean_sheets"],
                "minutes": actual_stats["minutes"],
            },
            "points": actual_points_breakdown,
        },
        "expected": {
            "stats": {
                "raw_xg": float(actual_stats["expected_goals"]),
                "raw_xa": float(actual_stats["expected_assists"]),
                "expected_goals": round(float(actual_stats["expected_goals"])),
                "expected_assists": round(float(actual_stats["expected_assists"])),
                "clean_sheets": actual_stats["clean_sheets"],
            },
            "points": calculate_expected_points_breakdown(
                actual_stats, position, actual_points_breakdown
            ),
        },
    }


def get_player_gameweek_stats(player_id, gameweek, position: Position):
    """Get complete gameweek stats and points breakdown for a player"""
    gw_data = get_gameweek_data(gameweek)
    player_data = next(
        (p["stats"] for p in gw_data["elements"] if p["id"] == player_id), None
    )

    if not player_data:
        return None

    actual_stats = {
        "goals_scored": player_data["goals_scored"],
        "assists": player_data["assists"],
        "clean_sheets": player_data["clean_sheets"],
        "minutes": player_data["minutes"],
        "expected_goals": player_data.get("expected_goals", "0"),
        "expected_assists": player_data.get("expected_assists", "0"),
    }

    actual_points_breakdown = calculate_points_breakdown(
        player_data["total_points"], actual_stats, position
    )

    return {
        "actual": {
            "stats": {
                "goals": actual_stats["goals_scored"],
                "assists": actual_stats["assists"],
                "clean_sheets": actual_stats["clean_sheets"],
                "minutes": actual_stats["minutes"],
            },
            "points": actual_points_breakdown,
        },
        "expected": {
            "stats": {
                "raw_xg": float(actual_stats["expected_goals"]),
                "raw_xa": float(actual_stats["expected_assists"]),
                "expected_goals": round(float(actual_stats["expected_goals"])),
                "expected_assists": round(float(actual_stats["expected_assists"])),
                "clean_sheets": actual_stats["clean_sheets"],
            },
            "points": calculate_expected_points_breakdown(
                actual_stats, position, actual_points_breakdown
            ),
        },
    }


def calculate_player_xpts(player, position: Position):
    """Calculate total expected points for a player"""
    return get_player_season_stats(player, position)["expected"]["points"]["total"]
