import type { ScheduleSlot } from '@/types';
import { getDoctorColor } from './ASPatientRow';
import { formatDoctorName } from './utils';
import type { Doctor } from '@/types';

interface ASScheduleSlotProps {
  slot: ScheduleSlot;
  doctors: Doctor[];
  onAssign?: (slotId: string) => void;
  onPatientClick?: (entryId: string) => void;
}

function getSlotStatus(slot: ScheduleSlot): {
  label: string;
  color: string;
  bg: string;
} {
  if (slot.queueEntry) {
    const s = slot.queueEntry.status;
    if (s === 'IN_CONSULTATION') return { label: 'En cours', color: 'white', bg: 'var(--color-primary)' };
    if (s === 'COMPLETED') return { label: 'Termin\u00e9', color: 'var(--slot-completed)', bg: 'var(--color-surface-alt)' };
    if (s === 'NO_SHOW') return { label: 'Absent', color: 'var(--slot-noshow)', bg: 'var(--color-error-bg)' };
    if (s === 'NOTIFIED' || s === 'WAITING') return { label: 'Arriv\u00e9', color: 'var(--slot-arrived)', bg: 'var(--color-primary-light)' };
  }

  if (slot.slotType === 'regulation' && !slot.queueEntry && !slot.patientName) {
    return { label: 'Libre', color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)' };
  }

  // Named slot, patient not yet arrived
  return { label: 'Attendu', color: 'var(--slot-expected)', bg: 'var(--color-surface-alt)' };
}

function formatSlotTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function ASScheduleSlot({
  slot,
  doctors,
  onAssign,
  onPatientClick,
}: ASScheduleSlotProps) {
  const status = getSlotStatus(slot);
  const doctorColor = getDoctorColor(slot.doctorId, doctors);
  const isRegulationEmpty = slot.slotType === 'regulation' && !slot.queueEntry && !slot.patientName;
  const patientName = slot.queueEntry?.patientName || slot.patientName;
  const timeDisplay = formatSlotTime(slot.startTime);

  return (
    <div
      className="as-fade-up-card flex items-stretch gap-2 relative"
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border-subtle)',
        minHeight: 48,
        cursor: slot.queueEntry ? 'pointer' : undefined,
        background: isRegulationEmpty ? 'var(--color-surface-alt)' : 'var(--color-surface)',
      }}
      onClick={() => {
        if (slot.queueEntry && onPatientClick) {
          onPatientClick(slot.queueEntry.id);
        }
      }}
    >
      {/* Doctor-colored left border */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 2,
          background: doctorColor.fg,
        }}
      />

      {/* Time */}
      <div
        className="flex flex-col items-center justify-center flex-shrink-0"
        style={{ width: 38 }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-text-primary)',
          }}
        >
          {timeDisplay}
        </span>
        {slot.slotType === 'regulation' && (
          <span
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            régul.
          </span>
        )}
      </div>

      {/* Slot info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isRegulationEmpty ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            fontStyle: isRegulationEmpty ? 'italic' : 'normal',
          }}
        >
          {isRegulationEmpty ? 'Cr\u00e9neau libre' : patientName || 'Patient'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {formatDoctorName(slot.doctor.name)}
        </span>
      </div>

      {/* Status badge or Assign button */}
      <div className="flex items-center flex-shrink-0">
        {isRegulationEmpty && onAssign ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(slot.id);
            }}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              border: '1.5px solid var(--color-primary)',
              background: 'white',
              color: 'var(--color-primary)',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Affecter
          </button>
        ) : (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              background: status.bg,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
}
