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

  const getModalSizeClass = () => {
    const sizes = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl'
    };
    return sizes[size] || sizes.md;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className={`modal-content ${getModalSizeClass()}`}
      >
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            type="button"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}