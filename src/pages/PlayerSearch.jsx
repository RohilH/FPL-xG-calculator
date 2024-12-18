import React, { useState, useEffect } from "react";
import { normalizeString } from "../services/fplApi";
import { formatPlayerData } from "../services/playerHelpers";
import { formatPlayerStats } from "../services/statsHelper";

function PlayerSearch({ fplData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (
        searchTerm.length >= 3 &&
        (!selectedPlayer || searchTerm !== selectedPlayer.display_name)
      ) {
        searchPlayers();
        setShowDropdown(true);
      } else {
        setPlayers([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, selectedPlayer]);

  const searchPlayers = () => {
    const normalizedSearch = normalizeString(searchTerm);

    const results = fplData.elements
      .filter((player) => {
        const playerName = `${player.first_name} ${player.second_name}`;
        return normalizeString(playerName).includes(normalizedSearch);
      })
      .map((player) => ({
        ...formatPlayerData(player, fplData),
        display_name: `${player.first_name} ${player.second_name}`,
      }));

    setPlayers(results);
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setPlayers([]);
    setSearchTerm(player.display_name);
    setShowDropdown(false);
    setStats(formatPlayerStats(player));
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
      raw_xg: "xG",
      raw_xa: "xA",
      expected_goals: "Expected Goals (rounded)",
      expected_assists: "Expected Assists (rounded)",
    };

    return (
      specialCases[key] ||
      key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const orderActualStats = (stats) => {
    const order = ["goals", "assists", "clean_sheets", "minutes"];
    return Object.entries(stats).sort(
      ([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB)
    );
  };

  const orderExpectedStats = (stats) => {
    const order = [
      "raw_xg",
      "raw_xa",
      "expected_goals",
      "expected_assists",
      "clean_sheets",
    ];
    return Object.entries(stats).sort(
      ([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB)
    );
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
                  alt={player.display_name}
                  className="player-photo"
                  onError={(e) => {
                    e.target.src =
                      "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png";
                  }}
                />
                <div className="player-info">
                  <div className="player-name">{player.display_name}</div>
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
              alt={selectedPlayer.display_name}
              onError={(e) => {
                e.target.src =
                  "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png";
              }}
            />
            <div className="stats-header-info">
              <h2>{selectedPlayer.display_name}</h2>
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
                    <span className="stat-value">
                      {stats.actual.points.total}
                    </span>
                  </div>
                  <div className="points-breakdown">
                    <small>Goals: {stats.actual.points.goals}</small>
                    <small>Assists: {stats.actual.points.assists}</small>
                    <small>
                      Clean Sheets: {stats.actual.points.clean_sheets}
                    </small>
                    <small className="tooltip-container">
                      Other: {stats.actual.points.other}
                      <span className="tooltip">
                        Includes appearances, bonus points, and deductions
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="stat-box">
              <h3>Expected Stats</h3>
              <div>
                {orderExpectedStats(stats.expected.stats).map(
                  ([key, value]) => (
                    <div key={key} className="stat-item">
                      <span className="stat-label">{formatStatLabel(key)}</span>
                      <span className="stat-value">
                        {typeof value === "number" && !Number.isInteger(value)
                          ? value.toFixed(2)
                          : value}
                      </span>
                    </div>
                  )
                )}
                <div className="total-points">
                  <div className="stat-item">
                    <span className="stat-label">Expected Points</span>
                    <span className="stat-value">
                      {stats.expected.points.total}
                    </span>
                  </div>
                  <div className="points-breakdown">
                    <small>Goals: {stats.expected.points.goals}</small>
                    <small>Assists: {stats.expected.points.assists}</small>
                    <small>
                      Clean Sheets: {stats.expected.points.clean_sheets}
                    </small>
                    <small className="tooltip-container">
                      Other: {stats.expected.points.other}
                      <span className="tooltip">
                        Includes appearances, bonus points, and deductions
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
          .tooltip-container {
            position: relative;
            cursor: help;
            display: inline-block;
          }

          .tooltip {
            visibility: hidden;
            position: absolute;
            bottom: 100%;
            left: 0;
            transform: translateX(0);
            background-color: #37003c;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1;
            margin-bottom: 5px;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 10px;
            transform: translateX(0);
            border-width: 5px;
            border-style: solid;
            border-color: #37003c transparent transparent transparent;
          }

          .tooltip-container:hover .tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>
    </div>
  );
}

export default PlayerSearch;
