import { useState, useCallback } from 'react';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({ type = 'info', message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const newNotification = { id, type, message };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}