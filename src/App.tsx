import { useState, useEffect } from 'react';
import './App.css';
import type { MatchData, MatchType, Team } from './types';
import MatchSetup from './components/MatchSetup';
import LiveMatch from './components/LiveMatch';
import Analysis from './components/Analysis';
import ConfirmationModal from './components/ConfirmationModal';
import { useLanguage } from './languages/LanguageContext';

const STORAGE_KEY = 'volleyball_match_data';

function App() {
  const { t } = useLanguage();
  const [match, setMatch] = useState<MatchData | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (match) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    }
  }, [match]);

  const startNewMatch = (type: MatchType, initialServer: Team, ourTeamName: string, opponentTeamName: string) => {
    const newMatch: MatchData = {
      id: Date.now().toString(),
      type,
      status: 'playing',
      currentSetIndex: 0,
      initialServer,
      ourTeamName,
      opponentTeamName,
      sets: [{ ourScore: 0, opponentScore: 0, events: [], finished: false }],
    };
    setMatch(newMatch);
  };

  const resetMatch = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setMatch(null);
    localStorage.removeItem(STORAGE_KEY);
    setShowResetConfirm(false);
  };

  const updateMatch = (updated: MatchData) => {
    setMatch(updated);
  };

  const importMatch = (data: MatchData) => {
    setMatch(data);
  };

  return (
    <>
      {!match && <MatchSetup onStart={startNewMatch} onImport={importMatch} />}
      {match && match.status === 'playing' && (
        <LiveMatch match={match} onUpdate={updateMatch} onReset={resetMatch} />
      )}
      {match && match.status === 'finished' && (
        <Analysis match={match} onReset={resetMatch} onUpdate={updateMatch} />
      )}
      
      {showResetConfirm && (
        <ConfirmationModal
          title={t.common.newMatchQuestion}
          message={t.common.resetMessage}
          confirmLabel={t.common.confirm}
          cancelLabel={t.common.cancel}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetConfirm(false)}
          isDanger={true}
        />
      )}
    </>
  );
}

export default App;
