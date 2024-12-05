import { Position } from '../enums';

let cachedFplData = null;

export const getFplData = async () => {
  if (cachedFplData) return cachedFplData;

  const response = await fetch('/api/fpl-data');
  if (!response.ok) {
    throw new Error('Failed to fetch FPL data');
  }
  cachedFplData = await response.json();
  return cachedFplData;
};

export const normalizeString = (str) => {
  return str.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[åÅ]/g, 'a');
};

export const searchPlayers = async (searchTerm) => {
  const fplData = await getFplData();
  const normalizedSearch = normalizeString(searchTerm);

  return fplData.elements
    .filter(player => {
      const webName = normalizeString(player.web_name);
      const fullName = normalizeString(`${player.first_name} ${player.second_name}`);
      return webName.includes(normalizedSearch) || fullName.includes(normalizedSearch);
    })
    .map(player => {
      const position = Position.fromElementType(player.element_type);
      
      return {
        id: player.id,
        first_name: player.first_name,
        second_name: player.second_name,
        name: player.web_name,
        team: fplData.teams[player.team - 1].name,
        photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`,
        position,
      };
    });
} 