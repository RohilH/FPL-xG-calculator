import { Position } from '../enums';

export const getPlayerSeasonStats = (player, position) => {
  const minutes = parseFloat(player.minutes);
  const gamesPlayed = minutes / 90;

  if (gamesPlayed === 0) {
    return {
      actual: {},
      expected: {},
    };
  }

  const actual = {
    points: player.total_points,
    minutes,
    goals: player.goals_scored,
    assists: player.assists,
    cleanSheets: player.clean_sheets,
    form: parseFloat(player.form),
    selectedBy: parseFloat(player.selected_by_percent),
    cost: player.now_cost / 10,
  };

  const expected = {
    goals: parseFloat(player.expected_goals || 0),
    assists: parseFloat(player.expected_assists || 0),
  };

  // Calculate xPts
  let xpts = 0;
  
  // Minutes points
  xpts += (minutes >= 60 ? 2 : 1) * gamesPlayed;

  // Goals points
  if (position === Position.GOALKEEPER || position === Position.DEFENDER) {
    xpts += expected.goals * 6;
  } else if (position === Position.MIDFIELDER) {
    xpts += expected.goals * 5;
  } else {
    xpts += expected.goals * 4;
  }

  // Assists points
  xpts += expected.assists * 3;

  // Clean sheet points
  if (position === Position.GOALKEEPER || position === Position.DEFENDER) {
    xpts += (actual.cleanSheets / gamesPlayed) * 4 * gamesPlayed;
  } else if (position === Position.MIDFIELDER) {
    xpts += (actual.cleanSheets / gamesPlayed) * 1 * gamesPlayed;
  }

  expected.points = Math.round(xpts * 10) / 10;

  return {
    actual,
    expected,
  };
}; 