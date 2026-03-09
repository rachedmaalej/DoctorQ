import type { ScheduleSlot, QueueEntry } from '@/types';
import type { Doctor } from '@/types';
import ASScheduleSlot from './ASScheduleSlot';
import { formatArrivalTime } from './utils';

interface ASScheduleTimelineProps {
  slots: ScheduleSlot[];
  walkIns: QueueEntry[];
  doctors: Doctor[];
  onAssignToSlot: (slotId: string) => void;
  onPatientClick: (entryId: string) => void;
}

export default function ASScheduleTimeline({
  slots,
  walkIns,
  doctors,
  onAssignToSlot,
  onPatientClick,
}: ASScheduleTimelineProps) {
  // Split slots into named and regulation
  const namedSlots = slots
    .filter((s) => s.slotType === 'named')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const regulationSlots = slots
    .filter((s) => s.slotType === 'regulation')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const hasNamed = namedSlots.length > 0;
  const hasRegulation = regulationSlots.length > 0;
  const hasWalkIns = walkIns.length > 0;
  const isEmpty = !hasNamed && !hasRegulation && !hasWalkIns;

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{
          padding: '48px 24px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 32 }}>&#128197;</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Aucun cr&eacute;neau aujourd&apos;hui</span>
        <span style={{ fontSize: 12 }}>
          Importez ou saisissez les rendez-vous du jour
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 18px', paddingBottom: 100 }}>
      {/* Named RDV section */}
      {hasNamed && (
        <div style={{ marginBottom: hasRegulation || hasWalkIns ? 4 : 0 }}>
          <SectionHeader label="RENDEZ-VOUS" count={namedSlots.length} />
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border-subtle)',
              overflow: 'hidden',
            }}
          >
            {namedSlots.map((slot) => (
              <ASScheduleSlot
                key={slot.id}
                slot={slot}
                doctors={doctors}
                onPatientClick={onPatientClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regulation slots section */}
      {hasRegulation && (
        <div style={{ marginBottom: hasWalkIns ? 4 : 0 }}>
          <SectionHeader label="CR&Eacute;NEAUX DE R&Eacute;GULATION" count={regulationSlots.length} />
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border-subtle)',
              overflow: 'hidden',
            }}
          >
            {regulationSlots.map((slot) => (
              <ASScheduleSlot
                key={slot.id}
                slot={slot}
                doctors={doctors}
                onAssign={onAssignToSlot}
                onPatientClick={onPatientClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Walk-ins (Sans RDV) section */}
      {hasWalkIns && (
        <div>
          <SectionHeader label="SANS RDV" count={walkIns.length} />
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border-subtle)',
              overflow: 'hidden',
            }}
          >
            {walkIns.map((entry) => (
              <div
                key={entry.id}
                className="as-fade-up-card flex items-center gap-2"
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  minHeight: 48,
                  cursor: 'pointer',
                }}
                onClick={() => onPatientClick(entry.id)}
              >
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
                    {formatArrivalTime(entry.arrivedAt)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {entry.patientName || 'Patient'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    Sans rendez-vous
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    background: entry.status === 'IN_CONSULTATION' ? 'var(--color-primary)' : 'var(--color-primary-light)',
                    color: entry.status === 'IN_CONSULTATION' ? 'white' : '#3A7A5E',
                  }}
                >
                  {entry.status === 'IN_CONSULTATION' ? 'En cours' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        padding: '12px 4px 6px',
      }}
    >
      <span
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-alt)',
          padding: '1px 6px',
          borderRadius: 6,
        }}
      >
        {count}
      </span>
    </div>
  );
}
