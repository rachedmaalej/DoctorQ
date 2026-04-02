import ASIcon from './ASIcon';

import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';
import ASPatientRow, { getDoctorColor, getDoctorInitial } from './ASPatientRow';
import { formatDisplayName, formatArrivalTime, getConsultationDuration, formatDoctorName } from './utils';

interface ASWaitingRoomProps {
  patients: QueueEntry[];
  doctors: Doctor[];
  avgConsultationMins: number;
  onMarkUrgent?: (id: string) => void;
  onRemove?: (id: string) => void;
  onCallIn?: (id: string) => void;
  onMarkNoShow?: (id: string) => void;
  onTransfer?: (id: string) => void;
  onComplete?: (id: string) => void;
  completedCount?: number;
  hasDoctors?: boolean;
  /** Hide the consultation section (when solo mode renders its own card) */
  hideConsultation?: boolean;
  /** Slot rendered between En Consultation and File d'attente */
  addPatientSlot?: React.ReactNode;
}

export default function ASWaitingRoom({
  patients,
  doctors,
  avgConsultationMins,
  onMarkUrgent,
  onRemove,
  onCallIn,
  onMarkNoShow,
  onTransfer,
  onComplete,
  completedCount = 0,
  hasDoctors = true,
  hideConsultation = false,
  addPatientSlot,
}: ASWaitingRoomProps) {
  const inConsultation = patients.filter(p => p.status === QueueStatus.IN_CONSULTATION);
  const waiting = patients.filter(p => p.status !== QueueStatus.IN_CONSULTATION);
  const hasMultiDoctor = doctors.length > 1;

  // Build doctor "slots" for the consultation section:
  // - Consulting doctors show their active patient card
  // - Free doctors show a greyed-out "Libre" placeholder card
  const consultByDoctor = new Map(inConsultation.map(e => [e.doctorId, e]));
  const slotDoctors = doctors
    .filter(d => d.isActive && (d.state === 'consulting' || d.state === 'free'))
    .sort((a, b) => a.id.localeCompare(b.id));
  const showConsultSection = !hideConsultation && slotDoctors.length > 0;
  const activeConsultCount = inConsultation.length;

  if (patients.length === 0 && !showConsultSection) {
    if (!hasDoctors) {
      return (
        <EmptyState
          icon="&#9881;"
          title="Aucun m&#233;decin configur&#233;"
          subtitle="Configurez vos m&#233;decins dans les param&#232;tres"
        />
      );
    }
    if (completedCount > 0) {
      return (
        <EmptyState
          icon="&#10004;"
          title="Tous les patients ont &#233;t&#233; vus !"
          subtitle="Bonne journ&#233;e."
        />
      );
    }
    return (
      <EmptyState
        icon="&#128522;"
        title="Aucun patient en attente"
        subtitle="Ajoutez un patient pour commencer"
      />
    );
  }

  // When no patients but free doctors exist, show just the consultation section with greyed-out slots
  if (patients.length === 0 && showConsultSection) {
    // Fall through to main render — the waiting section won't show, only the free doctor slots
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* ═══ EN CONSULTATION section — warm amber container ═══ */}
      {showConsultSection && (
        <div className="as-section-consultation">
          {/* Section header */}
          <div className="as-section-header">
            {activeConsultCount > 0 ? (
              <span className="as-pulse-consultation" style={{
                width: 8, height: 8, borderRadius: 4,
                background: 'var(--section-consult-accent)', display: 'inline-block',
              }} />
            ) : (
              <span style={{
                width: 8, height: 8, borderRadius: 4,
                background: 'var(--color-border)', display: 'inline-block',
              }} />
            )}
            <span className="as-section-header-label" style={{
              color: activeConsultCount > 0 ? 'var(--section-consult-text)' : 'var(--color-text-muted)',
            }}>
              En consultation
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: activeConsultCount > 0 ? 'var(--section-consult-muted)' : 'var(--color-text-muted)',
              marginLeft: 'auto',
            }}>
              {activeConsultCount}
            </span>
          </div>

          {/* Doctor slots — active cards when consulting, greyed-out when free */}
          {slotDoctors.map((doctor) => {
            const entry = consultByDoctor.get(doctor.id);
            const isConsulting = !!entry;
            const color = getDoctorColor(doctor.id, doctors);
            const initial = getDoctorInitial(doctor.id, doctors);

            if (isConsulting) {
              // ── Active consultation card ──
              const displayName = formatDisplayName(entry.patientName);
              const consultMins = getConsultationDuration(entry.calledAt);
              const hasAppointment = entry.appointmentTime != null;
              const appointmentDisplay = hasAppointment
                ? formatArrivalTime(entry.appointmentTime!)
                : null;

              return (
                <div
                  key={doctor.id}
                  className="as-fade-up-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 6,
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${color.fg}30`,
                    overflow: 'hidden',
                    background: 'var(--color-surface)',
                  }}
                >
                  {/* Left color band */}
                  <div style={{ width: 3, alignSelf: 'stretch', background: color.fg, flexShrink: 0 }} />

                  {/* Doctor initial badge */}
                  {hasMultiDoctor && (
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 28, height: 28, borderRadius: 8, marginLeft: 10,
                        background: color.fg, color: 'white',
                        fontWeight: 700, fontSize: 12,
                      }}
                    >
                      {initial}
                    </div>
                  )}

                  {/* Patient info — two compact lines */}
                  <div style={{ flex: 1, padding: '8px 10px', minWidth: 0 }}>
                    <div className="flex items-center gap-1.5" style={{ marginBottom: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {displayName}
                      </span>
                      {hasAppointment ? (
                        <span style={{
                          fontSize: 8, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                          fontWeight: 600, background: color.bg, color: color.fg,
                        }}>
                          {appointmentDisplay}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 8, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                          fontWeight: 600, background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)',
                        }}>
                          SANS RDV
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="as-pulse-consultation" style={{
                        width: 5, height: 5, borderRadius: 3,
                        background: 'var(--section-consult-accent)', display: 'inline-block',
                      }} />
                      <span style={{ fontSize: 10, color: 'var(--section-consult-text)', fontWeight: 500 }}>
                        {hasMultiDoctor ? formatDoctorName(doctor.name) : 'En consultation'}
                        {' · '}{consultMins} min
                      </span>
                    </div>
                  </div>

                  {/* Terminer button — warm accent */}
                  {onComplete && (
                    <button
                      onClick={() => onComplete(entry.id)}
                      className="flex items-center gap-1"
                      style={{
                        padding: '6px 12px', marginRight: 10,
                        borderRadius: 'var(--radius-sm)', border: 'none',
                        background: 'var(--color-accent)', color: 'var(--color-text-on-accent)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      <ASIcon name="check_circle" size={13} />
                      Terminer
                    </button>
                  )}
                </div>
              );
            }

            // ── Free doctor — greyed-out placeholder card ──
            return (
              <div
                key={doctor.id}
                className="as-fade-up-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 6,
                  borderRadius: 'var(--radius)',
                  border: '1.5px dashed var(--color-border)',
                  overflow: 'hidden',
                  background: 'var(--color-surface-alt)',
                  opacity: 0.7,
                }}
              >
                {/* Left color band — muted */}
                <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0 }} />

                {/* Doctor initial badge — muted */}
                {hasMultiDoctor && (
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 28, height: 28, borderRadius: 8, marginLeft: 10,
                      background: 'var(--color-text-muted)', color: 'white',
                      fontWeight: 700, fontSize: 12,
                    }}
                  >
                    {initial}
                  </div>
                )}

                {/* Doctor name + "Libre" status */}
                <div style={{ flex: 1, padding: '10px 10px', minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {formatDoctorName(doctor.name)}
                    </span>
                    <span style={{
                      fontSize: 8, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                      fontWeight: 700, textTransform: 'uppercase',
                      background: 'var(--color-border-subtle)', color: 'var(--color-text-muted)',
                    }}>
                      Libre
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-add patient bar (between sections) */}
      {addPatientSlot}

      {/* ═══ FILE D'ATTENTE section — green container ═══ */}
      {waiting.length > 0 && (
        <div className="as-section-waiting">
          {/* Section header */}
          <div className="as-section-header">
            <span style={{
              width: 8, height: 8, borderRadius: 4,
              background: 'var(--section-waiting-accent)', display: 'inline-block',
            }} />
            <span className="as-section-header-label" style={{ color: 'var(--section-waiting-text)' }}>
              File d'attente
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--section-waiting-muted)',
              marginLeft: 'auto',
            }}>
              {waiting.length}
            </span>
          </div>

          {/* Waiting patient rows */}
          <div
            className="flex flex-col gap-2"
            role="list"
            aria-label={`File d'attente, ${waiting.length} patient${waiting.length > 1 ? 's' : ''}`}
            aria-live="polite"
          >
            {waiting.map((entry, index) => {
              const estimatedWaitMinutes = index * avgConsultationMins;

              return (
                <ASPatientRow
                  key={entry.id}
                  entry={entry}
                  doctors={doctors}
                  position={index + 1}
                  estimatedWaitMinutes={estimatedWaitMinutes}
                  onMarkUrgent={onMarkUrgent}
                  onRemove={onRemove}
                  onCallIn={onCallIn}
                  onMarkNoShow={onMarkNoShow}
                  onTransfer={onTransfer}
                  animationDelay={index * 0.04}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 as-fade-up"
      style={{
        padding: '48px 24px',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 32 }} dangerouslySetInnerHTML={{ __html: icon }} />
      <span style={{ fontSize: 14, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: title }} />
      <span style={{ fontSize: 12 }} dangerouslySetInnerHTML={{ __html: subtitle }} />
    </div>
  );
}
