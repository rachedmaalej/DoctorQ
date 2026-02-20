import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSSubscriptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubInfo {
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  canUseApp: boolean;
}

export default function BSSubscriptionPanel({ isOpen, onClose }: BSSubscriptionPanelProps) {
  const navigate = useNavigate();
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch subscription when panel opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSubscription()
        .then(setSubInfo)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Derive display values
  const statusLower = (subInfo?.status || '').toLowerCase();
  const planName = subInfo?.status === 'TRIAL'
    ? 'Essai gratuit'
    : subInfo?.plan === 'MONTHLY'
      ? 'Mensuel · 50 TND'
      : subInfo?.plan === 'YEARLY'
        ? 'Annuel · 500 TND'
        : '—';

  const daysRemaining = subInfo?.daysRemaining ?? 0;
  const daysColor = daysRemaining <= 3 ? '#D94F3B' : daysRemaining <= 7 ? '#D4920B' : '#0F7B6C';

  const expiryDate = subInfo?.status === 'TRIAL' && subInfo.trialEndsAt
    ? new Date(subInfo.trialEndsAt).toLocaleDateString('fr-TN')
    : subInfo?.subscriptionEndsAt
      ? new Date(subInfo.subscriptionEndsAt).toLocaleDateString('fr-TN')
      : '';

  const needsUpgrade = subInfo?.status === 'TRIAL' || subInfo?.status === 'EXPIRED' || subInfo?.status === 'PAST_DUE';
  const ctaLabel = subInfo?.status === 'TRIAL' ? "S'abonner" : 'Renouveler';

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Abonnement</span>
        </div>

        <div className="bs-panel-body">
          {loading ? (
            <div style={{ fontSize: 13, color: '#9E9B90', padding: '20px 0', textAlign: 'center' }}>
              Chargement...
            </div>
          ) : subInfo ? (
            <>
              <div className="bs-settings-label">Votre abonnement</div>
              <div className="bs-settings-group" style={{ padding: 14 }}>
                {/* Status row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    className="bs-settings-ico"
                    style={{ background: '#E8F5F1', color: '#0F7B6C' }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>credit_card</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>Plan actuel</div>
                  </div>
                  <span className="bs-status-chip" data-status={statusLower}>
                    {subInfo.status}
                  </span>
                </div>

                {/* Info cards */}
                <div className="bs-sub-info">
                  <div className="bs-sub-card">
                    <div className="bs-sub-label">Plan</div>
                    <div className="bs-sub-value">{planName}</div>
                  </div>
                  <div className="bs-sub-card">
                    <div className="bs-sub-label">Jours restants</div>
                    <div className="bs-sub-value" style={{ color: daysColor }}>
                      {subInfo.daysRemaining ?? '—'}
                    </div>
                    {expiryDate && <div className="bs-sub-date">{expiryDate}</div>}
                  </div>
                </div>
              </div>

              {/* CTA */}
              {needsUpgrade && (
                <button
                  className="bs-btn-primary"
                  onClick={() => navigate('/subscription')}
                  style={{ marginTop: 16 }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upgrade</span>
                  {ctaLabel}
                </button>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#9E9B90', padding: '20px 0', textAlign: 'center' }}>
              Impossible de charger les informations
            </div>
          )}
        </div>
      </div>
    </>
  );
}
