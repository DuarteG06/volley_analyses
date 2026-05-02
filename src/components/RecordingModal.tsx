import { useState, type FC, type MouseEvent } from 'react';
import type { Team, PointReason, EventDetails, ReceiveQuality } from '../types';
import { useLanguage } from '../languages/LanguageContext';

interface Props {
  scoringTeam: Team;
  servingTeam: Team;
  onConfirm: (reason: PointReason, details: EventDetails) => void;
  onCancel: () => void;
}

type Step = 'reason' | 'error' | 'fault' | 'receive' | 'sideout' | 'extra';

const FAULT_REASONS: PointReason[] = [
  'net_touch',
  'backline_fault',
  'center_line_violation',
  'over_the_net_fault',
  'four_touches',
  'double_touch',
];

const ERROR_REASONS: PointReason[] = [
  'missed_free_ball',
  'ball_into_net',
  'ball_out_of_bounds',
  'bad_set',
];

const RecordingModal: FC<Props> = ({ scoringTeam, servingTeam, onConfirm, onCancel }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('reason');
  const [selectedReason, setSelectedReason] = useState<PointReason | null>(null);
  const [details, setDetails] = useState<EventDetails>({});

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const needsReceiveQuality = (reason: PointReason) => {
    // Always ask for receive quality when opponent is serving, except for aces or missed serves
    // Aces are handled automatically as 'C' quality
    return servingTeam === 'opponent' && reason !== 'ace' && reason !== 'serve_miss';
  };

  const needsSideoutQuestion = (reason: PointReason) => {
    // We only ask for sideout if we scored while the opponent was serving
    // and it wasn't a direct serve miss, a block, or an opponent error
    return scoringTeam === 'us' && 
           servingTeam === 'opponent' && 
           reason !== 'serve_miss' && 
           reason !== 'block' && 
           reason !== 'opponent_error';
  };

  const needsExtraDetails = (reason: PointReason) => {
    return reason === 'block_against' || reason === 'spike_kill_against';
  };

  const handleReasonClick = (reason: PointReason) => {
    setSelectedReason(reason);
    
    if (needsReceiveQuality(reason)) {
      setStep('receive');
    } else {
      const initialDetails: EventDetails = {};
      // If it's an ace against us, it's a C pass quality
      if (reason === 'ace' && servingTeam === 'opponent') {
        initialDetails.receiveQuality = 'C';
      }

      if (needsSideoutQuestion(reason)) {
        setDetails(initialDetails);
        setStep('sideout');
      } else if (needsExtraDetails(reason)) {
        setDetails(initialDetails);
        setStep('extra');
      } else {
        onConfirm(reason, initialDetails);
      }
    }
  };

  const handleReceiveQuality = (quality: ReceiveQuality) => {
    const updatedDetails = { ...details, receiveQuality: quality };
    setDetails(updatedDetails);

    if (selectedReason && needsSideoutQuestion(selectedReason)) {
      setStep('sideout');
    } else if (selectedReason && needsExtraDetails(selectedReason)) {
      setStep('extra');
    } else if (selectedReason) {
      onConfirm(selectedReason, updatedDetails);
    }
  };

  const handleSideout = (isSideout: boolean) => {
    const updatedDetails = { ...details, sideout: isSideout };
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
            <button onClick={() => handleReasonClick('block')}>{t.reasons.block}</button>
            <button onClick={() => handleReasonClick('block_out')}>{t.reasons.block_out}</button>
            <button onClick={() => handleReasonClick('spike_kill')}>{t.reasons.spike_kill}</button>
            <button onClick={() => handleReasonClick('spike_tip')}>{t.reasons.spike_tip}</button>
            <button onClick={() => handleReasonClick('ace')}>{t.reasons.ace}</button>
            <button onClick={() => handleReasonClick('set_dump')}>{t.reasons.set_dump}</button>
            <button onClick={() => handleReasonClick('opponent_error')}>{t.reasons.opponent_error}</button>
          </div>
        );
      } else {
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block_against')}>{t.reasons.block_against}</button>
            <button onClick={() => handleReasonClick('block_out_against')}>{t.reasons.block_out_against}</button>
            <button onClick={() => handleReasonClick('spike_kill_against')}>{t.reasons.spike_kill_against}</button>
            <button onClick={() => handleReasonClick('spike_tip_against')}>{t.reasons.spike_tip_against}</button>
            <button onClick={() => setStep('error')}>{t.recording.error}</button>
            <button className="fault-selector-button" onClick={() => setStep('fault')}>{t.recording.fault}</button>
          </div>
        );
      }
    } else {
      if (scoringTeam === 'us') {
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block')}>{t.reasons.block}</button>
            <button onClick={() => handleReasonClick('block_out')}>{t.reasons.block_out}</button>
            <button onClick={() => handleReasonClick('spike_kill')}>{t.reasons.spike_kill}</button>
            <button onClick={() => handleReasonClick('spike_tip')}>{t.reasons.spike_tip}</button>
            <button onClick={() => handleReasonClick('set_dump')}>{t.reasons.set_dump}</button>
            <button onClick={() => handleReasonClick('serve_miss')}>{t.reasons.serve_miss}</button>
            <button onClick={() => handleReasonClick('opponent_error')}>{t.reasons.opponent_error}</button>
          </div>
        );
      } else {
        return (
          <div className="button-grid">
            <button onClick={() => handleReasonClick('block_against')}>{t.reasons.block_against}</button>
            <button onClick={() => handleReasonClick('block_out_against')}>{t.reasons.block_out_against}</button>
            <button onClick={() => handleReasonClick('spike_kill_against')}>{t.reasons.spike_kill_against}</button>
            <button onClick={() => handleReasonClick('spike_tip_against')}>{t.reasons.spike_tip_against}</button>
            <button onClick={() => handleReasonClick('ace')}>{t.reasons.ace}</button>
            <button onClick={() => setStep('error')}>{t.recording.error}</button>
            <button className="fault-selector-button" onClick={() => setStep('fault')}>{t.recording.fault}</button>
          </div>
        );
      }
    }
  };

  const renderErrorReasons = () => {
    const reasons = servingTeam === 'us' ? [...ERROR_REASONS, 'serve_miss' as PointReason] : ERROR_REASONS;

    return (
      <div className="button-grid">
        {reasons.map(reason => (
          <button key={reason} onClick={() => handleReasonClick(reason)}>
            {t.reasons[reason]}
          </button>
        ))}
      </div>
    );
  };

  const renderFaultReasons = () => (
    <div className="button-grid">
      {FAULT_REASONS.map(reason => (
        <button key={reason} onClick={() => handleReasonClick(reason)}>
          {t.reasons[reason]}
        </button>
      ))}
    </div>
  );

  const renderReceiveStep = () => (
    <div className="details-prompt">
      <h3>{t.recording.receiveQuality}</h3>
      <div className="button-group">
        <button onClick={() => handleReceiveQuality('A')}>{t.recording.passA}</button>
        <button onClick={() => handleReceiveQuality('B')}>{t.recording.passB}</button>
        <button onClick={() => handleReceiveQuality('C')}>{t.recording.passC}</button>
      </div>
    </div>
  );

  const renderSideoutStep = () => (
    <div className="details-prompt">
      <h3>{t.recording.wasItSideout}</h3>
      <p>{t.recording.scoredFirstAttempt}</p>
      <div className="button-group">
        <button onClick={() => handleSideout(true)}>{t.common.yes}</button>
        <button onClick={() => handleSideout(false)}>{t.common.no}</button>
      </div>
    </div>
  );

  const renderExtraStep = () => {
    if (selectedReason === 'block_against') {
      return (
        <div className="details-prompt">
          <h3>{t.recording.wasThereCover}</h3>
          <div className="button-group">
            <button onClick={() => handleExtraDetails({ protection: true })}>{t.common.yes}</button>
            <button onClick={() => handleExtraDetails({ protection: false })}>{t.common.no}</button>
          </div>
        </div>
      );
    }

    if (selectedReason === 'spike_kill_against') {
      return (
        <div className="details-prompt">
          <h3>{t.recording.whyDidTheyScore}</h3>
          <div className="button-group">
            <button onClick={() => handleExtraDetails({ failedReceive: false })}>{t.recording.goodSpike}</button>
            <button onClick={() => handleExtraDetails({ failedReceive: true })}>{t.recording.failedReceive}</button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>{scoringTeam === 'us' ? t.recording.ourPoint : t.recording.opponentPoint}</h2>
        <p>
          {step === 'reason' && t.recording.howItHappened}
          {step === 'error' && t.recording.errorDetail}
          {step === 'fault' && t.recording.faultDetail}
          {step === 'receive' && t.recording.receiveQualityDetail}
          {step === 'sideout' && t.recording.sideoutDetail}
          {step === 'extra' && t.recording.additionalDetails}
        </p>
        
        {step === 'reason' && renderReasons()}
        {step === 'error' && renderErrorReasons()}
        {step === 'fault' && renderFaultReasons()}
        {step === 'receive' && renderReceiveStep()}
        {step === 'sideout' && renderSideoutStep()}
        {step === 'extra' && renderExtraStep()}
        
        <div className="modal-footer">
          {(step === 'error' || step === 'fault') && (
            <button className="text-button" onClick={() => setStep('reason')}>{t.common.back}</button>
          )}
          <button className="text-button" onClick={onCancel}>{t.common.cancel}</button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
