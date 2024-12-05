import React, { useState, useEffect } from 'react';

function LeagueStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('All players');
  const [teamFilter, setTeamFilter] = useState('All teams');
  const [sortConfig, setSortConfig] = useState({
    key: 'points',
    direction: 'desc',
    active: true
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/league-stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching league stats:', error);
      setLoading(false);
    }
  };

  const filterPlayers = (players) => {
    let filtered = players;
    
    if (viewFilter !== 'All players') {
      filtered = filtered.filter(player => player.position === viewFilter);
    }
    
    if (teamFilter !== 'All teams') {
      filtered = filtered.filter(player => player.team === teamFilter);
    }
    
    return filtered;
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Toggle between asc, desc, and inactive
        if (prevConfig.direction === 'desc') {
          return { key, direction: 'asc', active: true };
        } else if (prevConfig.direction === 'asc') {
          return { key: 'points', direction: 'desc', active: true }; // Reset to default
        }
      }
      // New column selected
      return { key, direction: 'desc', active: true };
    });
  };

  const sortPlayers = (players) => {
    if (!sortConfig.active) {
      return players;
    }

    const sortedPlayers = [...players].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases for sorting
      if (sortConfig.key === 'player') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      if (aValue === bValue) return 0;
      
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });

    return sortedPlayers;
  };

  const getHeaderStyle = (key) => ({
    ...tableHeaderStyle,
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: sortConfig.key === key ? '#2b002e' : '#37003c',
    ':hover': {
      backgroundColor: '#2b002e'
    }
  });

  // Get unique teams from stats
  const getUniqueTeams = () => {
    const teams = new Set(stats.map(player => player.team));
    return ['All teams', ...Array.from(teams).sort()];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const displayedPlayers = sortPlayers(filterPlayers(stats));

  return (
    <div>
      <h1>League Stats</h1>
      
      <div className="filters-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#37003c',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div className="view-filter">
          <label style={{ fontSize: '16px' }}>View: </label>
          <select 
            value={viewFilter}
            onChange={(e) => setViewFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '4px',
              border: 'none',
              marginLeft: '8px',
              fontSize: '16px',
              minWidth: '150px'
            }}
          >
            <option>All players</option>
            <option>GK</option>
            <option>DEF</option>
            <option>MID</option>
            <option>FWD</option>
          </select>
        </div>

        <div className="team-filter">
          <label style={{ fontSize: '16px' }}>Team: </label>
          <select 
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '4px',
              border: 'none',
              marginLeft: '8px',
              fontSize: '16px',
              minWidth: '150px'
            }}
          >
            {getUniqueTeams().map(team => (
              <option key={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-table-container" style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#37003c', color: 'white' }}>
              <th 
                onClick={() => handleSort('player')} 
                style={getHeaderStyle('player')}
              >
                Player
                {sortConfig.key === 'player' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('cost')} 
                style={getHeaderStyle('cost')}
              >
                Cost
                {sortConfig.key === 'cost' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('selected')} 
                style={getHeaderStyle('selected')}
              >
                Selected
                {sortConfig.key === 'selected' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('form')} 
                style={getHeaderStyle('form')}
              >
                Form
                {sortConfig.key === 'form' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('points')} 
                style={getHeaderStyle('points')}
              >
                Pts
                {sortConfig.key === 'points' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('xPts')} 
                style={getHeaderStyle('xPts')}
              >
                xPts
                {sortConfig.key === 'xPts' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('minutes')} 
                style={getHeaderStyle('minutes')}
              >
                Mins
                {sortConfig.key === 'minutes' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('goals')} 
                style={getHeaderStyle('goals')}
              >
                Goals
                {sortConfig.key === 'goals' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('assists')} 
                style={getHeaderStyle('assists')}
              >
                Assists
                {sortConfig.key === 'assists' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('cleanSheets')} 
                style={getHeaderStyle('cleanSheets')}
              >
                CS
                {sortConfig.key === 'cleanSheets' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('xG')} 
                style={getHeaderStyle('xG')}
              >
                xG
                {sortConfig.key === 'xG' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('xA')} 
                style={getHeaderStyle('xA')}
              >
                xA
                {sortConfig.key === 'xA' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedPlayers.map((player) => (
              <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={player.photo} 
                      alt={player.name}
                      style={{ width: '30px', height: '38px', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#37003c' }}>{player.name}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        {player.team}
                        <span style={{ 
                          marginLeft: '8px', 
                          padding: '2px 6px', 
                          backgroundColor: '#00ff87', 
                          borderRadius: '4px',
                          fontSize: '0.8em',
                          color: '#37003c'
                        }}>
                          {player.position}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={tableCellStyle}>£{(player.cost || 0).toFixed(1)}</td>
                <td style={tableCellStyle}>{player.selected}%</td>
                <td style={tableCellStyle}>{player.form}</td>
                <td style={tableCellStyle}>{player.points}</td>
                <td style={tableCellStyle}>{player.xPts.toFixed(0)}</td>
                <td style={tableCellStyle}>{player.minutes}</td>
                <td style={tableCellStyle}>{player.goals}</td>
                <td style={tableCellStyle}>{player.assists}</td>
                <td style={tableCellStyle}>{player.cleanSheets}</td>
                <td style={tableCellStyle}>{player.xG.toFixed(2)}</td>
                <td style={tableCellStyle}>{player.xA.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  transition: 'background-color 0.2s ease'
};

const tableCellStyle = {
  padding: '12px 16px',
  whiteSpace: 'nowrap'
};

export default LeagueStats; 