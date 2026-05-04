import { useState, useEffect } from 'react';
import './App.css';
import type { MatchData, MatchType, Team } from './types';
import MatchSetup from './components/MatchSetup';
import LiveMatch from './components/LiveMatch';
import Analysis from './components/Analysis';
import ConfirmationModal from './components/ConfirmationModal';
import { useLanguage } from './languages/LanguageContext';
import { normalizeMatchData, serializeMatch } from './matchPersistence';

const STORAGE_KEY = 'volleyball_match_data';

function App() {
  const { t } = useLanguage();
  const [match, setMatch] = useState<MatchData | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return null;
    }

    try {
      return normalizeMatchData(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

  useEffect(() => {
    if (match) {
      localStorage.setItem(STORAGE_KEY, serializeMatch(match));
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
      sets: [{ ourScore: 0, opponentScore: 0, events: [], timeouts: [], finished: false }],
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

  const importMatch = (data: unknown) => {
    setMatch(normalizeMatchData(data));
  };

  return (
    <>
      {!match && <MatchSetup onStart={startNewMatch} onImport={importMatch} onShowUpdates={() => setShowUpdates(true)} />}
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

      {showUpdates && (
        <div className="modal-overlay" onClick={() => setShowUpdates(false)}>
          <div className="modal-content updates-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.updates.title}</h2>
            <ul className="updates-list">
              {t.updates.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button className="secondary" onClick={() => setShowUpdates(false)} type="button">
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
