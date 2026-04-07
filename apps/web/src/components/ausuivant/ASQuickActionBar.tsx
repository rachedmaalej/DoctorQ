import ASIcon from './ASIcon';
import { formatDisplayName } from './utils';

interface ASQuickActionBarProps {
  onAddPatient: () => void;
  onCallNext: () => void;
  isCallingNext: boolean;
  disabled: boolean;
  waitingCount: number;
  /** Name of the next patient to be called (null if queue empty) */
  nextPatientName?: string | null;
}

/**
 * Floating CTA bar at the bottom of the AuSuivant dashboard.
 * Prominent "Appeler Suivant · {name}" button — showing the name removes guessing
 * and acts as a confirmation safeguard. Queue count is secondary info.
 */
export default function ASQuickActionBar({
  onAddPatient,
  onCallNext,
  isCallingNext,
  disabled,
  waitingCount,
  nextPatientName,
}: ASQuickActionBarProps) {
  const displayName = nextPatientName ? formatDisplayName(nextPatientName) : null;

  return (
    <div
      className="fixed left-0 right-0 flex items-center gap-3"
      style={{
        bottom: 0,
        padding: '12px 16px 20px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, #f4f1ec 60%, rgba(244,241,236,0.6) 85%, transparent)',
        zIndex: 30,
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Add Patient button */}
      <button
        onClick={onAddPatient}
        aria-label="Ajouter un patient"
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          border: 'none',
          background: '#2a9d6e',
          color: 'white',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <ASIcon name="person_add" size={22} />
      </button>

      {/* Floating CTA — "Appeler Suivant · {name}" */}
      <button
        onClick={onCallNext}
        disabled={disabled || isCallingNext}
        aria-label={
          disabled
            ? 'Aucun patient en attente'
            : displayName
              ? `Appeler suivant : ${displayName}, ${waitingCount} en attente`
              : 'Appeler suivant'
        }
        className="flex items-center justify-center gap-2 flex-1"
        style={{
          padding: '14px 18px',
          border: 'none',
          borderRadius: 12,
          background: disabled ? '#9E9B90' : '#1a3c34',
          color: 'white',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 15.2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: isCallingNext ? 0.7 : disabled ? 0.5 : 1,
          boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.15s ease',
          minWidth: 0,
        }}
      >
        {disabled ? (
          <span
            style={{
              fontSize: 13.6,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Aucun patient en attente
          </span>
        ) : (
          <>
            <ASIcon name="arrow_forward" size={20} />
            <span style={{ fontWeight: 600 }}>Appeler Suivant</span>
            {displayName && (
              <span
                style={{
                  opacity: 0.8,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                · {displayName}
              </span>
            )}
            {waitingCount > 0 && (
              <>
                <span
                  style={{
                    width: 1,
                    height: 18,
                    background: 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                >
                  {waitingCount} en attente
                </span>
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
}
