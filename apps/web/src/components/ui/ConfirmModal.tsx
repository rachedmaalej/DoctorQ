import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

/**
 * MD3-compliant confirmation dialog.
 * Uses Material Symbols icons and follows MD3 shape, color, and elevation guidelines.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
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
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null;

  // MD3-compliant variant styles
  const variantStyles = {
    danger: {
      icon: 'warning',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
    warning: {
      icon: 'error',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
    },
    info: {
      icon: 'info',
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      confirmBtn: 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Scrim (MD3 term for backdrop) */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog container - centered */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all w-full max-w-sm"
          style={{
            // MD3 elevation level 3
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
          }}
        >
          {/* Dialog content */}
          <div className="p-6 text-center">
            {/* Icon - MD3 uses centered icons for dialogs */}
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${styles.iconBg} mb-4`}>
              <span
                className={`material-symbols-outlined text-3xl ${styles.iconColor}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                {styles.icon}
              </span>
            </div>

            {/* Title - MD3 headline small */}
            <h3
              id="modal-title"
              className="text-xl font-semibold text-gray-900 mb-2"
            >
              {title}
            </h3>

            {/* Supporting text - MD3 body medium */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions - MD3 uses text buttons aligned to the right */}
          <div className="px-6 pb-6 pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText || t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 rounded-full text-sm font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.confirmBtn}`}
            >
              {isLoading && (
                <span
                  className="material-symbols-outlined text-lg animate-spin"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                >
                  progress_activity
                </span>
              )}
              {isLoading ? t('common.loading') : (confirmText || t('common.delete'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
