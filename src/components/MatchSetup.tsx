import { useRef, useState, type FC, type ChangeEvent } from 'react';
import type { MatchData, MatchType, Team } from '../types';
import { Upload, Trophy } from 'lucide-react';

interface Props {
  onStart: (type: MatchType, initialServer: Team, ourTeamName: string, opponentTeamName: string) => void;
  onImport: (data: MatchData) => void;
}

const MatchSetup: FC<Props> = ({ onStart, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ourTeamName, setOurTeamName] = useState('Our Team');
  const [opponentTeamName, setOpponentTeamName] = useState('Opponent');

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImport(data);
      } catch (err) {
        alert('Error importing match data. Invalid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="setup-container">
      <div className="card">
        <Trophy size={48} className="icon-main" />
        <h1>Volleyball Match Analysis</h1>
        <p>Start a new match or import existing data</p>

        <div className="setup-options">
          <div className="setup-section">
            <h3>Team Names</h3>
            <div className="team-names-input" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.3rem' }}>Your Team</label>
                <input 
                  type="text" 
                  value={ourTeamName} 
                  onChange={(e) => setOurTeamName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.3rem' }}>Opponent</label>
                <input 
                  type="text" 
                  value={opponentTeamName} 
                  onChange={(e) => setOpponentTeamName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
            </div>

            <h3>New Match</h3>
            <div className="button-group">
              <button className="primary" onClick={() => onStart('3set', 'us', ourTeamName, opponentTeamName)}>
                3 Set Match (Start Serving)
              </button>
              <button className="primary" onClick={() => onStart('3set', 'opponent', ourTeamName, opponentTeamName)}>
                3 Set Match (Opponent Serves)
              </button>
              <hr />
              <button className="primary" onClick={() => onStart('5set', 'us', ourTeamName, opponentTeamName)}>
                5 Set Match (Start Serving)
              </button>
              <button className="primary" onClick={() => onStart('5set', 'opponent', ourTeamName, opponentTeamName)}>
                5 Set Match (Opponent Serves)
              </button>
            </div>
          </div>

          <div className="setup-section">
            <h3>Import Data</h3>
            <button className="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Import JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSetup;
