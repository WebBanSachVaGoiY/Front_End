import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideClose = false,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay animate-fadeIn"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={`modal-content modal-${size} animate-scaleIn`}>
        {(title || !hideClose) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {!hideClose && (
              <button className="modal-close" onClick={onClose} aria-label="Đóng">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
