import { useState, useMemo, type FC } from 'react';
import type { MatchData, Team, PointReason, EventDetails, MatchEvent } from '../types';
import RecordingModal from './RecordingModal';
import { RotateCcw, BarChart2, Undo2 } from 'lucide-react';

interface Props {
  match: MatchData;
  onUpdate: (updated: MatchData) => void;
  onReset: () => void;
}

const LiveMatch: FC<Props> = ({ match, onUpdate, onReset }) => {
  const [recordingTeam, setRecordingTeam] = useState<Team | null>(null);

  const currentSet = match.sets[match.currentSetIndex];
  
  // Calculate who is serving
  // In volleyball, the team that won the last point serves.
  // For the first point of the set, we need to handle it.
  const servingTeam = useMemo(() => {
    if (currentSet.events.length === 0) {
      // First point of the set
      // Usually, the server alternates sets, but let's simplify or check match rules.
      // Instruction says "which team is serving" should be displayed.
      // We'll use the match.initialServer for the first set, and then alternate or use last point winner.
      // Actually, rule is: Team that won the last point serves.
      // For start of set 1: initialServer.
      // For start of subsequent sets: usually alternate from set 1 start.
      if (match.currentSetIndex === 0) return match.initialServer;
      
      // For subsequent sets, it alternates from the START of the previous set.
      const firstSetServer = match.initialServer;
      return match.currentSetIndex % 2 === 0 ? firstSetServer : (firstSetServer === 'us' ? 'opponent' : 'us');
    }
    return currentSet.events[currentSet.events.length - 1].scoringTeam;
  }, [currentSet.events, match.currentSetIndex, match.initialServer]);

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

    // Check if set is finished
    const targetScore = (match.type === '5set' && match.currentSetIndex === 4) ? 15 : 25;
    
    const { ourScore, opponentScore } = updatedSet;
    const isFinished = (ourScore >= targetScore || opponentScore >= targetScore) && 
                       Math.abs(ourScore - opponentScore) >= 2;

    if (isFinished) {
      updatedSet.finished = true;
      
      // Check if match is finished
      const ourSetsWon = updatedMatch.sets.filter(s => s.finished && s.ourScore > s.opponentScore).length;
      const opponentSetsWon = updatedMatch.sets.filter(s => s.finished && s.opponentScore > s.ourScore).length;
      const setsToWin = match.type === '3set' ? 2 : 3;

      if (ourSetsWon === setsToWin || opponentSetsWon === setsToWin) {
        updatedMatch.status = 'finished';
      } else {
        // Start next set
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
        // Go back to previous set if this one just started
        updatedMatch.currentSetIndex--;
        // Re-enable the previous set
        updatedMatch.sets[updatedMatch.currentSetIndex].finished = false;
        // Also remove the empty set we just left
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
        <button className="icon-button" onClick={onReset} title="Reset Match">
          <RotateCcw size={20} />
        </button>
        <div className="set-info">
          SET {match.currentSetIndex + 1}
        </div>
        <button className="icon-button" onClick={() => onUpdate({ ...match, status: 'finished' })} title="Finish Match Early">
          <BarChart2 size={20} />
        </button>
      </header>

      <div className="scoreboard">
        <div className={`team-score ${servingTeam === 'us' ? 'serving' : ''}`}>
          <span className="team-name">{match.ourTeamName}</span>
          <span className="score-value">{currentSet.ourScore}</span>
          {servingTeam === 'us' && <div className="serving-dot">● SERVING</div>}
        </div>
        <div className="score-divider">:</div>
        <div className={`team-score ${servingTeam === 'opponent' ? 'serving' : ''}`}>
          <span className="team-name">{match.opponentTeamName}</span>
          <span className="score-value">{currentSet.opponentScore}</span>
          {servingTeam === 'opponent' && <div className="serving-dot">● SERVING</div>}
        </div>
      </div>

      <div className="action-buttons">
        <button className="point-button our-point" onClick={() => handlePointScored('us')}>
          POINT {match.ourTeamName}
        </button>
        <button className="point-button opponent-point" onClick={() => handlePointScored('opponent')}>
          POINT {match.opponentTeamName}
        </button>
      </div>

      <div className="footer-actions">
        <button className="secondary" onClick={undoLastPoint} disabled={currentSet.events.length === 0 && match.currentSetIndex === 0}>
          <Undo2 size={18} /> Undo Last Point
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
