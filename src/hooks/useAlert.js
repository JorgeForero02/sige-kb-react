import { useRef, useState } from 'react';

const DEFAULT_TIMEOUT = 2800;

export function useAlert() {
  const [alert, setAlert] = useState(null);
  const timeoutRef = useRef(null);

  const clearAlert = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAlert(null);
  };

  const showAlert = (message, type = 'info', options = {}) => {
    const { title, autoHide = true, duration = DEFAULT_TIMEOUT } = options;

    clearAlert();
    setAlert({ message, type, title });

    if (autoHide) {
      timeoutRef.current = setTimeout(() => {
        clearAlert();
      }, duration);
    }
  };

  return {
    alert,
    showAlert,
    clearAlert,
    success: (msg, options) => showAlert(msg, 'success', options),
    error: (msg, options) => showAlert(msg, 'error', options),
    warning: (msg, options) => showAlert(msg, 'warning', options),
    info: (msg, options) => showAlert(msg, 'info', options),
  };
}
