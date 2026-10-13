import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Log Out',
  message = 'Are you sure you want to log out? You will need to sign in again to access your account.',
  confirmText = 'Log out',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = <LogOut size={20} />
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <button
          className="modalCloseBtn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="modalHeader">
          <div className={`modalIconWrap ${variant}`}>
            {icon}
          </div>
          <div className="modalTitleGroup">
            <h3 id="modal-title">{title}</h3>
            <p>{message}</p>
          </div>
        </div>

        <div className="modalActions">
          <button type="button" className="modalCancelBtn" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`modalConfirmBtn ${variant}`}
            onClick={onConfirm}
          >
            {icon}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
