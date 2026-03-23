import { useState, useMemo, type FC, Fragment } from 'react';
import type { MatchData, Team, PointReason, EventDetails, MatchEvent } from '../types';
import RecordingModal from './RecordingModal';
import { RotateCcw, BarChart2, Undo2, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../languages/LanguageContext';

interface Props {
  match: MatchData;
  onUpdate: (updated: MatchData) => void;
  onReset: () => void;
}

const LiveMatch: FC<Props> = ({ match, onUpdate, onReset }) => {
  const { t, language, setLanguage } = useLanguage();
  const [recordingTeam, setRecordingTeam] = useState<Team | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  const currentSet = match.sets[match.currentSetIndex];
  
  // Calculate who is serving
  const servingTeam = useMemo(() => {
    if (currentSet.events.length === 0) {
      if (match.currentSetIndex === 0) return match.initialServer;
      const firstSetServer = match.initialServer;
      return match.currentSetIndex % 2 === 0 ? firstSetServer : (firstSetServer === 'us' ? 'opponent' : 'us');
    }
    return currentSet.events[currentSet.events.length - 1].scoringTeam;
  }, [currentSet.events, match.currentSetIndex, match.initialServer]);

  const teams = [
    { 
      key: 'us' as Team, 
      name: match.ourTeamName, 
      score: currentSet.ourScore, 
      serving: servingTeam === 'us',
      pointClass: 'our-point'
    },
    { 
      key: 'opponent' as Team, 
      name: match.opponentTeamName, 
      score: currentSet.opponentScore, 
      serving: servingTeam === 'opponent',
      pointClass: 'opponent-point'
    }
  ];

  const displayedTeams = isSwapped ? [...teams].reverse() : teams;

  const handlePointScored = (team: Team) => {
    setRecordingTeam(team);
  };

  const onConfirmRecording = (reason: PointReason, details: EventDetails) => {
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      scoringTeam: recordingTeam!,
      servingTeam,
      reason,
      details
    };

    const updatedSet = { ...currentSet };
    updatedSet.events = [...updatedSet.events, newEvent];
    if (recordingTeam === 'us') updatedSet.ourScore++;
    else updatedSet.opponentScore++;

    const updatedMatch = { ...match };
    updatedMatch.sets = [...match.sets];
    updatedMatch.sets[match.currentSetIndex] = updatedSet;

    const targetScore = (match.type === '5set' && match.currentSetIndex === 4) ? 15 : 25;
    
    const { ourScore, opponentScore } = updatedSet;
    const isFinished = (ourScore >= targetScore || opponentScore >= targetScore) && 
                       Math.abs(ourScore - opponentScore) >= 2;

    if (isFinished) {
      updatedSet.finished = true;
      const ourSetsWon = updatedMatch.sets.filter(s => s.finished && s.ourScore > s.opponentScore).length;
      const opponentSetsWon = updatedMatch.sets.filter(s => s.finished && s.opponentScore > s.ourScore).length;
      const setsToWin = match.type === '3set' ? 2 : 3;

      if (ourSetsWon === setsToWin || opponentSetsWon === setsToWin) {
        updatedMatch.status = 'finished';
      } else {
        updatedMatch.currentSetIndex++;
        updatedMatch.sets.push({ ourScore: 0, opponentScore: 0, events: [], finished: false });
      }
    }

    onUpdate(updatedMatch);
    setRecordingTeam(null);
  };

  const undoLastPoint = () => {
    const updatedMatch = { ...match };
    const currentSet = { ...updatedMatch.sets[match.currentSetIndex] };
    
    if (currentSet.events.length === 0) {
      if (match.currentSetIndex > 0) {
        updatedMatch.currentSetIndex--;
        updatedMatch.sets[updatedMatch.currentSetIndex].finished = false;
        updatedMatch.sets.pop();
        onUpdate(updatedMatch);
      }
      return;
    }

    const lastEvent = currentSet.events[currentSet.events.length - 1];
    if (lastEvent.scoringTeam === 'us') currentSet.ourScore--;
    else currentSet.opponentScore--;
    
    currentSet.events.pop();
    updatedMatch.sets[match.currentSetIndex] = currentSet;
    onUpdate(updatedMatch);
  };

  return (
    <div className="live-match-container">
      <header className="match-header">
        <div className="header-side left">
          <button className="icon-button" onClick={onReset} title={t.live.resetMatch}>
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="set-info">
          {t.common.set} {match.currentSetIndex + 1}
        </div>
        <div className="header-side right">
          <button onClick={toggleLanguage} className="lang-btn">
            {language === 'en' ? 'PT' : 'EN'}
          </button>
          <button className="icon-button" onClick={() => onUpdate({ ...match, status: 'finished' })} title={t.live.finishMatch}>
            <BarChart2 size={20} />
          </button>
        </div>
      </header>

      <div className="scoreboard">
        {displayedTeams.map((team, idx) => (
          <Fragment key={team.key}>
            <div className={`team-score ${team.serving ? 'serving' : ''}`}>
              <span className="team-name">{team.name}</span>
              <span className="score-value">{team.score}</span>
              {team.serving && <div className="serving-dot">● {t.live.serving}</div>}
            </div>
            {idx === 0 && <div className="score-divider">:</div>}
          </Fragment>
        ))}
      </div>

      <div className="action-buttons">
        {displayedTeams.map(team => (
          <button 
            key={team.key}
            className={`point-button ${team.pointClass}`} 
            onClick={() => handlePointScored(team.key)}
          >
            {t.live.point} {team.name}
          </button>
        ))}
      </div>

      <div className="footer-actions">
        <button className="secondary" onClick={undoLastPoint} disabled={currentSet.events.length === 0 && match.currentSetIndex === 0}>
          <Undo2 size={18} /> {t.live.undoLast}
        </button>
        <button className="secondary" onClick={() => setIsSwapped(!isSwapped)}>
          <ArrowLeftRight size={18} /> {t.live.swapSides}
        </button>
      </div>

      {recordingTeam && (
        <RecordingModal
          scoringTeam={recordingTeam}
          servingTeam={servingTeam}
          onConfirm={onConfirmRecording}
          onCancel={() => setRecordingTeam(null)}
        />
      )}
    </div>
  );
};

export default LiveMatch;
