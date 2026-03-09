import ASIcon from './ASIcon';
import { useState } from 'react';

import type { ScheduleSlot, Doctor } from '@/types';
import { getDoctorColor } from './ASPatientRow';
import { formatDoctorName } from './utils';

interface ASNoShowBannerProps {
  noShowCandidates: ScheduleSlot[];
  doctors: Doctor[];
  onMarkNoShow: (slotIds: string[]) => void;
  onDismiss: (slotId: string) => void;
}

function DoctorRow({
  doctorId,
  slots,
  doctors,
  onMarkNoShow,
  onDismiss,
}: {
  doctorId: string;
  slots: ScheduleSlot[];
  doctors: Doctor[];
  onMarkNoShow: (slotIds: string[]) => void;
  onDismiss: (slotId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const doctor = doctors.find((d) => d.id === doctorId);
  const color = getDoctorColor(doctorId, doctors);

  const formatTime = (s: ScheduleSlot) => {
    const time = new Date(s.startTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${s.patientName || 'Patient'} (${time})`;
  };

  const summary =
    slots.length === 1
      ? formatTime(slots[0])
      : `${formatTime(slots[0])}, +${slots.length - 1}`;

  return (
    <div style={{ marginBottom: expanded ? 6 : 2 }}>
      <div className="flex items-center gap-1.5" style={{ minHeight: 26 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: color.fg,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          {formatDoctorName(doctor?.name)}:
        </span>
        <span
          className="truncate"
          style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1, minWidth: 0 }}
        >
          {summary}
        </span>

        {slots.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: 'var(--color-warning)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {expanded ? <ASIcon name="expand_less" size={14} /> : <ASIcon name="expand_more" size={14} />}
          </button>
        )}

        <button
          onClick={() => onMarkNoShow(slots.map((s) => s.id))}
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 8,
            border: '1.5px solid var(--color-warning)',
            background: 'white',
            color: 'var(--color-warning)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {slots.length === 1 ? 'Absent' : `Tous absents (${slots.length})`}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 3, paddingLeft: 14 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginRight: 4 }}>
            Arrivé ?
          </span>
          {slots.map((s) => (
            <button
              key={s.id}
              onClick={() => onDismiss(s.id)}
              title={`${s.patientName || 'Patient'} est arrivé — retirer de la liste`}
              className="inline-flex items-center gap-0.5"
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(212,146,58,0.15)',
                color: 'var(--color-warning)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginRight: 3,
                marginBottom: 2,
              }}
            >
              <ASIcon name="close" size={10} />
              {s.patientName || 'Patient'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ASNoShowBanner({
  noShowCandidates,
  doctors,
  onMarkNoShow,
  onDismiss,
}: ASNoShowBannerProps) {
  if (noShowCandidates.length === 0) return null;

  // Group by doctor
  const byDoctor = new Map<string, ScheduleSlot[]>();
  for (const slot of noShowCandidates) {
    const existing = byDoctor.get(slot.doctorId) || [];
    existing.push(slot);
    byDoctor.set(slot.doctorId, existing);
  }

  return (
    <div style={{ padding: '0 18px', marginBottom: 8 }}>
      <div
        className="as-fade-up"
        style={{
          background: 'var(--color-warning-bg)',
          border: '1px solid rgba(212,146,58,0.2)',
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <ASIcon name="warning" size={13} style={{ color: 'var(--color-warning)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--color-warning)',
            }}
          >
            Patients en retard
          </span>
        </div>

        {Array.from(byDoctor.entries()).map(([doctorId, slots]) => (
          <DoctorRow
            key={doctorId}
            doctorId={doctorId}
            slots={slots}
            doctors={doctors}
            onMarkNoShow={onMarkNoShow}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
