import { type FC, type MouseEvent } from 'react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

const ConfirmationModal: FC<Props> = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  isDanger = false 
}) => {
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>{title}</h2>
        <p style={{ margin: '1rem 0', color: 'var(--secondary)' }}>{message}</p>
        
        <div className="button-group">
          <button 
            className={isDanger ? 'point-button opponent-point' : 'primary'} 
            onClick={onConfirm}
            style={{ height: 'auto', padding: '1rem' }}
          >
            {confirmLabel}
          </button>
          <button className="text-button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
