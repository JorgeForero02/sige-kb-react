import React from 'react';
import './AlertSimple.css';

const defaultTitles = {
  success: 'Operación exitosa',
  error: 'Ha ocurrido un error',
  warning: '¿Estás seguro?',
  info: 'Información importante'
};

export function AlertSimple({ 
  show = true, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
  onConfirm,
  onCancel,
  closeOnOverlayClick = true,
  loading = false
}) {
  if (!show) return null;

  const resolvedTitle = title || defaultTitles[type] || defaultTitles.info;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={handleOverlayClick}>
      <div className={`alert-modal-content alert-modal-${type}`}>
        <button 
          className="alert-modal-close"
          onClick={onClose}
          aria-label="Cerrar alerta"
          type="button"
        >
          ×
        </button>
        <div className="alert-modal-header">
          <h3 className="alert-modal-title">{resolvedTitle}</h3>
        </div>
        
        <div className="alert-modal-body">
          <p className="alert-modal-message">{message}</p>
        </div>

        <div className="alert-modal-actions">
          <button 
            className={`alert-modal-btn alert-modal-btn-confirm alert-modal-btn-${type}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
          {showCancel && (
            <button 
              className="alert-modal-btn alert-modal-btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}