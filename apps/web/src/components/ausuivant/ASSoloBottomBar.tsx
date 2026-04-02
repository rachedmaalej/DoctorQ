import ASIcon from './ASIcon';
import { formatDisplayName } from './utils';

interface ASSoloBottomBarProps {
  nextPatientName: string | null;
  onCallNext: () => void;
  onAddPatient: () => void;
  isCallingNext: boolean;
  disabled: boolean;
  isDoctorPresent: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
}

export default function ASSoloBottomBar({
  nextPatientName,
  onCallNext,
  onAddPatient,
  isCallingNext,
  disabled,
  isDoctorPresent,
  onStartSession,
  onEndSession,
}: ASSoloBottomBarProps) {
  const displayName = nextPatientName ? formatDisplayName(nextPatientName) : null;

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      padding: '12px 16px',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)',
      zIndex: 30,
    }}>
      {!isDoctorPresent ? (
        /* Pre-session: single "Démarrer" CTA */
        <button
          onClick={onStartSession}
          style={{
            width: '100%',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            padding: 16,
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(26, 60, 143, 0.25)',
          }}
        >
          <ASIcon name="play_arrow" size={20} fill />
          Démarrer les consultations
        </button>
      ) : (
        /* Active session: Add patient + Appeler Suivant + End session */
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Add Patient button */}
          <button
            onClick={onAddPatient}
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ASIcon name="person_add" size={22} />
          </button>

          {/* Call Next CTA */}
          <button
            onClick={onCallNext}
            disabled={disabled || isCallingNext}
            style={{
              flex: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              padding: 15,
              background: disabled ? '#8A94A6' : '#1A2233',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: disabled ? 'none' : '0 8px 28px rgba(26,34,51,0.10)',
              opacity: isCallingNext ? 0.7 : 1,
            }}
          >
            <ASIcon name="arrow_forward" size={19} />
            Appeler Suivant
            {displayName && (
              <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>
                · {displayName}
              </span>
            )}
          </button>

          {/* End session button */}
          <button
            onClick={onEndSession}
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Terminer la session"
          >
            <ASIcon name="stop_circle" size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
