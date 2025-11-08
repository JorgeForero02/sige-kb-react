import React, { useState } from 'react';
import './AlertSimple.css';

export function AlertSimple({ message, type = 'info', autoClose = true, onClose }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (autoClose) {
    setTimeout(handleClose, 4000);
  }

  return (
    <div className={`alert-simple alert-${type}`}>
      <span className="alert-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '!'}
        {type === 'info' && 'ℹ'}
      </span>
      <span className="alert-message">{message}</span>
      <button className="alert-close" onClick={handleClose}>×</button>
    </div>
  );
}