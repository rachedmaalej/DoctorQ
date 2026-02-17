import { useEffect, useRef } from 'react';

interface PSQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  doctorName?: string | null;
}

export default function PSQuitModal({ isOpen, onClose, onConfirm, isLoading, doctorName }: PSQuitModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Escape key closes modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const doctorDisplay = doctorName || 'le médecin';

  return (
    <div
      className={`ps-modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={!isLoading ? onClose : undefined}
      aria-modal={isOpen}
      role="dialog"
      aria-label="Annuler votre place"
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="ps-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="ps-modal-handle" />

        {/* Title */}
        <div className="ps-modal-title">Annuler votre place ?</div>

        {/* Description */}
        <div className="ps-modal-desc">
          Vous perdrez votre position actuelle dans la file d'attente et devrez vous réinscrire
          si vous souhaitez consulter {doctorDisplay}.
        </div>

        {/* Actions */}
        <button
          className="ps-modal-danger-btn"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Annulation...' : 'Oui, annuler ma place'}
        </button>
        <button
          className="ps-modal-cancel-btn"
          onClick={onClose}
          disabled={isLoading}
        >
          Non, je reste dans la file
        </button>
      </div>
    </div>
  );
}
