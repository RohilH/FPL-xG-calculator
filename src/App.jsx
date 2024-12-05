import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import PlayerSearch from './pages/PlayerSearch';
import LeagueStats from './pages/LeagueStats';
import SquadBuilder from './pages/SquadBuilder';
import { getFplData } from './services/fplApi';
import './styles/App.css';

function App() {
  const [fplData, setFplData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getFplData();
        setFplData(data);
      } catch (err) {
        console.error('Error loading FPL data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div></div>;
  }

  if (error) {
    return <div>Error loading FPL data: {error}</div>;
  }

  return (
    <Router>
      <div>
        <nav className="nav-bar">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Player Search
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            League Stats
          </NavLink>
          <NavLink to="/squad" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Squad Builder
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<PlayerSearch fplData={fplData} />} />
          <Route path="/stats" element={<LeagueStats fplData={fplData} />} />
          <Route path="/squad" element={<SquadBuilder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 