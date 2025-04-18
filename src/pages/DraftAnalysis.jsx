import React, { useState } from "react";
import {
  getDraftUserData,
  getDraftLeagues,
  getDraftLeagueDetails,
  getDraftTeam,
} from "../services/draftFplApi";
import { calculatePlayerXpts } from "../services/playerHelpers";

const DraftAnalysis = ({ fplData }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leagues, setLeagues] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamData, setTeamData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await getDraftUserData(email, password);
      const leaguesData = await getDraftLeagues();
      setLeagues(leaguesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeagueSelect = async (leagueId) => {
    setIsLoading(true);
    setError(null);

    try {
      const leagueDetails = await getDraftLeagueDetails(leagueId);
      setSelectedLeague(leagueDetails);

      // Get user's team data
      const userTeam = leagueDetails.league_entries.find(
        (entry) => entry.entry_name === email
      );
      if (userTeam) {
        const teamDetails = await getDraftTeam(leagueId, userTeam.id);
        setTeamData(teamDetails);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTeamXpts = (players) => {
    return players.reduce((total, player) => {
      const fplPlayer = fplData.elements.find((p) => p.id === player.id);
      if (!fplPlayer) return total;
      return total + calculatePlayerXpts(fplPlayer, fplPlayer.element_type);
    }, 0);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  if (!leagues) {
    return (
      <div className="draft-login">
        <h2>Login to FPL Draft</h2>
        <form onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  if (!selectedLeague) {
    return (
      <div className="leagues-list">
        <h2>Select Draft League</h2>
        {leagues.map((league) => (
          <div
            key={league.id}
            className="league-item"
            onClick={() => handleLeagueSelect(league.id)}
          >
            {league.name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="draft-analysis">
      <h2>{selectedLeague.name}</h2>
      {teamData && (
        <div className="team-analysis">
          <h3>Your Team</h3>
          <div className="players-list">
            {teamData.players.map((player) => {
              const fplPlayer = fplData.elements.find(
                (p) => p.id === player.id
              );
              return (
                <div key={player.id} className="player-item">
                  <img
                    src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${fplPlayer?.code}.png`}
                    alt={fplPlayer?.web_name}
                  />
                  <div className="player-info">
                    <div>{fplPlayer?.web_name}</div>
                    <div>
                      xPts:{" "}
                      {calculatePlayerXpts(fplPlayer, fplPlayer?.element_type)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="team-stats">
            <h4>Team Total xPts: {calculateTeamXpts(teamData.players)}</h4>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftAnalysis;
