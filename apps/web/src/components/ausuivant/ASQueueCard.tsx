import { useRef, useState, useCallback } from 'react';
import { Star, X as XIcon, ArrowLeft } from 'lucide-react';
import type { QueueEntry, QueueStatus } from '@/types';
import { formatDisplayName, formatArrivalTime } from './utils';

interface ASQueueCardProps {
  entry: QueueEntry;
  position: number;
  isFirst: boolean;
  showSwipeHint: boolean;
  isSwipedOpen: boolean;
  onSwipeOpen: (id: string | null) => void;
  onPriority: (id: string) => void;
  onRemove: (id: string) => void;
  estimatedWaitMinutes: number | null;
  animationDelay?: number;
}

const SWIPE_THRESHOLD = 70;
const SWIPE_MAX = 140;

export default function ASQueueCard({
  entry,
  position,
  isFirst,
  showSwipeHint,
  isSwipedOpen,
  onSwipeOpen,
  onPriority,
  onRemove,
  estimatedWaitMinutes,
  animationDelay = 0,
}: ASQueueCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const currentTranslate = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const isNotified = entry.status === ('NOTIFIED' as QueueStatus);
  const hasAppointment = entry.appointmentTime != null;
  const displayName = formatDisplayName(entry.patientName);
  const arrivalTime = entry.arrivedAt ? formatArrivalTime(entry.arrivedAt) : '';

  // Determine gender for NOTIFIÉ/NOTIFIÉE
  const notifiedLabel = 'NOTIFIÉ';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    currentTranslate.current = isSwipedOpen ? -SWIPE_MAX : 0;
    setIsDragging(true);
    if (innerRef.current) {
      innerRef.current.style.transition = 'none';
    }
  }, [isSwipedOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = touchStartX.current - e.touches[0].clientX;
    if (deltaX < -10 && !isSwipedOpen) return; // don't allow right swipe when closed

    // Calculate: when closed, swiping left increases delta positively
    const rawTranslate = isSwipedOpen
      ? Math.max(-SWIPE_MAX, Math.min(0, -SWIPE_MAX + (e.touches[0].clientX - touchStartX.current)))
      : Math.max(-SWIPE_MAX, Math.min(0, -(touchStartX.current - e.touches[0].clientX)));

    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(${rawTranslate}px)`;
    }
    currentTranslate.current = rawTranslate;
  }, [isDragging, isSwipedOpen]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (!innerRef.current) return;

    innerRef.current.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';

    if (currentTranslate.current < -SWIPE_THRESHOLD) {
      innerRef.current.style.transform = `translateX(-${SWIPE_MAX}px)`;
      onSwipeOpen(entry.id);
    } else {
      innerRef.current.style.transform = 'translateX(0)';
      if (isSwipedOpen) onSwipeOpen(null);
    }
  }, [entry.id, isSwipedOpen, onSwipeOpen]);

  // Snap when isSwipedOpen changes externally (another card opened)
  const snapTransform = isSwipedOpen ? `translateX(-${SWIPE_MAX}px)` : 'translateX(0)';

  return (
    <div
      className="as-fade-up-card relative overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: `${animationDelay}s`,
      }}
    >
      {/* Hidden action buttons (behind inner) */}
      <div className="absolute top-0 right-0 bottom-0 flex" style={{ zIndex: 1 }}>
        <button
          onClick={() => onPriority(entry.id)}
          className="flex flex-col items-center justify-center gap-1"
          style={{
            width: 70,
            background: 'var(--warning)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <Star size={20} />
          Priorité
        </button>
        <button
          onClick={() => onRemove(entry.id)}
          className="flex flex-col items-center justify-center gap-1"
          style={{
            width: 70,
            background: 'var(--danger)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <XIcon size={20} />
          Retirer
        </button>
      </div>

      {/* Card inner (swipeable) */}
      <div
        ref={innerRef}
        className="relative flex items-center gap-3.5"
        style={{
          padding: '14px 16px',
          background: 'var(--surface)',
          zIndex: 2,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: isDragging ? undefined : snapTransform,
          cursor: 'grab',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Position badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: isNotified ? 'var(--warning-light)' : 'var(--surface-alt)',
            color: isNotified ? 'var(--warning)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 14,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {position}
        </div>

        {/* Details column */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
            <span
              className="truncate"
              style={{
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: '-0.2px',
              }}
            >
              {displayName}
            </span>

            {/* Tags */}
            {hasAppointment ? (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                RDV
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                }}
              >
                SANS RDV
              </span>
            )}

            {isNotified && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  flexShrink: 0,
                }}
              >
                {notifiedLabel}
              </span>
            )}
          </div>

          {/* Meta row */}
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Arrivée {arrivalTime}
          </span>
        </div>

        {/* Estimate column */}
        <div className="flex-shrink-0 text-right">
          {position === 1 ? (
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Prochaine
            </span>
          ) : (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-primary)',
                }}
              >
                {estimatedWaitMinutes != null ? `~${estimatedWaitMinutes} min` : '—'}
              </div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-tertiary)',
                }}
              >
                Attente est.
              </div>
            </>
          )}
        </div>

        {/* Swipe hint (first card only) */}
        {isFirst && showSwipeHint && !isSwipedOpen && (
          <div
            className="as-swipe-hint absolute flex items-center gap-1"
            style={{
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <ArrowLeft size={14} className="as-swipe-hint-arrow" style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>glisser</span>
          </div>
        )}
      </div>
    </div>
  );
}
