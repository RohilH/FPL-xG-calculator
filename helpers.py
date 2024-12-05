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
