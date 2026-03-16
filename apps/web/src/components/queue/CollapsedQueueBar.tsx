import { useTranslation } from 'react-i18next';

interface CollapsedQueueBarProps {
  patientCount: number;
  variant?: 'mobile' | 'desktop';
}

export default function CollapsedQueueBar({ patientCount, variant = 'mobile' }: CollapsedQueueBarProps) {
  const { t } = useTranslation();
  const isDesktop = variant === 'desktop';

  const countText = patientCount === 0
    ? t('dashboard.morningState.patientCount_zero', '0 patient')
    : patientCount === 1
      ? t('dashboard.morningState.patientCount_one', { count: patientCount, defaultValue: '{{count}} patient' })
      : t('dashboard.morningState.patientCount_other', { count: patientCount, defaultValue: '{{count}} patients' });

  return (
    <div
      role="button"
      aria-label={t('dashboard.queue.expandQueue', "Développer la file d'attente")}
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        border: '1px solid #E8E6DF',
        borderRadius: 12,
        padding: isDesktop ? '13px 18px' : '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#9E9B90'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E8E6DF'; }}
    >
      {/* Left group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 10 : 8 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: '#9E9B90' }}
        >
          format_list_bulleted
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#6B6960' }}>
          {t('queue.title', "File d'Attente")}
        </span>
        <span
          style={{
            background: '#F0EFEA',
            borderRadius: 20,
            padding: isDesktop ? '3px 12px' : '2px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#9E9B90',
          }}
        >
          {countText}
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isDesktop && (
          <span style={{ fontSize: 11, color: '#9E9B90', fontStyle: 'italic' }}>
            {t('dashboard.morningState.queueHint', "Apparaîtra ici dès qu'un patient est ajouté")}
          </span>
        )}
        <span
          className="material-symbols-outlined rtl:rotate-180"
          style={{ fontSize: 16, color: '#9E9B90' }}
        >
          chevron_right
        </span>
      </div>
    </div>
  );
}
