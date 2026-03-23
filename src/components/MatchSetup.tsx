import { useRef, useState, useEffect, type FC, type ChangeEvent } from 'react';
import type { MatchData, MatchType, Team } from '../types';
import { Upload, Trophy } from 'lucide-react';
import { useLanguage } from '../languages/LanguageContext';

interface Props {
  onStart: (type: MatchType, initialServer: Team, ourTeamName: string, opponentTeamName: string) => void;
  onImport: (data: MatchData) => void;
}

const MatchSetup: FC<Props> = ({ onStart, onImport }) => {
  const { t, language, setLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ourTeamName, setOurTeamName] = useState(t.setup.ourTeamDefault);
  const [opponentTeamName, setOpponentTeamName] = useState(t.setup.opponentTeamDefault);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  // Update default names if language changes and they haven't been modified
  useEffect(() => {
    setOurTeamName(prev => {
      if (prev === 'Our Team' || prev === 'A Nossa Equipa') return t.setup.ourTeamDefault;
      return prev;
    });
    setOpponentTeamName(prev => {
      if (prev === 'Opponent' || prev === 'Adversário') return t.setup.opponentTeamDefault;
      return prev;
    });
  }, [t.setup.ourTeamDefault, t.setup.opponentTeamDefault]);

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImport(data);
      } catch (err) {
        alert(t.common.errorImport);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="setup-container">
      <div className="card">
        <header className="match-header" style={{ marginBottom: '1rem' }}>
          <div className="header-side left"></div>
          <div className="header-side right">
            <button onClick={toggleLanguage} className="lang-btn">
              {language === 'en' ? 'PT' : 'EN'}
            </button>
          </div>
        </header>
        <Trophy size={48} className="icon-main" />
        <h1>{t.setup.title}</h1>
        <p>{t.setup.subtitle}</p>

        <div className="setup-options">
          <div className="setup-section">
            <h3>{t.setup.teamNames}</h3>
            <div className="team-names-input" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.3rem' }}>{t.setup.yourTeam}</label>
                <input 
                  type="text" 
                  value={ourTeamName} 
                  onChange={(e) => setOurTeamName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.3rem' }}>{t.setup.opponent}</label>
                <input 
                  type="text" 
                  value={opponentTeamName} 
                  onChange={(e) => setOpponentTeamName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
            </div>

            <h3>{t.setup.newMatch}</h3>
            <div className="button-group">
              <button className="primary" onClick={() => onStart('3set', 'us', ourTeamName, opponentTeamName)}>
                {t.setup.startServing3}
              </button>
              <button className="primary" onClick={() => onStart('3set', 'opponent', ourTeamName, opponentTeamName)}>
                {t.setup.opponentServes3}
              </button>
              <hr />
              <button className="primary" onClick={() => onStart('5set', 'us', ourTeamName, opponentTeamName)}>
                {t.setup.startServing5}
              </button>
              <button className="primary" onClick={() => onStart('5set', 'opponent', ourTeamName, opponentTeamName)}>
                {t.setup.opponentServes5}
              </button>
            </div>
          </div>

          <div className="setup-section">
            <h3>{t.setup.importData}</h3>
            <button className="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              {t.setup.importJson}
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
