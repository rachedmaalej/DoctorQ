import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

interface SubscriptionData {
  status: string;
  daysRemaining: number | null;
  canUseApp: boolean;
}

export default function TrialBanner() {
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedDate = localStorage.getItem('trial_banner_dismissed');
    if (dismissedDate) {
      const today = new Date().toDateString();
      if (dismissedDate === today) {
        setDismissed(true);
        return;
      }
    }

    api.getSubscription()
      .then(data => setSub(data))
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('trial_banner_dismissed', new Date().toDateString());
    setDismissed(true);
  };

  if (dismissed || !sub) return null;

  // Only show for TRIAL status with <=7 days remaining
  if (sub.status !== 'TRIAL' || sub.daysRemaining === null || sub.daysRemaining > 7) {
    // Show blocking banner for expired trials
    if (sub.status === 'EXPIRED') {
      return (
        <div className="bg-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">{t('trial.expired')}</span>
            </div>
            <Link
              to="/subscription"
              className="px-4 py-1.5 bg-white text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              {t('trial.upgrade')}
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  const isUrgent = sub.daysRemaining <= 3;
  const bgColor = isUrgent ? 'bg-red-500' : 'bg-amber-500';
  const hoverColor = isUrgent ? 'hover:bg-red-50' : 'hover:bg-amber-50';
  const textColor = isUrgent ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`${bgColor} text-white px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">
            {t('trial.daysRemaining', { count: sub.daysRemaining })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/subscription"
            className={`px-4 py-1.5 bg-white ${textColor} rounded-lg font-semibold text-sm ${hoverColor} transition-colors`}
          >
            {t('trial.upgrade')}
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
