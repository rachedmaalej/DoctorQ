import type { QueueEntry } from '@/types';
import { getWaitDotColor, formatWaitTime } from './utils';

interface BSQueueListProps {
  queue: QueueEntry[];
  isDoctorPresent: boolean;
  onRemovePatient: (id: string) => void;
}

export default function BSQueueList({
  queue,
  isDoctorPresent,
  onRemovePatient,
}: BSQueueListProps) {
  if (queue.length === 0) return null;

  return (
    <>
      <div className="bs-section-header bs-animate-in bs-delay-4">
        <span className="bs-section-title">File d'attente</span>
      </div>
      <div className="bs-queue-list">
        {queue.map((entry, index) => {
          const displayPosition = isDoctorPresent ? entry.position - 1 : entry.position;
          const dotColor = getWaitDotColor(entry.arrivedAt);
          const waitText = formatWaitTime(entry.arrivedAt);
          const hasPhone = !!entry.patientPhone;
          const delayClass = index < 4 ? `bs-delay-${4 + Math.floor(index / 2)}` : 'bs-delay-7';

          return (
            <div
              key={entry.id}
              className={`bs-queue-item bs-animate-in ${delayClass}`}
            >
              {/* Position circle */}
              <div className="bs-qi-position">{displayPosition}</div>

              {/* Patient info */}
              <div className="bs-qi-info">
                <div className="bs-qi-name">
                  {entry.patientName || 'Patient'}
                </div>
                <div className="bs-qi-detail">
                  <span className={`bs-wait-dot ${dotColor}`} />
                  <span>{waitText}</span>
                  {hasPhone && <span>📱</span>}
                </div>
              </div>

              {/* Badge */}
              {!hasPhone && (
                <span className="bs-qi-badge no-phone">Sans tél.</span>
              )}

              {/* Action buttons */}
              <div className="bs-qi-actions">
                {hasPhone ? (
                  <a
                    href={`tel:${entry.patientPhone}`}
                    className="bs-qi-icon-btn phone-btn"
                    aria-label="Appeler"
                  >
                    <span className="material-symbols-rounded">phone</span>
                  </a>
                ) : (
                  <button
                    className="bs-qi-icon-btn disabled"
                    disabled
                    aria-label="Pas de téléphone"
                  >
                    <span className="material-symbols-rounded">phone</span>
                  </button>
                )}
                <button
                  className="bs-qi-icon-btn"
                  onClick={() => onRemovePatient(entry.id)}
                  aria-label="Plus d'actions"
                >
                  <span className="material-symbols-rounded">more_vert</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
