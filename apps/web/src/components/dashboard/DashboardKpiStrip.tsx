import { useTranslation } from 'react-i18next';

interface DashboardKpiStripProps {
  waitingCount: number;
  seenCount: number;
  maxWait: number | null;
  mode: 'waiting' | 'remaining';
}

function formatMaxWait(mins: number | null): string {
  if (mins == null) return '—';
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
  }
  return `${mins} min`;
}

function getMaxWaitColor(mins: number | null): string {
  if (mins == null || mins < 20) return 'var(--text-primary, #1A1A1A)';
  if (mins < 40) return '#D97706';
  return '#DC2626';
}

export default function DashboardKpiStrip({
  waitingCount,
  seenCount,
  maxWait,
  mode,
}: DashboardKpiStripProps) {
  const { t } = useTranslation();

  return (
    <div
      role="region"
      aria-label={t('kpi.region_label')}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        margin: '0 20px 12px',
        borderRadius: 12,
        border: '1.5px solid var(--border, #E8E6DF)',
        background: 'var(--surface, #FFFFFF)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Left — primary metric */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderInlineEnd: '1.5px solid var(--border, #E8E6DF)',
          paddingInlineEnd: 16,
          marginInlineEnd: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--text-tertiary, #9E9B90)',
              textTransform: 'uppercase',
            }}
          >
            {mode === 'waiting' ? t('kpi.waiting_label') : t('kpi.remaining_label')}
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary, #1A1A1A)',
              fontFeatureSettings: "'tnum'",
              lineHeight: 1,
            }}
          >
            {waitingCount}
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--accent, #0F7B6C)',
              marginTop: 4,
            }}
          />
        </div>
      </div>

      {/* Right — secondary metrics */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 72,
        }}
      >
        {/* Seen count */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #1A1A1A)',
              fontFeatureSettings: "'tnum'",
              lineHeight: 1,
            }}
          >
            {seenCount}
          </div>
          <div
            style={{
              fontSize: 7,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary, #9E9B90)',
              textTransform: 'uppercase',
            }}
          >
            {t('kpi.seen_label')}
          </div>
        </div>

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'var(--border, #E8E6DF)',
          }}
        />

        {/* Max wait */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: getMaxWaitColor(maxWait),
              fontFeatureSettings: "'tnum'",
              lineHeight: 1,
            }}
          >
            {formatMaxWait(maxWait)}
          </div>
          <div
            style={{
              fontSize: 7,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary, #9E9B90)',
              textTransform: 'uppercase',
            }}
          >
            {t('kpi.max_wait_label')}
          </div>
        </div>
      </div>
    </div>
  );
}
