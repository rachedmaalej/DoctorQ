import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { QueueScreenStatus } from './types';

interface StatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  status: QueueScreenStatus;
  // OPEN state data
  dayOpenedAt?: string;
  totalAdded?: number;
  // CLOSING state data
  remainingCount?: number;
  // Doctor presence
  isDoctorPresent: boolean;
  onToggleDoctorPresent?: () => void;
  // Actions
  onCloseQueue?: () => void;
  onReopenQueue?: () => void;
}

export default function StatusSheet({
  isOpen,
  onClose,
  status,
  dayOpenedAt,
  totalAdded,
  remainingCount,
  isDoctorPresent,
  onToggleDoctorPresent,
  onCloseQueue,
  onReopenQueue,
}: StatusSheetProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'absolute inset-0 z-[99] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className={clsx(
          'bs-sheet absolute bottom-0 left-0 right-0 z-[100] bg-bs-surface',
        )}
        style={{
          borderRadius: '20px 20px 0 0',
          padding: '8px 20px 36px',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-bs-border rounded-full mx-auto mt-2 mb-4" />

        {/* Status indicator row */}
        <div className="flex items-center gap-2.5 py-3 pb-4 border-b border-bs-border mb-4">
          <div
            className={clsx(
              'w-2.5 h-2.5 rounded-full shrink-0',
              status === 'OPEN' && 'bg-bs-green',
              status === 'CLOSING' && 'bg-bs-amber animate-bs-pulse-dot',
            )}
          />
          <div className="flex-1">
            <div className="text-bs-text-primary font-bold" style={{ fontSize: 15 }}>
              {status === 'OPEN' ? t('receptionist.statusSheet.queueOpen') : t('receptionist.statusSheet.queueClosing')}
            </div>
            <div className="text-bs-text-tertiary mt-px" style={{ fontSize: 12 }}>
              {status === 'OPEN'
                ? t('receptionist.statusSheet.openSince', { time: dayOpenedAt, count: totalAdded })
                : t('receptionist.statusSheet.remaining', { count: remainingCount })}
            </div>
          </div>
        </div>

        {/* Action button */}
        {status === 'OPEN' ? (
          <>
            <button
              onClick={() => { onCloseQueue?.(); onClose(); }}
              className="w-full h-12 rounded-bs text-bs-amber font-semibold flex items-center justify-center gap-2 mb-2.5 transition-all duration-150 active:scale-[0.97]"
              style={{ fontSize: 15, backgroundColor: '#FEF7E6', border: '1.5px solid rgba(212,146,11,0.15)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>block</span>
              {t('receptionist.statusSheet.closeQueue')}
            </button>
            <div className="text-bs-text-tertiary text-center mb-2" style={{ fontSize: 12 }}>
              {t('receptionist.statusSheet.closeHint')}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { onReopenQueue?.(); onClose(); }}
              className="w-full h-12 rounded-bs text-bs-green font-semibold flex items-center justify-center gap-2 mb-2.5 transition-all duration-150 active:scale-[0.97]"
              style={{ fontSize: 15, backgroundColor: '#EDF7F0', border: '1.5px solid rgba(45,139,78,0.15)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>refresh</span>
              {t('receptionist.statusSheet.reopenQueue')}
            </button>
            <div className="text-bs-text-tertiary text-center mb-1" style={{ fontSize: 12 }}>
              {t('receptionist.statusSheet.reopenHint')}
            </div>
          </>
        )}

        {/* Doctor presence section */}
        <div
          className="text-bs-text-tertiary font-semibold uppercase border-t border-bs-border pt-3 mt-4 mb-2.5"
          style={{ fontSize: 11, letterSpacing: '0.06em' }}
        >
          {t('receptionist.statusSheet.doctorPresence')}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => !isDoctorPresent && onToggleDoctorPresent?.()}
            className={clsx(
              'flex-1 h-[42px] rounded-bs-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200',
              isDoctorPresent ? 'text-bs-green' : 'text-bs-text-tertiary',
            )}
            style={{
              fontSize: 13,
              backgroundColor: isDoctorPresent ? '#EDF7F0' : 'transparent',
              border: isDoctorPresent ? '1.5px solid rgba(45,139,78,0.2)' : '1.5px solid #E8E6DF',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            {t('receptionist.statusSheet.present')}
          </button>
          <button
            onClick={() => isDoctorPresent && onToggleDoctorPresent?.()}
            className={clsx(
              'flex-1 h-[42px] rounded-bs-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200',
              !isDoctorPresent ? 'text-bs-red' : 'text-bs-text-tertiary',
            )}
            style={{
              fontSize: 13,
              backgroundColor: !isDoctorPresent ? '#FDF0ED' : 'transparent',
              border: !isDoctorPresent ? '1.5px solid rgba(217,79,59,0.2)' : '1.5px solid #E8E6DF',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span>
            {t('receptionist.statusSheet.absent')}
          </button>
        </div>
      </div>
    </>
  );
}
