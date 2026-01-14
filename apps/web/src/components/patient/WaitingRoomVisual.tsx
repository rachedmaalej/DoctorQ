import { useTranslation } from 'react-i18next';

interface WaitingRoomVisualProps {
  waitingCount?: number;
  maxVisible?: number;
  showYourSpot?: boolean;
  colorScheme?: 'light' | 'inverted';
}

/**
 * MD3-compliant visual representation of a virtual waiting room with chairs.
 * Shows occupied chairs (people waiting) and an empty highlighted spot for "your place".
 *
 * Uses Material Symbols icons only (no emojis).
 * Follows MD3 shape, elevation, and color guidelines.
 */
export default function WaitingRoomVisual({
  waitingCount = 3,
  maxVisible = 5,
  showYourSpot = true,
  colorScheme = 'light',
}: WaitingRoomVisualProps) {
  const { t } = useTranslation();

  // Limit visible chairs to maxVisible
  const visibleWaiting = Math.min(waitingCount, maxVisible - (showYourSpot ? 1 : 0));
  const hasOverflow = waitingCount > visibleWaiting;

  // MD3-compliant color schemes using surface/on-surface patterns
  const colors = colorScheme === 'inverted'
    ? {
        // Inverted scheme for dark backgrounds (e.g., primary container header)
        chair: 'text-white/60',
        chairOccupied: 'text-white',
        yourSpotBg: 'bg-white/20',
        yourSpotIcon: 'text-white',
        yourSpotRing: 'ring-white/40',
        text: 'text-white/70',
        textHighlight: 'text-white',
        overflowText: 'text-white/60',
      }
    : {
        // Light scheme for light backgrounds
        chair: 'text-gray-300',
        chairOccupied: 'text-primary-600',
        yourSpotBg: 'bg-primary-100',
        yourSpotIcon: 'text-primary-600',
        yourSpotRing: 'ring-primary-300',
        text: 'text-gray-500',
        textHighlight: 'text-primary-600',
        overflowText: 'text-gray-400',
      };

  return (
    <div className="py-4">
      {/* Visual: Row of chairs using MD3 shape tokens (medium = 12px border radius) */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
        {/* Occupied chairs (people waiting) - using event_seat icon */}
        {Array.from({ length: visibleWaiting }).map((_, index) => (
          <div
            key={`occupied-${index}`}
            className="flex flex-col items-center"
            title={t('checkin.occupiedSeat')}
          >
            <span
              className={`material-symbols-outlined text-2xl sm:text-3xl ${colors.chairOccupied}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              event_seat
            </span>
          </div>
        ))}

        {/* Overflow indicator - MD3 label style */}
        {hasOverflow && (
          <div className={`flex items-center justify-center w-8 h-8 ${colors.overflowText} text-xs font-medium`}>
            +{waitingCount - visibleWaiting}
          </div>
        )}

        {/* Your spot - highlighted empty position with MD3-compliant styling */}
        {showYourSpot && (
          <div
            className="flex flex-col items-center relative"
            title={t('checkin.yourSpot')}
          >
            {/* Pulsing ring effect - MD3 motion timing (medium2 = 300ms) */}
            <div
              className={`absolute inset-0 rounded-xl ${colors.yourSpotRing} ring-2 animate-ping opacity-20`}
              style={{ animationDuration: '1.5s' }}
            />

            {/* Chair container with MD3 shape (medium = 12px radius) */}
            <div
              className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.yourSpotBg} ring-2 ${colors.yourSpotRing}`}
            >
              <span
                className={`material-symbols-outlined text-2xl sm:text-3xl ${colors.yourSpotIcon}`}
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                add
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend text - MD3 label typography */}
      <div className="flex items-center justify-center gap-4 text-xs sm:text-sm">
        {visibleWaiting > 0 && (
          <div className={`flex items-center gap-1.5 ${colors.text}`}>
            <span
              className={`material-symbols-outlined text-base ${colors.chairOccupied}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              event_seat
            </span>
            <span>{t('checkin.patientsWaiting', { count: waitingCount })}</span>
          </div>
        )}
        {showYourSpot && (
          <div className={`flex items-center gap-1.5 ${colors.textHighlight} font-medium`}>
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
            >
              arrow_forward
            </span>
            <span>{t('checkin.yourSpotLabel')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
