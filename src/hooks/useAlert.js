import { useState } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

  const clearAlert = () => {
    setAlert(null);
  };

  return {
    alert,
    showAlert,
    clearAlert,
    success: (msg) => showAlert(msg, 'success'),
    error: (msg) => showAlert(msg, 'error'),
    warning: (msg) => showAlert(msg, 'warning'),
    info: (msg) => showAlert(msg, 'info'),
  };
}