import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import PlayerSearch from './pages/PlayerSearch';
import LeagueStats from './pages/LeagueStats';
import SquadBuilder from './pages/SquadBuilder';
import './styles/App.css';

function App() {
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
          <Route path="/" element={<PlayerSearch />} />
          <Route path="/stats" element={<LeagueStats />} />
          <Route path="/squad" element={<SquadBuilder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 