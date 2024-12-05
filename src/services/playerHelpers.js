import { Position } from '../enums';

export const calculatePlayerXpts = (player, position) => {
  const minutes = parseFloat(player.minutes);
  const gamesPlayed = minutes / 90;

  if (gamesPlayed === 0) return 0;

  let xpts = 0;
  
  // Minutes points (2 points per game if they played >= 60 minutes, 1 point otherwise)
  xpts += (minutes >= 60 ? 2 : 1) * gamesPlayed;

  // Goals points
  const expectedGoals = parseFloat(player.expected_goals || 0);
  if (position === Position.GOALKEEPER || position === Position.DEFENDER) {
    xpts += expectedGoals * 6;
  } else if (position === Position.MIDFIELDER) {
    xpts += expectedGoals * 5;
  } else {
    xpts += expectedGoals * 4;
  }

  // Assists points
  const expectedAssists = parseFloat(player.expected_assists || 0);
  xpts += expectedAssists * 3;

  // Clean sheet points
  const cleanSheets = parseFloat(player.clean_sheets);
  if (position === Position.GOALKEEPER || position === Position.DEFENDER) {
    xpts += (cleanSheets / gamesPlayed) * 4 * gamesPlayed;
  } else if (position === Position.MIDFIELDER) {
    xpts += (cleanSheets / gamesPlayed) * 1 * gamesPlayed;
  }

  return Math.round(xpts * 10) / 10;
};

export const POSITION_MAP = {
  'GK': Position.GOALKEEPER,
  'DEF': Position.DEFENDER,
  'MID': Position.MIDFIELDER,
  'FWD': Position.FORWARD
};

export const POSITION_ABBREVIATION_MAP = {
  [Position.GOALKEEPER]: 'GK',
  [Position.DEFENDER]: 'DEF',
  [Position.MIDFIELDER]: 'MID',
  [Position.FORWARD]: 'FWD'
};

export const formatPlayerData = (player, fplData) => {
  const position = Position.fromElementType(player.element_type);
  return {
    id: player.id,
    first_name: player.first_name,
    second_name: player.second_name,
    name: `${player.first_name} ${player.second_name}`,
    team: fplData.teams[player.team - 1].name,
    photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`,
    position,
    stats: {
      points: player.total_points,
      minutes: player.minutes,
      goals: player.goals_scored,
      assists: player.assists,
      cleanSheets: player.clean_sheets,
      xG: parseFloat(player.expected_goals || 0),
      xA: parseFloat(player.expected_assists || 0),
      form: parseFloat(player.form),
      selectedBy: parseFloat(player.selected_by_percent),
      cost: player.now_cost / 10,
      xPts: calculatePlayerXpts(player, position)
    }
  };
};

export const getUniqueTeams = (fplData) => {
  const teams = new Set(fplData.elements.map(player => fplData.teams[player.team - 1].name));
  return ['All teams', ...Array.from(teams).sort()];
}; 