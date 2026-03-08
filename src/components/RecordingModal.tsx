import { useState, type FC } from 'react';
import type { Team, PointReason, EventDetails } from '../types';

interface Props {
  scoringTeam: Team;
  servingTeam: Team;
  onConfirm: (reason: PointReason, details: EventDetails) => void;
  onCancel: () => void;
}

const RecordingModal: FC<Props> = ({ scoringTeam, servingTeam, onConfirm, onCancel }) => {
  const [step, setStep] = useState<'reason' | 'details'>('reason');
  const [selectedReason, setSelectedReason] = useState<PointReason | null>(null);

  const handleReasonClick = (reason: PointReason) => {
    setSelectedReason(reason);
    
    // Check if we need more details
    const needsReceiveQuality = servingTeam === 'opponent' && scoringTeam === 'us' && reason !== 'serve_miss';
    const needsAgainstDetails = reason === 'block_against' || reason === 'spike_kill_against';

    if (needsReceiveQuality || needsAgainstDetails) {
      setStep('details');
    } else {
      onConfirm(reason, {});
    }
  };

  const handleDetailsConfirm = (details: EventDetails) => {
    if (selectedReason) {
      onConfirm(selectedReason, details);
    }
  };

  const renderReasons = () => {
    if (servingTeam === 'us') {
      if (scoringTeam === 'us') {
        // We were serving, we scored
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block')}>Block</button>
            <button onClick={() => handleReasonClick('spike_kill')}>Spike Kill</button>
            <button onClick={() => handleReasonClick('ace')}>Ace</button>
            <button onClick={() => handleReasonClick('set_dump')}>Set Dump</button>
            <button onClick={() => handleReasonClick('opponent_error')}>Opponent Error</button>
          </div>
        );
      } else {
        // We were serving, we lost the point
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block_against')}>Block Against Us</button>
            <button onClick={() => handleReasonClick('spike_kill_against')}>Spike Kill Against Us</button>
            <button onClick={() => handleReasonClick('missed_free_ball')}>Missed Free Ball</button>
            <button onClick={() => handleReasonClick('ball_into_net')}>Ball into Net</button>
            <button onClick={() => handleReasonClick('ball_out_of_bounds')}>Ball Out of Bounds</button>
            <button onClick={() => handleReasonClick('bad_set')}>Bad Set</button>
            <button onClick={() => handleReasonClick('serve_miss')}>Serve Miss</button>
          </div>
        );
      }
    } else {
      // Opponent was serving
      if (scoringTeam === 'us') {
        // Opponent was serving, we scored
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block')}>Block</button>
            <button onClick={() => handleReasonClick('spike_kill')}>Spike Kill</button>
            <button onClick={() => handleReasonClick('set_dump')}>Set Dump</button>
            <button onClick={() => handleReasonClick('serve_miss')}>Opponent Serve Miss</button>
            <button onClick={() => handleReasonClick('opponent_error')}>Opponent Error</button>
          </div>
        );
      } else {
        // Opponent was serving, we lost the point
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block_against')}>Block Against Us</button>
            <button onClick={() => handleReasonClick('spike_kill_against')}>Spike Kill Against Us</button>
            <button onClick={() => handleReasonClick('ace')}>Ace Against Us</button>
            <button onClick={() => handleReasonClick('missed_free_ball')}>Missed Free Ball</button>
            <button onClick={() => handleReasonClick('ball_into_net')}>Ball into Net</button>
            <button onClick={() => handleReasonClick('ball_out_of_bounds')}>Ball Out of Bounds</button>
            <button onClick={() => handleReasonClick('serve_miss')}>Serve Miss (Our Error)</button>
          </div>
        );
      }
    }
  };

  const renderDetails = () => {
    if (selectedReason === 'block_against') {
      return (
        <div className="details-prompt">
          <h3>Was there cover?</h3>
          <div className="button-group">
            <button onClick={() => handleDetailsConfirm({ protection: true })}>Yes</button>
            <button onClick={() => handleDetailsConfirm({ protection: false })}>No</button>
          </div>
        </div>
      );
    }

    if (selectedReason === 'spike_kill_against') {
      return (
        <div className="details-prompt">
          <h3>Why did they score?</h3>
          <div className="button-group">
            <button onClick={() => handleDetailsConfirm({ failedReceive: false })}>Good Spike</button>
            <button onClick={() => handleDetailsConfirm({ failedReceive: true })}>Failed Receive</button>
          </div>
        </div>
      );
    }

    if (servingTeam === 'opponent' && scoringTeam === 'us') {
      return (
        <div className="details-prompt">
          <h3>Receive Quality</h3>
          <div className="button-group">
            <button onClick={() => handleDetailsConfirm({ receiveQuality: 'A' })}>A Pass</button>
            <button onClick={() => handleDetailsConfirm({ receiveQuality: 'B' })}>B Pass</button>
            <button onClick={() => handleDetailsConfirm({ receiveQuality: 'C' })}>C Pass</button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{scoringTeam === 'us' ? 'Our Point!' : 'Opponent Point'}</h2>
        <p>{step === 'reason' ? 'How did the point happen?' : 'Additional details'}</p>
        
        {step === 'reason' ? renderReasons() : renderDetails()}
        
        <div className="modal-footer">
          <button className="text-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
