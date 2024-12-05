import React, { useState, useEffect } from "react";
import { formatPlayerData } from "../services/playerHelpers";
import { filterPlayersByPosition } from "../services/squadHelpers";

function SquadBuilder({ fplData }) {
  const [squad, setSquad] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const [squadStats, setSquadStats] = useState({
    totalPoints: 0,
    expectedPoints: 0,
  });

  const positions = {
    GK: { row: 0, slots: 1 },
    DEF: { row: 1, slots: 5 },
    MID: { row: 2, slots: 5 },
    FWD: { row: 3, slots: 3 },
  };

  const resetSquad = () => {
    setSquad([]);
    setSquadStats({
      totalPoints: 0,
      expectedPoints: 0,
    });
  };

  useEffect(() => {
    if (activeSearch) {
      if (searchTerm.length >= 3) {
        updateSearchResults();
      } else {
        // Show all players in position when no search term
        const positionPlayers = filterPlayersByPosition(
          fplData.elements,
          activeSearch.position
        )
          .filter((player) => !squad.some((p) => p.id === player.id))
          .map((player) => formatPlayerData(player, fplData))
          .sort((a, b) => b.stats.points - a.stats.points);
        setSearchResults(positionPlayers);
      }
    } else {
      setSearchResults([]);
      setSearchTerm("");
    }
  }, [activeSearch]);

  useEffect(() => {
    if (activeSearch) {
      const debounceTimeout = setTimeout(() => {
        if (searchTerm.length >= 3) {
          updateSearchResults();
        } else if (searchTerm.length === 0) {
          // Reset to all position players when search is cleared
          const positionPlayers = filterPlayersByPosition(
            fplData.elements,
            activeSearch.position
          )
            .filter((player) => !squad.some((p) => p.id === player.id))
            .map((player) => formatPlayerData(player, fplData))
            .sort((a, b) => b.stats.points - a.stats.points);
          setSearchResults(positionPlayers);
        }
      }, 300);

      return () => clearTimeout(debounceTimeout);
    }
  }, [searchTerm]);

  const updateSearchResults = () => {
    if (!activeSearch) return;

    const filteredPlayers = filterPlayersByPosition(
      fplData.elements,
      activeSearch.position,
      searchTerm
    )
      .filter((player) => !squad.some((p) => p.id === player.id))
      .map((player) => formatPlayerData(player, fplData));

    setSearchResults(filteredPlayers);
  };

  const addPlayerToSquad = (player) => {
    const playerWithStats = {
      ...player,
      points: player.stats.points,
      positionIndex: activeSearch.index,
      position: activeSearch.position,
    };

    // Replace player at the specific position index
    const newSquad = squad.filter(
      (p) =>
        !(
          p.position === activeSearch.position &&
          p.positionIndex === activeSearch.index
        )
    );
    newSquad.push(playerWithStats);

    setSquad(newSquad);
    setSearchTerm("");
    setSearchResults([]);
    setActiveSearch(null);
    updateSquadStats(newSquad);
  };

  const removePlayerFromSquad = (playerId) => {
    const newSquad = squad.filter((player) => player.id !== playerId);
    setSquad(newSquad);
    updateSquadStats(newSquad);
  };

  const updateSquadStats = (currentSquad) => {
    const stats = currentSquad.reduce(
      (acc, player) => ({
        totalPoints: acc.totalPoints + player.stats.points,
        expectedPoints: acc.expectedPoints + player.stats.xPts,
      }),
      { totalPoints: 0, expectedPoints: 0 }
    );

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
      alert("Squad is full! Remove a player first.");
      return;
    }

    // Check basic position limits
    if (position === "GK" && (positionCounts["GK"] || 0) >= 1) {
      alert("You can only have one goalkeeper!");
      return;
    }

    if (position === "DEF" && (positionCounts["DEF"] || 0) >= 5) {
      alert("You can only have up to 5 defenders!");
      return;
    }

    if (position === "MID" && (positionCounts["MID"] || 0) >= 5) {
      alert("You can only have up to 5 midfielders!");
      return;
    }

    if (position === "FWD" && (positionCounts["FWD"] || 0) >= 3) {
      alert("You can only have up to 3 forwards!");
      return;
    }

    // Special validation for the 11th player selection
    if (squad.length === 10) {
      const futurePositionCounts = {
        GK: (positionCounts["GK"] || 0) + (position === "GK" ? 1 : 0),
        DEF: (positionCounts["DEF"] || 0) + (position === "DEF" ? 1 : 0),
        MID: (positionCounts["MID"] || 0) + (position === "MID" ? 1 : 0),
        FWD: (positionCounts["FWD"] || 0) + (position === "FWD" ? 1 : 0),
      };

      // Check final squad composition rules
      if (futurePositionCounts.GK !== 1) {
        alert("Final squad must have exactly 1 goalkeeper!");
        return;
      }

      if (futurePositionCounts.DEF < 3) {
        alert("Final squad must have at least 3 defenders!");
        return;
      }

      if (futurePositionCounts.FWD < 1) {
        alert("Final squad must have at least 1 forward!");
        return;
      }
    } else {
      // Validation for selections 1-10: Check if this selection would prevent valid final composition
      const minRequiredPlayers = {
        GK: 1,
        DEF: 3,
        FWD: 1,
      };

      // Calculate remaining slots after this selection
      const remainingSlots = 10 - squad.length;
      const futurePositionCounts = {
        GK: (positionCounts["GK"] || 0) + (position === "GK" ? 1 : 0),
        DEF: (positionCounts["DEF"] || 0) + (position === "DEF" ? 1 : 0),
        MID: (positionCounts["MID"] || 0) + (position === "MID" ? 1 : 0),
        FWD: (positionCounts["FWD"] || 0) + (position === "FWD" ? 1 : 0),
      };

      // Check if we can still meet minimum requirements
      if (futurePositionCounts.GK > minRequiredPlayers.GK) {
        alert("You can only have 1 goalkeeper!");
        return;
      }

      const slotsNeededForDef = Math.max(
        0,
        minRequiredPlayers.DEF - futurePositionCounts.DEF
      );
      const slotsNeededForFwd = Math.max(
        0,
        minRequiredPlayers.FWD - futurePositionCounts.FWD
      );
      const slotsNeededForGK = Math.max(
        0,
        minRequiredPlayers.GK - futurePositionCounts.GK
      );

      const totalSlotsNeeded =
        slotsNeededForDef + slotsNeededForFwd + slotsNeededForGK;

      if (remainingSlots < totalSlotsNeeded) {
        if (slotsNeededForDef > 0) {
          alert("You must leave enough slots for at least 3 defenders!");
        } else if (slotsNeededForFwd > 0) {
          alert("You must leave enough slots for at least 1 forward!");
        } else if (slotsNeededForGK > 0) {
          alert("You must leave a slot for a goalkeeper!");
        }
        return;
      }
    }

    // If we get here, it's safe to search
    setSearchResults([]);
    setSearchTerm("");
    setActiveSearch({ position, index });
  };

  const getDisplayName = (fullName) => {
    const names = fullName.split(" ");
    if (names.length <= 2) return names[names.length - 1];

    // For names like "Van Dijk", "De Bruyne", etc.
    const commonPrefixes = ["van", "de", "der", "den", "dos", "da", "di"];
    const secondToLast = names[names.length - 2].toLowerCase();

    if (commonPrefixes.includes(secondToLast)) {
      return `${names[names.length - 2]} ${names[names.length - 1]}`;
    }

    return names[names.length - 1];
  };

  const renderPitch = () => {
    return (
      <div className="pitch">
        {Object.entries(positions).map(([position, config]) => (
          <div key={position} className="position-row">
            {Array(config.slots)
              .fill(null)
              .map((_, index) => {
                const player = squad.find(
                  (p) => p.position === position && p.positionIndex === index
                );
                return (
                  <div key={index} className="player-card">
                    {player ? (
                      <>
                        <div
                          className="remove-player"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlayerFromSquad(player.id);
                          }}
                        >
                          ✕
                        </div>
                        <div className="player-points">
                          {player.stats.points}
                        </div>
                        <div className="player-card-filled">
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="player-photo"
                            onError={(e) => {
                              e.target.src =
                                "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png";
                            }}
                          />
                          <div className="player-info-card">
                            <div className="player-name-card">
                              {getDisplayName(player.name)}
                            </div>
                            <div className="player-team-card">
                              {player.team}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="player-card-empty"
                        onClick={() => handleSlotClick(position, index)}
                      >
                        <div className="empty-position-label">{position}</div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}

        {activeSearch && (
          <div className="search-overlay">
            <div className="search-container">
              <div className="search-header">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeSearch.position.toLowerCase()}s...`}
                  className="search-input"
                  autoFocus
                />
                <button
                  onClick={() => setActiveSearch(null)}
                  className="close-button"
                >
                  ✕
                </button>
              </div>
              <div className="search-results">
                {searchResults.length > 0
                  ? searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="player-result"
                        onClick={() => addPlayerToSquad(player)}
                      >
                        <img
                          src={player.photo}
                          alt={player.name}
                          onError={(e) => {
                            e.target.src =
                              "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png";
                          }}
                        />
                        <div className="player-info">
                          <div className="player-name">
                            {getDisplayName(player.name)}
                          </div>
                          <div className="player-team">{player.team}</div>
                        </div>
                        <div className="player-stats">
                          <div>Pts: {player.stats.points}</div>
                        </div>
                      </div>
                    ))
                  : searchTerm.length >= 3 && (
                      <div className="no-results">No players found</div>
                    )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "-20px",
        }}
      >
        <h1>Squad Builder</h1>
        <button
          onClick={resetSquad}
          style={{
            backgroundColor: "#37003c",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Reset Squad
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>{renderPitch()}</div>
        <div style={{ width: "300px" }}>
          <div className="stat-box">
            <h3>Squad Stats</h3>
            <div className="stat-item">
              <span className="stat-label">Total Points:</span>
              <span className="stat-value">{squadStats.totalPoints}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expected Points:</span>
              <span className="stat-value">
                {Math.round(squadStats.expectedPoints)}
              </span>
            </div>
          </div>

          {squad.length > 0 && (
            <div className="stat-box" style={{ marginTop: "20px" }}>
              <h3>Player Stats</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>
                      Player
                    </th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>
                      Pts
                    </th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>
                      xPts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {squad.map((player) => (
                    <tr key={player.id}>
                      <td style={{ padding: "8px 4px" }}>
                        {getDisplayName(player.name)}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 4px" }}>
                        {player.stats.points}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 4px" }}>
                        {Math.round(player.stats.xPts)}
                      </td>
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
