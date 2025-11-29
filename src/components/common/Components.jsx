import './Components.css';

export { Modal } from './Modal';
export function Card({ children, className = '' }) {
  return (
    <div className={`card-component ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

export function Button({ children, onClick, disabled = false, variant = 'primary', className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  onWheel,
  ...props
}) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`form-input ${className}`}
        onWheel={onWheel}
        {...props}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, required = false }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select value={value} onChange={onChange} required={required} className="form-select">
        <option value="">Seleccionar...</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.nombre || opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}

export function Empty({ message = 'Sin datos' }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}

export function Alert({ children, type = 'info' }) {
  return (
    <div className={`alert alert-${type}`}>
      {children}
    </div>
  );
}