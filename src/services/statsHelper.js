const calculateGoalPoints = (goals, position) => {
  const pointsPerGoal = position === 'GOALKEEPER' || position === 'DEFENDER' 
    ? 6 
    : position === 'MIDFIELDER' 
      ? 5 
      : 4;
  return goals * pointsPerGoal;
};

const calculateAssistPoints = (assists) => assists * 3;

const calculateCleanSheetPoints = (cleanSheets, position) => {
  const pointsPerCleanSheet = position === 'GOALKEEPER' || position === 'DEFENDER'
    ? 4
    : position === 'MIDFIELDER'
      ? 1
      : 0;
  return cleanSheets * pointsPerCleanSheet;
};

const calculateOtherPoints = (totalPoints, goalPoints, assistPoints, cleanSheetPoints) => {
  return totalPoints - (goalPoints + assistPoints + cleanSheetPoints);
};

export const formatPlayerStats = (player) => {
  const { stats, position } = player;
  
  // Calculate actual points breakdown
  const actualGoalPoints = calculateGoalPoints(stats.goals, position);
  const actualAssistPoints = calculateAssistPoints(stats.assists);
  const actualCleanSheetPoints = calculateCleanSheetPoints(stats.cleanSheets, position);
  const actualOtherPoints = calculateOtherPoints(
    stats.points,
    actualGoalPoints,
    actualAssistPoints,
    actualCleanSheetPoints
  );

  // Calculate expected points using rounded values
  const roundedExpectedGoals = Math.round(stats.xG);
  const roundedExpectedAssists = Math.round(stats.xA);
  
  const expectedGoalPoints = calculateGoalPoints(roundedExpectedGoals, position);
  const expectedAssistPoints = calculateAssistPoints(roundedExpectedAssists);
  const expectedCleanSheetPoints = calculateCleanSheetPoints(stats.cleanSheets, position);
  
  // Calculate total expected points by adding the expected points components to actual other points
  const expectedTotalPoints = expectedGoalPoints + expectedAssistPoints + expectedCleanSheetPoints + actualOtherPoints;

  return {
    actual: {
      stats: {
        goals: stats.goals,
        assists: stats.assists,
        clean_sheets: stats.cleanSheets,
        minutes: stats.minutes
      },
      points: {
        total: stats.points,
        goals: actualGoalPoints,
        assists: actualAssistPoints,
        clean_sheets: actualCleanSheetPoints,
        other: actualOtherPoints
      }
    },
    expected: {
      stats: {
        raw_xg: stats.xG,
        raw_xa: stats.xA,
        expected_goals: roundedExpectedGoals,
        expected_assists: roundedExpectedAssists,
        clean_sheets: stats.cleanSheets
      },
      points: {
        total: expectedTotalPoints,
        goals: expectedGoalPoints,
        assists: expectedAssistPoints,
        clean_sheets: expectedCleanSheetPoints,
        other: actualOtherPoints  // Reuse actual other points
      }
    }
  };
}; 