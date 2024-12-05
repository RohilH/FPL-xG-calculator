import { POSITION_MAP } from './playerHelpers';

const POSITION_TYPE_MAP = {
  'GK': 1,
  'DEF': 2,
  'MID': 3,
  'FWD': 4
};

export const filterPlayersByPosition = (players, position, searchTerm = '') => {
  const normalizedSearch = searchTerm.toLowerCase();
  const positionType = POSITION_TYPE_MAP[position];
  
  return players
    .filter(player => {
      const matchesPosition = player.element_type === positionType;
      
      if (!matchesPosition) return false;
      
      if (!searchTerm) return true;
      
      const playerName = `${player.first_name} ${player.second_name}`.toLowerCase();
      return playerName.includes(normalizedSearch);
    });
}; 