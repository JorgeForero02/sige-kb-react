// src/services/logger.js

const LOG_STYLES = {
  success: 'background: #10B981; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
  error: 'background: #EF4444; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
  warning: 'background: #F59E0B; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
  info: 'background: #3B82F6; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
};

export const logger = {
  success: (title, message = '') => {
    console.log(`%c✓ ${title}`, LOG_STYLES.success, message);
  },
  
  error: (title, message = '') => {
    console.error(`%c✕ ERROR: ${title}`, LOG_STYLES.error, message);
  },
  
  warning: (title, message = '') => {
    console.warn(`%c⚠ ADVERTENCIA: ${title}`, LOG_STYLES.warning, message);
  },
  
  info: (title, message = '') => {
    console.log(`%cℹ ${title}`, LOG_STYLES.info, message);
  },

  falta: (recurso, motivo = '') => {
    const msg = `Falta: ${recurso}${motivo ? ` - ${motivo}` : ''}`;
    console.error(`%c✕ FALTA: ${recurso}`, LOG_STYLES.error, motivo);
  },

  apiError: (endpoint, status, message) => {
    console.error(`%c✕ API ERROR`, LOG_STYLES.error, `${status} en ${endpoint}: ${message}`);
  },
};