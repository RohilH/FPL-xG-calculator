import React, { useState, useEffect } from 'react';

function PlayerSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm.length >= 3 && !selectedPlayer) {
        fetchPlayers();
        setShowDropdown(true);
      } else {
        setPlayers([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, selectedPlayer]);

  const fetchPlayers = async () => {
    try {
      const normalizedSearch = searchTerm
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[øØ]/g, 'o')
        .replace(/[æÆ]/g, 'ae')
        .replace(/[åÅ]/g, 'a');

      const response = await fetch(`/api/players?search=${encodeURIComponent(normalizedSearch)}`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handlePlayerSelect = async (player) => {
    setSelectedPlayer(player);
    setPlayers([]);
    setSearchTerm(player.name);
    setShowDropdown(false);
    
    try {
      const response = await fetch(`/api/player/${player.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) {
      setSelectedPlayer(null);
      setStats(null);
    }
  };

  const formatStatLabel = (key) => {
    const specialCases = {
      'raw_xg': 'xG',
      'raw_xa': 'xA',
      'expected_goals': 'Expected Goals (rounded)',
      'expected_assists': 'Expected Assists (rounded)'
    };
    
    return specialCases[key] || 
      key.split('_')
         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
         .join(' ');
  };

  const orderActualStats = (stats) => {
    const order = ['goals', 'assists', 'clean_sheets', 'minutes'];
    return Object.entries(stats)
      .sort(([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB));
  };

  const orderExpectedStats = (stats) => {
    const order = ['raw_xg', 'raw_xa', 'expected_goals', 'expected_assists', 'clean_sheets'];
    return Object.entries(stats)
      .sort(([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB));
  };

  return (
    <div>
      <h1>Player Search</h1>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a player..."
          value={searchTerm}
          onChange={handleInputChange}
        />
        {showDropdown && players.length > 0 && (
          <ul className="player-list">
            {players.map((player) => (
              <li key={player.id} onClick={() => handlePlayerSelect(player)}>
                <img 
                  src={player.photo} 
                  alt={player.name}
                  className="player-photo"
                  onError={(e) => {
                    e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                  }}
                />
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-team">{player.team}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedPlayer && stats && (
        <div className="stats-container">
          <div className="stats-header">
            <img 
              src={selectedPlayer.photo} 
              alt={selectedPlayer.name}
              onError={(e) => {
                e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
              }}
            />
            <div className="stats-header-info">
              <h2>{selectedPlayer.name}</h2>
              <p>{selectedPlayer.team}</p>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-box">
              <h3>Actual Stats</h3>
              <div>
                {orderActualStats(stats.actual.stats).map(([key, value]) => (
                  <div key={key} className="stat-item">
                    <span className="stat-label">{formatStatLabel(key)}</span>
                    <span className="stat-value">{value}</span>
                  </div>
                ))}
                <div className="total-points">
                  <div className="stat-item">
                    <span className="stat-label">Total Points</span>
                    <span className="stat-value">{stats.actual.points.total}</span>
                  </div>
                  <div className="points-breakdown">
                    <small>Goals: {stats.actual.points.goals}</small>
                    <small>Assists: {stats.actual.points.assists}</small>
                    <small>Clean Sheets: {stats.actual.points.clean_sheets}</small>
                    <small>Appearances: {stats.actual.points.appearances}</small>
                    <small>Bonus & Deductions: {stats.actual.points.bonus_and_deductions}</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="stat-box">
              <h3>Expected Stats</h3>
              <div>
                {orderExpectedStats(stats.expected.stats).map(([key, value]) => (
                  <div key={key} className="stat-item">
                    <span className="stat-label">{formatStatLabel(key)}</span>
                    <span className="stat-value">
                      {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}
                    </span>
                  </div>
                ))}
                <div className="total-points">
                  <div className="stat-item">
                    <span className="stat-label">Expected Points</span>
                    <span className="stat-value">{stats.expected.points.total}</span>
                  </div>
                  <div className="points-breakdown">
                    <small>Goals: {stats.expected.points.goals}</small>
                    <small>Assists: {stats.expected.points.assists}</small>
                    <small>Clean Sheets: {stats.expected.points.clean_sheets}</small>
                    <small>Appearances: {stats.expected.points.appearances}</small>
                    <small>Bonus & Deductions: {stats.expected.points.bonus_and_deductions}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerSearch; 