import clsx from 'clsx';
import type { QueuePatient } from './types';

interface PatientContextSheetProps {
  isOpen: boolean;
  patient: QueuePatient | null;
  onClose: () => void;
  onMarkPriority?: (id: string) => void;
  onMarkSteppedOut?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const actions = [
  {
    key: 'priority',
    icon: 'priority_high',
    label: 'Marquer prioritaire',
    desc: 'Remonter dans la file',
    iconBg: '#FEF7E6',
    iconColor: '#D4920B',
  },
  {
    key: 'stepped-out',
    icon: 'directions_walk',
    label: 'Marquer sorti',
    desc: 'Parti temporairement',
    iconBg: '#EDF3FC',
    iconColor: '#3B7DD9',
  },
  {
    key: 'phone',
    icon: 'phone',
    label: 'Appeler le patient',
    desc: 'Appel téléphonique',
    iconBg: '#EDF7F0',
    iconColor: '#2D8B4E',
  },
  {
    key: 'remove',
    icon: 'person_remove',
    label: 'Retirer de la file',
    desc: 'Supprimer définitivement',
    iconBg: '#FDF0ED',
    iconColor: '#D94F3B',
  },
] as const;

export default function PatientContextSheet({
  isOpen,
  patient,
  onClose,
  onMarkPriority,
  onMarkSteppedOut,
  onRemove,
}: PatientContextSheetProps) {
  const handleAction = (key: string) => {
    if (!patient) return;
    switch (key) {
      case 'priority':
        onMarkPriority?.(patient.id);
        break;
      case 'stepped-out':
        onMarkSteppedOut?.(patient.id);
        break;
      case 'phone':
        if (patient.phone) {
          window.open(`tel:${patient.phone}`, '_self');
        }
        return; // don't close sheet after phone tap
      case 'remove':
        onRemove?.(patient.id);
        break;
    }
    onClose();
  };

  const isPhoneDisabled = !patient?.hasPhone;

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

        {/* Patient name header */}
        {patient && (
          <div className="pb-3 mb-1 border-b border-bs-border">
            <div className="text-bs-text-primary font-bold" style={{ fontSize: 16 }}>
              {patient.name}
            </div>
            <div className="text-bs-text-tertiary mt-0.5" style={{ fontSize: 12 }}>
              Position #{patient.position} · {patient.waitMinutes} min d'attente
            </div>
          </div>
        )}

        {/* Action rows */}
        <div className="flex flex-col">
          {actions.map((action) => {
            const disabled = action.key === 'phone' && isPhoneDisabled;
            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={disabled}
                className={clsx(
                  'flex items-center gap-3 text-left transition-colors duration-150 active:bg-bs-surface-alt',
                  disabled && 'opacity-30 pointer-events-none',
                )}
                style={{ padding: '14px 12px' }}
              >
                {/* Colored icon square */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: action.iconBg,
                  }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 20, color: action.iconColor }}
                  >
                    {action.icon}
                  </span>
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-bs-text-primary font-semibold" style={{ fontSize: 15 }}>
                    {action.label}
                  </div>
                  <div className="text-bs-text-tertiary" style={{ fontSize: 12 }}>
                    {action.desc}
                  </div>
                </div>

                {/* Chevron */}
                <span
                  className="material-symbols-rounded text-bs-text-tertiary shrink-0"
                  style={{ fontSize: 18 }}
                >
                  chevron_right
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
