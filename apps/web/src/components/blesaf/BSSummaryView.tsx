import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import type { QueueStats } from '@/types';

interface BSSummaryViewProps {
  stats: QueueStats | null;
  onNewDay: () => void;
}

export default function BSSummaryView({ stats, onNewDay }: BSSummaryViewProps) {
  const { t, i18n } = useTranslation();
  const { clinic } = useAuthStore();

  const today = new Date();
  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-FR';
  const dateStr = today.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // Capitalize first letter
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const totalSeen = stats?.seen || 0;
  const avgWait = stats?.avgWait ? `${Math.round(stats.avgWait)} min` : '—';
  const avgConsult = stats?.lastConsultationMins ? `${stats.lastConsultationMins} min` : '—';

  return (
    <div>
      <div className="bs-summary-card">
        {/* Hero section */}
        <div className="bs-summary-hero">
          <div className="bs-summary-date">{formattedDate}</div>
          <div className="bs-summary-doc">
            {clinic?.doctorName || clinic?.name || t('blesaf.summary.defaultDoctor')}
          </div>
          <div className="bs-summary-sub">{clinic?.name}</div>
          <div className="bs-summary-big-number">
            <span className="number">{totalSeen}</span>
            <span className="unit">{t('blesaf.summary.patientsSeen')}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="bs-summary-stats">
          <div className="bs-summary-stat">
            <div className="ss-value">{avgWait}</div>
            <div className="ss-label">{t('queue.avgWaitLabel')}</div>
          </div>
          <div className="bs-summary-stat">
            <div className="ss-value">{avgConsult}</div>
            <div className="ss-label">{t('blesaf.summary.avgConsult')}</div>
          </div>
          <div className="bs-summary-stat">
            <div className="ss-value">—</div>
            <div className="ss-label">{t('blesaf.summary.firstPatient')}</div>
          </div>
          <div className="bs-summary-stat">
            <div className="ss-value">—</div>
            <div className="ss-label">{t('blesaf.summary.lastPatient')}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="bs-summary-footer">
          <div className="bs-summary-branding">
            <div className="bs-blesaf-mark">B</div>
            BleSaf
          </div>
          <button className="bs-share-btn">
            <span className="material-symbols-rounded">share</span>
            {t('blesaf.summary.share')}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bs-summary-actions">
        <button className="bs-summary-action-btn">
          <span className="material-symbols-rounded">download</span>
          {t('blesaf.summary.export')}
        </button>
        <button className="bs-summary-action-btn primary" onClick={onNewDay}>
          <span className="material-symbols-rounded">arrow_forward</span>
          {t('blesaf.summary.newDay')}
        </button>
      </div>
    </div>
  );
}
