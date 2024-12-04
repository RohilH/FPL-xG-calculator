import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}


def get_player_id(player_name, team_name):
    """Search for a player on Fotmob and return their ID."""
    encoded_name = player_name.replace(" ", "+")
    search_url = (
        f"https://www.fotmob.com/api/search/suggest?hits=50&lang=en&term={encoded_name}"
    )

    try:
        response = requests.get(search_url, headers=HEADERS)
        if response.status_code != 200:
            return None

        data = response.json()
        for section in data:
            for suggestion in section.get("suggestions", []):
                if suggestion.get("type") == "player":
                    if team_name.lower() in suggestion.get("teamName", "").lower():
                        return suggestion.get("id")
        return None
    except Exception:
        return None


def get_player_stats(player_id):
    """Get detailed stats for a player from Fotmob."""
    if not player_id:
        return None

    # Get player data and season ID
    player_url = f"https://www.fotmob.com/api/playerData?id={player_id}"
    try:
        player_response = requests.get(player_url, headers=HEADERS)
        if player_response.status_code != 200:
            return None

        player_data = player_response.json()

        # Find Premier League season ID
        premier_league_season = None
        if "statSeasons" in player_data:
            current_season = player_data["statSeasons"][0]
            for tournament in current_season.get("tournaments", []):
                if tournament.get("name") == "Premier League":
                    premier_league_season = tournament
                    break

        if not premier_league_season:
            return None

        # Get detailed stats
        stats_url = f"https://www.fotmob.com/api/playerStats?playerId={player_id}&seasonId={premier_league_season['tournamentId']}"
        stats_response = requests.get(stats_url, headers=HEADERS)
        if stats_response.status_code != 200:
            return None

        stats_data = stats_response.json()

        # Extract xG and xA
        stats = {"xG": 0.0, "xA": 0.0}
        if "statsSection" in stats_data:
            for group in stats_data["statsSection"]["items"]:
                if group.get("title") == "Shooting":
                    for item in group.get("items", []):
                        if item.get("title") == "xG":
                            try:
                                stats["xG"] = float(item.get("statValue", "0"))
                            except (ValueError, TypeError):
                                pass
                elif group.get("title") == "Passing":
                    for item in group.get("items", []):
                        if item.get("title") == "xA":
                            try:
                                stats["xA"] = float(item.get("statValue", "0"))
                            except (ValueError, TypeError):
                                pass

        return stats
    except Exception:
        return None
