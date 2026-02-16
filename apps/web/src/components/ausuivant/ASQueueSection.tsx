import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { QueueEntry, QueueStatus } from '@/types';
import ASQueueCard from './ASQueueCard';

interface ASQueueSectionProps {
  queue: QueueEntry[];
  isDoctorPresent: boolean;
  onPriority: (id: string) => void;
  onRemove: (id: string) => void;
  avgConsultationMins: number;
}

export default function ASQueueSection({
  queue,
  isDoctorPresent,
  onPriority,
  onRemove,
  avgConsultationMins,
}: ASQueueSectionProps) {
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [rgpdMode, setRgpdMode] = useState(true);

  // Filter to only WAITING and NOTIFIED entries
  const waitingEntries = queue.filter(
    (e) => e.status === ('WAITING' as QueueStatus) || e.status === ('NOTIFIED' as QueueStatus)
  );

  // Calculate display positions: if doctor present and someone in consultation, shift positions
  const inConsultation = queue.find((e) => e.status === ('IN_CONSULTATION' as QueueStatus));
  const getDisplayPosition = (entry: QueueEntry): number => {
    if (isDoctorPresent && inConsultation) {
      return entry.position - 1;
    }
    return entry.position;
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.as-queue-card-list')) {
        setSwipedCardId(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSwipeOpen = useCallback((id: string | null) => {
    setSwipedCardId(id);
    if (id) setShowSwipeHint(false);
  }, []);

  return (
    <div>
      {/* Section Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '20px 20px 10px' }}
      >
        <span
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'var(--text-tertiary)',
            fontWeight: 600,
          }}
        >
          File d&apos;attente
        </span>

        {/* RGPD toggle */}
        <button
          onClick={() => setRgpdMode(!rgpdMode)}
          className="flex items-center gap-1 transition-colors"
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Basculer l'affichage RGPD"
        >
          {rgpdMode ? <Eye size={13} /> : <EyeOff size={13} />}
          <span style={{ fontSize: 11 }}>RGPD</span>
        </button>
      </div>

      {/* Queue Cards */}
      <div
        className="as-queue-card-list flex flex-col gap-1.5"
        style={{ padding: '0 20px 100px' }}
      >
        {waitingEntries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span style={{ fontSize: 14 }}>Aucun patient en attente</span>
          </div>
        ) : (
          waitingEntries.map((entry, index) => {
            const displayPos = getDisplayPosition(entry);
            const estimatedWait =
              displayPos > 1 && avgConsultationMins > 0
                ? (displayPos - 1) * avgConsultationMins
                : null;

            return (
              <ASQueueCard
                key={entry.id}
                entry={entry}
                position={displayPos}
                isFirst={index === 0}
                showSwipeHint={showSwipeHint && index === 0}
                isSwipedOpen={swipedCardId === entry.id}
                onSwipeOpen={handleSwipeOpen}
                onPriority={onPriority}
                onRemove={onRemove}
                estimatedWaitMinutes={estimatedWait}
                animationDelay={0.15 + index * 0.05}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
