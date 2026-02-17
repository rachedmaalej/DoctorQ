import type { QueueScreenStatus } from './types';
import StatusPill from './StatusPill';
import StatsStrip from './StatsStrip';

interface HeaderProps {
  clinicName: string;
  status: QueueScreenStatus;
  isAllDone?: boolean;
  onStatusPillClick?: () => void;
  isDoctorPresent?: boolean;
  // Stats strip (only on OPEN/CLOSING)
  showStats?: boolean;
  chip1Value?: number;
  chip2Value?: number;
  chip3Value?: string;
  className?: string;
}

export default function Header({
  clinicName,
  status,
  isAllDone,
  onStatusPillClick,
  isDoctorPresent,
  showStats,
  chip1Value = 0,
  chip2Value = 0,
  chip3Value = '',
  className,
}: HeaderProps) {
  const showPresence = status === 'OPEN' || status === 'CLOSING';

  return (
    <div className={`flex flex-col gap-3 px-5 pt-2 pb-3.5 ${className ?? ''}`}>
      {/* Top row */}
      <div className="flex justify-between items-center">
        <span
          className="text-bs-text-primary font-bold truncate mr-2"
          style={{ fontSize: 17, letterSpacing: '-0.02em' }}
        >
          {clinicName}
        </span>
        <div className="flex gap-2 items-center shrink-0">
          <button
            className="rounded-full font-semibold"
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              backgroundColor: '#FFFFFF',
              color: '#6B6960',
              border: '1px solid #E8E6DF',
            }}
          >
            عربي
          </button>
          <StatusPill
            status={status}
            isAllDone={isAllDone}
            onClick={onStatusPillClick}
          />
        </div>
      </div>

      {/* Doctor presence indicator — only when queue is active */}
      {showPresence && isDoctorPresent !== undefined && (
        <div
          className="flex items-center gap-2 rounded-full self-start cursor-pointer"
          onClick={onStatusPillClick}
          style={{
            padding: '5px 12px 5px 8px',
            backgroundColor: isDoctorPresent ? '#EDF7F0' : '#FDF0ED',
            border: isDoctorPresent
              ? '1px solid rgba(45,139,78,0.15)'
              : '1px solid rgba(217,79,59,0.15)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isDoctorPresent ? '#2D8B4E' : '#D94F3B' }}
          />
          <span
            className="font-semibold"
            style={{
              fontSize: 12,
              color: isDoctorPresent ? '#2D8B4E' : '#D94F3B',
            }}
          >
            {isDoctorPresent ? 'Présent' : 'Absent'}
          </span>
        </div>
      )}

      {/* Stats strip */}
      {showStats && (
        <StatsStrip
          status={status}
          chip1Value={chip1Value}
          chip2Value={chip2Value}
          chip3Value={chip3Value}
        />
      )}
    </div>
  );
}
