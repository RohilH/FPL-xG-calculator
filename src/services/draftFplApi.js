export const getDraftUserData = async (email, password) => {
  const response = await fetch('/api/draft-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate');
  }

  return response.json();
};

export const getDraftLeagues = async () => {
  const response = await fetch('/api/draft-leagues');
  if (!response.ok) {
    throw new Error('Failed to fetch draft leagues');
  }
  return response.json();
};

export const getDraftLeagueDetails = async (leagueId) => {
  const response = await fetch(`/api/draft-league/${leagueId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch league details');
  }
  return response.json();
};

export const getDraftTeam = async (leagueId, teamId) => {
  const response = await fetch(`/api/draft-team/${leagueId}/${teamId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch team details');
  }
  return response.json();
}; 