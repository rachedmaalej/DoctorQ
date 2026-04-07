import { useTranslation } from 'react-i18next';

interface DoctorPanelDetailProps {
  doctorId: string;
  seenCount: number;
  avgWaitMinutes: number | null;
  waitingCount: number;
  isOpen: boolean;
  onCallNext: (doctorId: string) => void;
}

const ALERT_THRESHOLD = 30;

export default function DoctorPanelDetail({
  doctorId,
  seenCount,
  avgWaitMinutes,
  waitingCount,
  isOpen,
  onCallNext,
}: DoctorPanelDetailProps) {
  const { t } = useTranslation();
  const isAlert = avgWaitMinutes != null && avgWaitMinutes > ALERT_THRESHOLD;
  const disabled = waitingCount === 0;

  return (
    <div
      style={{
        maxHeight: isOpen ? 80 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease, padding 0.2s ease',
        padding: isOpen ? '0 8px 8px' : '0 8px',
      }}
      aria-hidden={!isOpen}
    >
      <div
        style={{
          borderTop: '1px solid var(--color-border-subtle, #E8E6DF)',
          paddingTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Stat chips */}
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Seen count chip */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              color: 'var(--color-text-muted, #9E9B90)',
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border-subtle, #E8E6DF)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {seenCount} {t('queue.doctors.seen', 'vus')}
          </span>

          {/* Avg wait chip */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              color: isAlert ? '#D94F3B' : 'var(--color-text-muted, #9E9B90)',
              background: isAlert ? '#FDF0ED' : 'var(--color-surface, #fff)',
              border: `1px solid ${isAlert ? '#FCD5D0' : 'var(--color-border-subtle, #E8E6DF)'}`,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {avgWaitMinutes != null ? `${avgWaitMinutes}m` : '—'} {t('queue.doctors.avgWait', 'moy.')}
          </span>
        </div>

        {/* Suivant button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCallNext(doctorId);
          }}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label={t('queue.doctors.nextAria', `Appeler le prochain patient pour ce médecin`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1.5px solid var(--section-doctors-accent, #0F7B6C)',
            background: 'transparent',
            color: 'var(--section-doctors-accent, #0F7B6C)',
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: disabled ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            opacity: disabled ? 0.35 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
            transition: 'background 0.15s, color 0.15s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'var(--section-doctors-accent, #0F7B6C)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'scale(0.96)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--section-doctors-accent, #0F7B6C)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--section-doctors-accent, #0F7B6C)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {t('queue.doctors.next', 'Suivant')}
        </button>
      </div>
    </div>
  );
}
