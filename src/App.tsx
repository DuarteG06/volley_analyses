import { useState, useEffect } from 'react';
import './App.css';
import type { MatchData, MatchType, Team } from './types';
import MatchSetup from './components/MatchSetup';
import LiveMatch from './components/LiveMatch';
import Analysis from './components/Analysis';

const STORAGE_KEY = 'volleyball_match_data';

function App() {
  const [match, setMatch] = useState<MatchData | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (match) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    }
  }, [match]);

  const startNewMatch = (type: MatchType, initialServer: Team) => {
    const newMatch: MatchData = {
      id: Date.now().toString(),
      type,
      status: 'playing',
      currentSetIndex: 0,
      initialServer,
      sets: [{ ourScore: 0, opponentScore: 0, events: [], finished: false }],
    };
    setMatch(newMatch);
  };

  const resetMatch = () => {
    if (window.confirm('Are you sure you want to start a new match? Current data will be lost if not exported.')) {
      setMatch(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updateMatch = (updated: MatchData) => {
    setMatch(updated);
  };

  const importMatch = (data: MatchData) => {
    setMatch(data);
  };

  if (!match) {
    return <MatchSetup onStart={startNewMatch} onImport={importMatch} />;
  }

  if (match.status === 'playing') {
    return <LiveMatch match={match} onUpdate={updateMatch} onReset={resetMatch} />;
  }

  return <Analysis match={match} onReset={resetMatch} onUpdate={updateMatch} />;
}

export default App;
