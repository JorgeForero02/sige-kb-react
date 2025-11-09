import './Modal.css';

export function Modal({ 
  show, 
  onClose, 
  children, 
  title, 
  size = 'md',
  closeOnOverlayClick = true 
}) {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const getModalSize = () => {
    const sizes = {
      sm: '400px',
      md: '600px',
      lg: '800px',
      xl: '1000px'
    };
    return sizes[size] || sizes.md;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="modal-content"
        style={{ maxWidth: getModalSize() }}
      >
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}