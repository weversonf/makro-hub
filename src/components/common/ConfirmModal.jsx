import React from 'react';
import { useHub } from '../../context/HubContext';
import { X } from 'lucide-react';

export default function ConfirmModal() {
  const { confirmModal, closeConfirm } = useHub();

  if (!confirmModal.open) return null;

  return (
    <div className="ax-overlay open" onClick={closeConfirm}>
      <div className="ax-modal ax-modal--sm" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="ax-modal__head">
          <h3 className="ax-modal__title" style={{ fontSize: 'var(--ax-text-md)' }}>
            {confirmModal.title || 'Confirmação'}
          </h3>
          <button className="ax-icon-btn" onClick={closeConfirm} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="ax-modal__body" style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>
          {confirmModal.message}
        </div>
        <div className="ax-modal__foot">
          <span className="ax-header__spacer" />
          <button className="ax-btn ax-btn--ghost" onClick={closeConfirm}>
            Cancelar
          </button>
          <button
            className="ax-btn ax-btn--danger"
            onClick={() => {
              if (confirmModal.onConfirm) confirmModal.onConfirm();
              closeConfirm();
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
