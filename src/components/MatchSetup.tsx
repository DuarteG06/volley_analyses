import { useRef, type FC, type ChangeEvent } from 'react';
import type { MatchData, MatchType, Team } from '../types';
import { Upload, Trophy } from 'lucide-react';

interface Props {
  onStart: (type: MatchType, initialServer: Team) => void;
  onImport: (data: MatchData) => void;
}

const MatchSetup: FC<Props> = ({ onStart, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <h3>New Match</h3>
            <div className="button-group">
              <button className="primary" onClick={() => onStart('3set', 'us')}>
                3 Set Match (Start Serving)
              </button>
              <button className="primary" onClick={() => onStart('3set', 'opponent')}>
                3 Set Match (Opponent Serves)
              </button>
              <hr />
              <button className="primary" onClick={() => onStart('5set', 'us')}>
                5 Set Match (Start Serving)
              </button>
              <button className="primary" onClick={() => onStart('5set', 'opponent')}>
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
