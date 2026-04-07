import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';
import ASPatientRow from './ASPatientRow';
import ConsultationTimerSection from '@/components/queue/ConsultationTimerSection';

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
  const waiting = patients.filter(p => p.status !== QueueStatus.IN_CONSULTATION);

  // Show consultation section when not hidden and there are active/free doctors
  const showConsultSection = !hideConsultation &&
    doctors.some(d => d.isActive && (d.state === 'consulting' || d.state === 'free'));

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
      {/* ═══ EN CONSULTATION section — duration-first timer rows ═══ */}
      {showConsultSection && (
        <ConsultationTimerSection
          patients={patients}
          doctors={doctors}
          doctorCount={doctors.length}
          avgConsultMinutes={avgConsultationMins}
          onFinishConsultation={(id) => onComplete?.(id)}
        />
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
