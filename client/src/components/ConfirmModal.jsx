import React from 'react';
import Modal from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: type === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)',
            color: type === 'danger' ? 'var(--danger)' : 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {type === 'danger' ? <AlertTriangle size={22} /> : <AlertCircle size={22} />}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
          {message}
        </div>
      </div>

      <div className="confirm-modal-actions">
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </button>
        <button
          className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
