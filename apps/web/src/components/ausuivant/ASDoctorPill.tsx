import ASIcon from './ASIcon';

import type { Doctor, DoctorState } from '@/types';
import { formatDoctorName, getTokenColor } from './utils';

interface StateVisual {
  icon: React.ReactNode;
  label: string;
  muted: boolean;
  overrideColor?: { bg: string; fg: string };
}

function getStateVisual(state: DoctorState, doctor: Doctor): StateVisual {
  const sinceMin = doctor.stateUpdatedAt
    ? Math.round((Date.now() - new Date(doctor.stateUpdatedAt).getTime()) / 60000)
    : 0;

  switch (state) {
    case 'consulting':
      return {
        icon: <span className="as-pulse-consultation" style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor', display: 'inline-block' }} />,
        label: sinceMin > 0 ? `En consult +${sinceMin}min` : 'En consult',
        muted: false,
      };
    case 'free':
      return { icon: <ASIcon name="check" size={12} />, label: 'Libre', muted: false };
    case 'pause':
      return { icon: <ASIcon name="pause" size={12} />, label: 'Pause', muted: true };
    case 'absent_today':
      return { icon: <ASIcon name="close" size={12} />, label: 'Absent', muted: true };
    case 'home_visit': {
      const etaDate = doctor.homeVisitETA ? new Date(doctor.homeVisitETA) : null;
      const isOverdue = etaDate ? etaDate.getTime() < Date.now() : false;
      if (isOverdue) {
        return {
          icon: <ASIcon name="home" size={12} />,
          label: 'Retard visite',
          muted: false,
          overrideColor: { bg: '#FFE9B7', fg: '#E15720' },
        };
      }
      const eta = etaDate
        ? etaDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '?';
      return { icon: <ASIcon name="home" size={12} />, label: `Visite — retour ~${eta}`, muted: false };
    }
    case 'inactive':
    default:
      return { icon: null, label: '', muted: true };
  }
}

interface ASDoctorPillProps {
  doctor: Doctor;
  waitingCount: number;
  onCallNext?: (doctorId: string) => void;
  onClick?: (doctorId: string) => void;
}

export default function ASDoctorPill({
  doctor,
  waitingCount,
  onCallNext,
  onClick,
}: ASDoctorPillProps) {
  if (doctor.state === 'inactive') return null;

  const baseColor = getTokenColor(doctor.colorToken);
  const visual = getStateVisual(doctor.state, doctor);
  const color = visual.overrideColor || baseColor;
  const showSuivant = (doctor.state === 'consulting' || doctor.state === 'free') && waitingCount > 0;

  return (
    <div
      className="flex items-center gap-1.5 flex-shrink-0 cursor-pointer as-doctor-pill"
      role="button"
      tabIndex={0}
      aria-label={`${formatDoctorName(doctor.name)}, ${visual.label || 'inactif'}${waitingCount > 0 ? `, ${waitingCount} patient${waitingCount > 1 ? 's' : ''} en attente` : ''}`}
      style={{
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        background: visual.muted ? 'var(--color-surface-alt)' : color.bg,
        border: `1px solid ${visual.muted ? 'var(--color-border-subtle)' : `${color.fg}20`}`,
        transition: 'all 0.2s ease',
      }}
      onClick={() => onClick?.(doctor.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(doctor.id); } }}
    >
      {/* Doctor color dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: visual.muted ? 'var(--color-text-muted)' : color.fg,
          flexShrink: 0,
        }}
      />

      {/* State icon */}
      {visual.icon && (
        <span style={{ color: visual.muted ? 'var(--color-text-muted)' : color.fg, display: 'flex', alignItems: 'center' }}>
          {visual.icon}
        </span>
      )}

      {/* Doctor name + state */}
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: visual.muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {doctor.name}
      </span>
      <span
        style={{
          fontSize: 10,
          color: visual.muted ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {visual.label}
      </span>

      {/* Inline Suivant button */}
      {showSuivant && onCallNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCallNext(doctor.id);
          }}
          className="flex items-center gap-0.5"
          style={{
            marginLeft: 2,
            padding: '2px 6px',
            borderRadius: 6,
            border: `1px solid ${color.fg}40`,
            background: 'white',
            color: color.fg,
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          <ASIcon name="chevron_right" size={10} />
          Suivant
        </button>
      )}
    </div>
  );
}
