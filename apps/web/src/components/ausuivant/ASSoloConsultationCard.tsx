import ASIcon from './ASIcon';
import type { QueueEntry } from '@/types';
import { formatDisplayName, formatArrivalTime, getConsultationDuration } from './utils';

interface ASSoloConsultationCardProps {
  patient: QueueEntry | null;
  onComplete?: (id: string) => void;
  onMarkNoShow?: (id: string) => void;
}

export default function ASSoloConsultationCard({
  patient,
  onComplete,
  onMarkNoShow,
}: ASSoloConsultationCardProps) {
  if (!patient) {
    return (
      <div style={{
        margin: '0 16px 8px',
        background: 'var(--color-surface-alt)',
        borderRadius: 14,
        padding: '24px 16px',
        textAlign: 'center',
        border: '2px dashed var(--color-border)',
      }}>
        <ASIcon name="person_search" size={28} style={{ color: 'var(--color-text-muted)', marginBottom: 6 }} />
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Aucun patient en consultation
        </div>
      </div>
    );
  }

  const displayName = formatDisplayName(patient.patientName);
  const arrivalTime = formatArrivalTime(patient.arrivedAt);
  const consultMins = getConsultationDuration(patient.calledAt);

  return (
    <div style={{
      margin: '0 16px 8px',
      background: 'linear-gradient(135deg, #3B6FC0, #2D5A9E)',
      borderRadius: 14,
      padding: 16,
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        opacity: 0.65,
        marginBottom: 6,
      }}>
        Patient actuel
      </div>

      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 2 }}>
        {displayName}
      </div>

      <div style={{
        fontSize: 12,
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
      }}>
        <ASIcon name="schedule" size={14} />
        Arrivé à {arrivalTime} · Consultation depuis {consultMins} min
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onComplete?.(patient.id)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: '#fff',
            color: '#3B6FC0',
          }}
        >
          <ASIcon name="check_circle" size={17} fill />
          Terminer
        </button>
        <button
          onClick={() => onMarkNoShow?.(patient.id)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(255,255,255,0.14)',
            color: '#fff',
          }}
        >
          <ASIcon name="person_off" size={17} />
          Absent
        </button>
      </div>
    </div>
  );
}
