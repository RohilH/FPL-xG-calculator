import React, { useState, useEffect } from 'react';

function SquadBuilder() {
  const [squad, setSquad] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const [allPositionPlayers, setAllPositionPlayers] = useState([]);
  const [playerCache, setPlayerCache] = useState({});
  const [squadStats, setSquadStats] = useState({
    totalPoints: 0,
    expectedPoints: 0
  });

  const resetSquad = () => {
    setSquad([]);
    setSquadStats({
      totalPoints: 0,
      expectedPoints: 0
    });
  };

  const getDisplayName = (fullName) => {
    const names = fullName.split(' ');
    if (names.length <= 2) return names[names.length - 1];
    
    // For names like "Van Dijk", "De Bruyne", etc.
    const commonPrefixes = ['van', 'de', 'der', 'den', 'dos', 'da', 'di'];
    const secondToLast = names[names.length - 2].toLowerCase();
    
    if (commonPrefixes.includes(secondToLast)) {
      return `${names[names.length - 2]} ${names[names.length - 1]}`;
    }
    
    return names[names.length - 1];
  };

  useEffect(() => {
    if (activeSearch) {
      fetchPositionPlayers();
    } else {
      setSearchResults([]);
      setAllPositionPlayers([]);
      setSearchTerm('');
    }
  }, [activeSearch]);

  useEffect(() => {
    if (activeSearch && allPositionPlayers.length > 0) {
      const availablePlayers = allPositionPlayers.filter(
        player => !squad.some(squadPlayer => squadPlayer.id === player.id)
      );
      
      const filtered = availablePlayers.filter(player => {
        const fullName = `${player.name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setSearchResults(filtered);
    }
  }, [searchTerm, allPositionPlayers, squad]);

  const fetchPositionPlayers = async (searchPosition) => {
    const position = searchPosition || activeSearch.position;
    
    // Check cache first
    if (playerCache[position]) {
      setAllPositionPlayers(playerCache[position]);
      setSearchResults(playerCache[position]);
      return;
    }

    try {
      const response = await fetch('/api/league-stats');
      const data = await response.json();
      const positionPlayers = data
        .filter(player => player.position === position)
        .sort((a, b) => b.points - a.points);
      
      // Update cache
      setPlayerCache(prev => ({
        ...prev,
        [position]: positionPlayers
      }));
      
      setAllPositionPlayers(positionPlayers);
      setSearchResults(positionPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const addPlayerToSquad = async (player) => {
    // Check for duplicate player
    if (squad.some(p => p.id === player.id)) {
      alert('This player is already in your squad!');
      return;
    }

    // Calculate current position counts
    const positionCounts = squad.reduce((counts, p) => {
      counts[p.position] = (counts[p.position] || 0) + 1;
      return counts;
    }, {});

    // Check total squad size
    if (squad.length >= 11) {
      alert('Squad is full! Remove a player first.');
      return;
    }

    // Validate position-specific rules
    const newPositionCount = (positionCounts[player.position] || 0) + 1;
    const remainingSlots = 11 - squad.length - 1; // -1 for current player being added

    // Position-specific validations
    if (player.position === 'GK' && newPositionCount > 1) {
      alert('You can only have one goalkeeper!');
      return;
    }

    if (player.position === 'DEF' && newPositionCount > 5) {
      alert('You can only have up to 5 defenders!');
      return;
    }

    if (player.position === 'MID' && newPositionCount > 5) {
      alert('You can only have up to 5 midfielders!');
      return;
    }

    if (player.position === 'FWD' && newPositionCount > 3) {
      alert('You can only have up to 3 forwards!');
      return;
    }

    // Check if adding this player would prevent having at least 1 forward
    if (player.position !== 'FWD') {
      const currentNonFwdCount = (positionCounts['DEF'] || 0) + (positionCounts['MID'] || 0);
      const newNonFwdCount = currentNonFwdCount + 1;
      const maxNonFwdPlayers = 10; // 11 total - 1 minimum forward

      if (newNonFwdCount > maxNonFwdPlayers) {
        alert('You must leave space for at least one forward!');
        return;
      }
    }

    try {
      const response = await fetch(`/api/player/${player.id}`);
      const stats = await response.json();
      
      const playerWithStats = {
        ...player,
        points: stats.actual.points.total,
        xPts: stats.expected.points.total,
        ppg: (stats.actual.points.total / (stats.actual.stats.minutes / 90)).toFixed(2),
        positionIndex: activeSearch.index
      };

      // Replace player at the specific position index
      const newSquad = squad.filter(p => 
        !(p.position === player.position && p.positionIndex === activeSearch.index)
      );
      newSquad.push(playerWithStats);

      setSquad(newSquad);
      setSearchTerm('');
      setSearchResults([]);
      setActiveSearch(null);
      updateSquadStats(newSquad);
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const removePlayerFromSquad = (playerId) => {
    const newSquad = squad.filter(player => player.id !== playerId);
    setSquad(newSquad);
    updateSquadStats(newSquad);
  };

  const updateSquadStats = (currentSquad) => {
    const stats = currentSquad.reduce((acc, player) => ({
      totalPoints: acc.totalPoints + player.points,
      expectedPoints: acc.expectedPoints + player.xPts
    }), { totalPoints: 0, expectedPoints: 0 });

    setSquadStats(stats);
  };

  const handleSlotClick = (position, index) => {
    // Calculate current position counts
    const positionCounts = squad.reduce((counts, p) => {
      counts[p.position] = (counts[p.position] || 0) + 1;
      return counts;
    }, {});

    // Check if squad is already full
    if (squad.length >= 11) {
      alert('Squad is full! Remove a player first.');
      return;
    }

    // Check basic position limits
    if (position === 'GK' && (positionCounts['GK'] || 0) >= 1) {
      alert('You can only have one goalkeeper!');
      return;
    }

    if (position === 'DEF' && (positionCounts['DEF'] || 0) >= 5) {
      alert('You can only have up to 5 defenders!');
      return;
    }

    if (position === 'MID' && (positionCounts['MID'] || 0) >= 5) {
      alert('You can only have up to 5 midfielders!');
      return;
    }

    if (position === 'FWD' && (positionCounts['FWD'] || 0) >= 3) {
      alert('You can only have up to 3 forwards!');
      return;
    }

    // Special validation for the 11th player selection
    if (squad.length === 10) {
      const futurePositionCounts = {
        GK: (positionCounts['GK'] || 0) + (position === 'GK' ? 1 : 0),
        DEF: (positionCounts['DEF'] || 0) + (position === 'DEF' ? 1 : 0),
        MID: (positionCounts['MID'] || 0) + (position === 'MID' ? 1 : 0),
        FWD: (positionCounts['FWD'] || 0) + (position === 'FWD' ? 1 : 0)
      };

      // Check final squad composition rules
      if (futurePositionCounts.GK !== 1) {
        alert('Final squad must have exactly 1 goalkeeper!');
        return;
      }

      if (futurePositionCounts.DEF < 3) {
        alert('Final squad must have at least 3 defenders!');
        return;
      }

      if (futurePositionCounts.FWD < 1) {
        alert('Final squad must have at least 1 forward!');
        return;
      }
    } else {
      // Validation for selections 1-10: Check if this selection would prevent valid final composition
      const minRequiredPlayers = {
        GK: 1,
        DEF: 3,
        FWD: 1
      };

      // Calculate remaining slots after this selection
      const remainingSlots = 10 - squad.length;
      const futurePositionCounts = {
        GK: (positionCounts['GK'] || 0) + (position === 'GK' ? 1 : 0),
        DEF: (positionCounts['DEF'] || 0) + (position === 'DEF' ? 1 : 0),
        MID: (positionCounts['MID'] || 0) + (position === 'MID' ? 1 : 0),
        FWD: (positionCounts['FWD'] || 0) + (position === 'FWD' ? 1 : 0)
      };

      // Check if we can still meet minimum requirements
      if (futurePositionCounts.GK > minRequiredPlayers.GK) {
        alert('You can only have 1 goalkeeper!');
        return;
      }

      const slotsNeededForDef = Math.max(0, minRequiredPlayers.DEF - futurePositionCounts.DEF);
      const slotsNeededForFwd = Math.max(0, minRequiredPlayers.FWD - futurePositionCounts.FWD);
      const slotsNeededForGK = Math.max(0, minRequiredPlayers.GK - futurePositionCounts.GK);
      
      const totalSlotsNeeded = slotsNeededForDef + slotsNeededForFwd + slotsNeededForGK;
      
      if (remainingSlots < totalSlotsNeeded) {
        if (slotsNeededForDef > 0) {
          alert('You must leave enough slots for at least 3 defenders!');
        } else if (slotsNeededForFwd > 0) {
          alert('You must leave enough slots for at least 1 forward!');
        } else if (slotsNeededForGK > 0) {
          alert('You must leave a slot for a goalkeeper!');
        }
        return;
      }
    }

    // If we get here, it's safe to search
    setSearchResults([]);
    setAllPositionPlayers([]);
    setSearchTerm('');
    setActiveSearch({ position, index });
    fetchPositionPlayers(position);
  };

  const renderPitch = () => {
    const positions = {
      GK: { row: 0, slots: 1 },
      DEF: { row: 1, slots: 5 },
      MID: { row: 2, slots: 5 },
      FWD: { row: 3, slots: 3 }
    };

    return (
      <div style={{ 
        backgroundColor: '#00ff87',
        padding: '30px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        alignItems: 'center',
        minHeight: '600px',
        position: 'relative'
      }}>
        {Object.entries(positions).map(([position, config]) => (
          <div key={position} style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'space-evenly',
            width: '80%'
          }}>
            {Array(config.slots).fill(null).map((_, index) => {
              const player = squad.find(p => 
                p.position === position && p.positionIndex === index
              );
              return (
                <div key={index} style={{ position: 'relative' }}>
                  {player && (
                    <>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '-8px', 
                          cursor: 'pointer', 
                          zIndex: 2,
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#37003c',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          ':hover': {
                            backgroundColor: '#ff3477'
                          }
                        }}
                        onClick={(e) => { e.stopPropagation(); removePlayerFromSquad(player.id); }}
                      >
                        ✕
                      </div>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          right: '-8px',
                          backgroundColor: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8em',
                          fontWeight: '600',
                          color: '#37003c',
                          zIndex: 2,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {player.points}
                      </div>
                    </>
                  )}
                  <div 
                    style={{
                      width: player ? '106px' : '94px',
                      height: player ? '128px' : '124px',
                      border: player ? 'none' : '2px dashed rgba(255, 255, 255, 0.5)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: player ? '#04b660' : 'rgba(255, 255, 255, 0.2)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: player ? '0 4px 4px rgba(0,0,0,0.1)' : 'none',
                      overflow: 'hidden',
                      ':hover': {
                        backgroundColor: player ? '#04b660' : 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                    onClick={() => !player && handleSlotClick(position, index)}
                  >
                    {player ? (
                      <>
                        <img 
                          src={player.photo}
                          alt={player.name}
                          style={{ 
                            width: '60px', 
                            height: '75px', 
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            position: 'relative',
                            zIndex: 1
                          }}
                          onError={(e) => {
                            e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                          }}
                        />
                        <div style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          padding: '4px 8px',
                          borderRadius: '0 0 6px 6px',
                          width: '100%',
                          textAlign: 'center',
                          marginTop: '-4px',
                          zIndex: 2
                        }}>
                          <div style={{
                            fontSize: '0.8em',
                            fontWeight: '600',
                            color: '#37003c',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backgroundColor: 'white',
                            padding: '4px',
                            borderRadius: '0'
                          }}>
                            {getDisplayName(player.name)}
                          </div>
                          <div style={{ 
                            fontSize: '0.7em',
                            color: '#666',
                            backgroundColor: '#f0f0f0',
                            padding: '4px',
                            borderRadius: '0 0 6px 6px'
                          }}>
                            {player.team}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#37003c', opacity: 0.5 }}>{position}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Position-specific search overlay */}
        {activeSearch && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search for a player..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #00ff87',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => setActiveSearch(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  marginLeft: '12px'
                }}
              >
                ✕
              </button>
            </div>

            <ul className="player-list" style={{ 
              maxHeight: '400px',
              overflowY: 'auto',
              position: 'static',
              marginTop: '12px',
              padding: 0,
              listStyle: 'none',
              border: '1px solid #eee',
              borderRadius: '8px'
            }}>
              {searchResults.map((player) => (
                <li 
                  key={player.id} 
                  onClick={() => addPlayerToSquad(player)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    gap: '12px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#f8f8f8'
                    }
                  }}
                >
                  <img 
                    src={player.photo} 
                    alt={player.name}
                    style={{
                      width: '44px',
                      height: '56px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#37003c' }}>
                      {getDisplayName(player.name)}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9em',
                      color: '#666',
                      backgroundColor: 'white',
                      display: 'inline-block',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      marginTop: '2px'
                    }}>
                      <span>{player.team}</span>
                      <span>·</span>
                      <span>{player.points} pts</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    color: '#666'
                  }}>
                    {player.position}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        maxWidth: 'calc(100% - 324px)' // 300px stats width + 24px gap
      }}>
        <h1 style={{ margin: 0 }}>Squad Builder</h1>
        <button
          onClick={resetSquad}
          style={{
            backgroundColor: '#37003c',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em',
            transition: 'background-color 0.2s',
            ':hover': {
              backgroundColor: '#4a0050'
            }
          }}
        >
          Reset Squad
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: '1' }}>
          {renderPitch()}
        </div>

        <div style={{ width: '300px' }}>
          <div className="stats-container">
            <h2 style={{ 
              color: '#37003c',
              borderBottom: '2px solid #00ff87',
              paddingBottom: '10px',
              marginTop: 0
            }}>
              Squad Stats
            </h2>
            <div className="stat-item">
              <span className="stat-label">Total Points:</span>
              <span className="stat-value">{squadStats.totalPoints}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expected Points:</span>
              <span className="stat-value">{squadStats.expectedPoints.toFixed(0)}</span>
            </div>
          </div>

          {squad.length > 0 && (
            <div className="stats-container" style={{ marginTop: '20px' }}>
              <h2 style={{ 
                color: '#37003c',
                borderBottom: '2px solid #00ff87',
                paddingBottom: '10px',
                marginTop: 0
              }}>
                Player Stats
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Player</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>PPG</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Pts</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>xPts</th>
                  </tr>
                </thead>
                <tbody>
                  {squad.map((player) => (
                    <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>{getDisplayName(player.name)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>{player.ppg}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>{player.points}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>{player.xPts.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SquadBuilder; 