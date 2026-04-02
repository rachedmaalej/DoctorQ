import ASIcon from './ASIcon';
import { useAuthStore } from '@/stores/authStore';

interface ASSoloStartScreenProps {
  waitingCount: number;
  onStartSession: () => void;
}

export default function ASSoloStartScreen({ waitingCount, onStartSession }: ASSoloStartScreenProps) {
  const { clinic } = useAuthStore();
  const clinicName = clinic?.name || 'Cabinet';

  const now = new Date();
  const timeStr = `${now.getHours()}h${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100dvh - 120px)',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      {/* Time */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 40,
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        marginBottom: 8,
        letterSpacing: '-0.02em',
      }}>
        {timeStr}
      </div>

      {/* Clinic name */}
      <div style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        marginBottom: 32,
      }}>
        {clinicName}
      </div>

      {/* Waiting count badge */}
      {waitingCount > 0 && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: 'var(--color-accent-soft)',
          borderRadius: 999,
          marginBottom: 24,
        }}>
          <ASIcon name="group" size={16} style={{ color: 'var(--color-accent)' }} />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-accent)',
          }}>
            {waitingCount} patient{waitingCount > 1 ? 's' : ''} en attente
          </span>
        </div>
      )}

      {/* Start session button */}
      <button
        onClick={onStartSession}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 16,
          fontWeight: 700,
          padding: '16px 32px',
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 16px rgba(26, 60, 143, 0.25)',
        }}
      >
        <ASIcon name="play_arrow" size={22} fill />
        Démarrer les consultations
      </button>
    </div>
  );
}
