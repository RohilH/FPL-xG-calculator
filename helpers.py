import requests


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
