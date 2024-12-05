import React, { useState, useEffect } from 'react';

function SquadBuilder() {
  const [squad, setSquad] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm.length >= 3) {
        searchPlayers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const searchPlayers = async () => {
    try {
      const response = await fetch(`/api/players?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const addPlayerToSquad = async (player) => {
    if (squad.length >= 11) {
      alert('Squad is full! Remove a player first.');
      return;
    }

    if (squad.some(p => p.id === player.id)) {
      alert('Player already in squad!');
      return;
    }

    try {
      const response = await fetch(`/api/player/${player.id}`);
      const stats = await response.json();
      
      const playerWithStats = {
        ...player,
        stats: stats.expected.total
      };

      const newSquad = [...squad, playerWithStats];
      setSquad(newSquad);
      setSearchTerm('');
      setSearchResults([]);
      calculateTotalPoints(newSquad);
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const removePlayerFromSquad = (playerId) => {
    const newSquad = squad.filter(player => player.id !== playerId);
    setSquad(newSquad);
    calculateTotalPoints(newSquad);
  };

  const calculateTotalPoints = (currentSquad) => {
    const total = currentSquad.reduce((sum, player) => sum + player.stats, 0);
    setTotalPoints(total.toFixed(2));
  };

  return (
    <div>
      <h1>Squad Builder</h1>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a player to add..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="player-list">
            {searchResults.map((player) => (
              <li key={player.id} onClick={() => addPlayerToSquad(player)}>
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

      <div className="stats-container">
        <h2>Your Squad ({squad.length}/11)</h2>
        <div className="stats-grid">
          {squad.map((player) => (
            <div key={player.id} className="stat-box">
              <div className="stats-header">
                <img 
                  src={player.photo} 
                  alt={player.name}
                  onError={(e) => {
                    e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                  }}
                />
                <div className="stats-header-info">
                  <h2>{player.name}</h2>
                  <p>{player.team}</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-label">Expected Points</span>
                <span className="stat-value">{player.stats.toFixed(2)}</span>
              </div>
              <button
                onClick={() => removePlayerFromSquad(player.id)}
                style={{
                  backgroundColor: '#37003c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {squad.length > 0 && (
          <div className="total-points">
            <h3>Total Expected Points: {totalPoints}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default SquadBuilder; 