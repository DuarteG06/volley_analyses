import { useState, type FC } from 'react';
import type { Team, PointReason, EventDetails, ReceiveQuality } from '../types';

interface Props {
  scoringTeam: Team;
  servingTeam: Team;
  onConfirm: (reason: PointReason, details: EventDetails) => void;
  onCancel: () => void;
}

type Step = 'reason' | 'receive' | 'extra';

const RecordingModal: FC<Props> = ({ scoringTeam, servingTeam, onConfirm, onCancel }) => {
  const [step, setStep] = useState<Step>('reason');
  const [selectedReason, setSelectedReason] = useState<PointReason | null>(null);
  const [details, setDetails] = useState<EventDetails>({});

  const needsReceiveQuality = (reason: PointReason) => {
    // Always ask for receive quality when opponent is serving, except for aces or missed serves
    return servingTeam === 'opponent' && reason !== 'ace' && reason !== 'serve_miss';
  };

  const needsExtraDetails = (reason: PointReason) => {
    return reason === 'block_against' || reason === 'spike_kill_against';
  };

  const handleReasonClick = (reason: PointReason) => {
    setSelectedReason(reason);
    
    if (needsReceiveQuality(reason)) {
      setStep('receive');
    } else if (needsExtraDetails(reason)) {
      setStep('extra');
    } else {
      onConfirm(reason, {});
    }
  };

  const handleReceiveQuality = (quality: ReceiveQuality) => {
    const updatedDetails = { ...details, receiveQuality: quality };
    setDetails(updatedDetails);

    if (selectedReason && needsExtraDetails(selectedReason)) {
      setStep('extra');
    } else if (selectedReason) {
      onConfirm(selectedReason, updatedDetails);
    }
  };

  const handleExtraDetails = (extra: EventDetails) => {
    if (selectedReason) {
      onConfirm(selectedReason, { ...details, ...extra });
    }
  };

  const renderReasons = () => {
    if (servingTeam === 'us') {
      if (scoringTeam === 'us') {
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
      if (scoringTeam === 'us') {
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
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block_against')}>Block Against Us</button>
            <button onClick={() => handleReasonClick('spike_kill_against')}>Spike Kill Against Us</button>
            <button onClick={() => handleReasonClick('ace')}>Ace Against Us</button>
            <button onClick={() => handleReasonClick('missed_free_ball')}>Missed Free Ball</button>
            <button onClick={() => handleReasonClick('ball_into_net')}>Ball into Net</button>
            <button onClick={() => handleReasonClick('ball_out_of_bounds')}>Ball Out of Bounds</button>
            <button onClick={() => handleReasonClick('bad_set')}>Bad Set</button>
          </div>
        );
      }
    }
  };

  const renderReceiveStep = () => (
    <div className="details-prompt">
      <h3>Receive Quality</h3>
      <div className="button-group">
        <button onClick={() => handleReceiveQuality('A')}>A Pass</button>
        <button onClick={() => handleReceiveQuality('B')}>B Pass</button>
        <button onClick={() => handleReceiveQuality('C')}>C Pass</button>
      </div>
    </div>
  );

  const renderExtraStep = () => {
    if (selectedReason === 'block_against') {
      return (
        <div className="details-prompt">
          <h3>Was there cover?</h3>
          <div className="button-group">
            <button onClick={() => handleExtraDetails({ protection: true })}>Yes</button>
            <button onClick={() => handleExtraDetails({ protection: false })}>No</button>
          </div>
        </div>
      );
    }

    if (selectedReason === 'spike_kill_against') {
      return (
        <div className="details-prompt">
          <h3>Why did they score?</h3>
          <div className="button-group">
            <button onClick={() => handleExtraDetails({ failedReceive: false })}>Good Spike</button>
            <button onClick={() => handleExtraDetails({ failedReceive: true })}>Failed Receive</button>
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
        <p>
          {step === 'reason' && 'How did the point happen?'}
          {step === 'receive' && 'Rate the receive quality'}
          {step === 'extra' && 'Additional details'}
        </p>
        
        {step === 'reason' && renderReasons()}
        {step === 'receive' && renderReceiveStep()}
        {step === 'extra' && renderExtraStep()}
        
        <div className="modal-footer">
          <button className="text-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
