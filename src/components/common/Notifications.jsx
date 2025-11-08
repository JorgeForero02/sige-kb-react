import React from 'react';
import { useNotification } from '../hooks/useNotification';
import './Notifications.css';

export function Notifications() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notifications-container">
      {notifications.map(notif => (
        <div key={notif.id} className={`notification notification-${notif.type}`}>
          <div className="notification-content">
            {notif.type === 'success' && <span className="notif-icon">✓</span>}
            {notif.type === 'danger' && <span className="notif-icon">✕</span>}
            {notif.type === 'warning' && <span className="notif-icon">!</span>}
            {notif.type === 'info' && <span className="notif-icon">i</span>}
            <span className="notif-message">{notif.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notif.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}