import { useMemo } from 'react';
import type { Doctor } from '@/types';
import { formatDoctorName } from '@/components/ausuivant/utils';

interface DoctorChipsProps {
  doctors: Doctor[];
  waitingByDoctor: Map<string, number>;
  onDoctorClick?: (doctorId: string) => void;
}

/**
 * Horizontal scrollable row of compact doctor pills.
 * Each pill: avatar + "Dr. LastName" + waiting count badge.
 * Replaces the expandable DoctorsPanelSection for multi-doctor clinics.
 */
export default function DoctorChips({
  doctors,
  waitingByDoctor,
  onDoctorClick,
}: DoctorChipsProps) {
  const visibleDoctors = useMemo(
    () => doctors.filter((d) => d.isActive && d.state !== 'inactive'),
    [doctors],
  );

  if (visibleDoctors.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        overflowX: 'auto',
        background: 'var(--color-surface, #fff)',
        borderBottom: '1px solid var(--color-border-subtle, #E8E6DF)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="as-hide-scrollbar"
    >
      {visibleDoctors.map((doctor, idx) => {
        const waiting = waitingByDoctor.get(doctor.id) || 0;
        const initial = doctor.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase();
        // Alternate between two greens for doctor avatars
        const avatarBg = idx % 2 === 0 ? '#1a3c34' : '#2a9d6e';

        return (
          <button
            key={doctor.id}
            onClick={() => onDoctorClick?.(doctor.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: '1px solid #E8E6DF',
              borderRadius: 100,
              padding: '4px 10px 4px 4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: onDoctorClick ? 'pointer' : 'default',
              fontFamily: 'inherit',
              transition: 'border-color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (onDoctorClick) {
                e.currentTarget.style.borderColor = '#2a9d6e';
                e.currentTarget.style.background = '#e8f5ee';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E8E6DF';
              e.currentTarget.style.background = '#fff';
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: avatarBg,
                color: 'white',
                fontSize: 9.6,
                fontWeight: 700,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            {/* Doctor name only */}
            <span
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: '#1a1a2e',
                lineHeight: 1.2,
              }}
            >
              {formatDoctorName(doctor.name)}
            </span>
            {/* Count badge */}
            <span
              style={{
                fontSize: 10.4,
                fontWeight: 700,
                color: '#1a3c34',
                background: '#e8f5ee',
                padding: '1px 6px',
                borderRadius: 100,
                marginLeft: 2,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                flexShrink: 0,
              }}
            >
              {waiting} att.
            </span>
          </button>
        );
      })}
    </div>
  );
}
