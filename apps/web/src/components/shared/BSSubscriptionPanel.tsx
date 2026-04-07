import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { PaymentRecord } from '@/types';
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
  const { t, i18n } = useTranslation();
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [historyOpen, setHistoryOpen] = useState(false);

  // Fetch subscription + payment history when panel opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        api.getSubscription().catch(() => null),
        api.getPaymentHistory().catch(() => []),
      ]).then(([sub, hist]) => {
        setSubInfo(sub);
        setPayments(hist);
        // Pre-select current plan if active
        if (sub?.plan === 'MONTHLY') setSelectedPlan('MONTHLY');
        else setSelectedPlan('YEARLY');
      }).finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // ── Derived values ──
  const status = subInfo?.status || '';
  const isExpired = status === 'EXPIRED' || status === 'PAST_DUE';
  const isTrial = status === 'TRIAL';
  const isActive = status === 'ACTIVE';

  // Plan name for banner
  const bannerPlanName = isTrial
    ? t('settingsBs.subscription.freeTrial')
    : isExpired
      ? t('settingsBs.subscription.expired')
      : subInfo?.plan === 'YEARLY'
        ? t('settingsBs.subscription.yearly')
        : subInfo?.plan === 'MONTHLY'
          ? t('settingsBs.subscription.monthly')
          : '—';

  // Status badge
  const badgeLabel = isTrial ? t('settingsBs.subscription.trialBadge') : isActive ? t('settingsBs.subscription.activeBadge') : t('settingsBs.subscription.expiredBadge');
  const badgeClass = isTrial ? 'trial' : isActive ? 'active' : 'expired';

  // Days remaining
  const daysRemaining = subInfo?.daysRemaining ?? 0;
  const totalDays = isTrial
    ? 30
    : subInfo?.plan === 'YEARLY'
      ? 365
      : 30;
  const progressPct = isExpired
    ? 100
    : totalDays > 0
      ? Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100))
      : 0;

  // Expiry date
  const dateLocale = i18n.language === 'ar' ? 'ar-TN' : 'fr-TN';
  const expiryRaw = isTrial ? subInfo?.trialEndsAt : subInfo?.subscriptionEndsAt;
  const expiryDate = expiryRaw
    ? new Date(expiryRaw).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // Days text
  const daysText = isExpired
    ? t('settingsBs.subscription.expiredSince', { days: Math.abs(daysRemaining) })
    : t('settingsBs.subscription.daysRemaining', { days: daysRemaining });

  const dateText = isExpired
    ? t('settingsBs.subscription.expiredOn', { date: expiryDate })
    : isTrial
      ? t('settingsBs.subscription.expiresOn', { date: expiryDate })
      : t('settingsBs.subscription.renewalOn', { date: expiryDate });

  // Banner gradient
  const bannerGradient = isExpired
    ? 'linear-gradient(135deg, #B53A2A 0%, #8B2D20 100%)'
    : 'linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)';

  // Plan section label
  const planSectionLabel = isTrial
    ? t('settingsBs.subscription.choosePlan')
    : isExpired
      ? t('settingsBs.subscription.renew')
      : t('settingsBs.subscription.yourPlan');

  // Selected plan price display
  const selectedPrice = selectedPlan === 'MONTHLY' ? `50 ${t('settingsBs.subscription.priceMonthly')}` : `500 ${t('settingsBs.subscription.priceYearly')}`;

  // CTA config
  const needsCta = isTrial || isExpired;
  const ctaLabel = isTrial
    ? t('settingsBs.subscription.subscribe', { price: selectedPrice })
    : t('settingsBs.subscription.renewBtn', { price: selectedPrice });
  const ctaIcon = isTrial ? 'upgrade' : 'autorenew';
  const ctaBg = isExpired ? '#D94F3B' : '#0F7B6C';

  // Payment method helpers
  const methodLabel = (method: string) => {
    const m = method.toUpperCase();
    if (m === 'KONNECT') return t('settingsBs.subscription.konnect');
    if (m === 'CASH') return t('settingsBs.subscription.cash');
    if (m === 'TRANSFER' || m === 'BANK_TRANSFER') return t('settingsBs.subscription.transfer');
    return method;
  };

  const methodClass = (method: string) => {
    const m = method.toUpperCase();
    if (m === 'KONNECT') return 'method-konnect';
    if (m === 'CASH') return 'method-cash';
    return 'method-transfer';
  };

  const paymentDesc = (p: PaymentRecord) => {
    const amt = p.amount / 1000;
    if (amt >= 500) return t('settingsBs.subscription.yearlySubscription');
    return t('settingsBs.subscription.monthlySubscription');
  };

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} style={{ zIndex: 219 }} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 220, maxWidth: 430, width: '100%' }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">{t('settingsBs.subscription.title')}</span>
        </div>

        <div className="bs-panel-body">
          {loading ? (
            <div style={{ fontSize: 13, color: '#9E9B90', padding: '20px 0', textAlign: 'center' }}>
              {t('settingsBs.subscription.loading')}
            </div>
          ) : subInfo ? (
            <>
              {/* ── Status Banner ── */}
              <div
                style={{
                  background: bannerGradient,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative circles */}
                <div
                  style={{
                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute', bottom: -30, left: 40, width: 80, height: 80,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
                  }}
                />

                {/* Top row: plan name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>{bannerPlanName}</div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 100,
                      color: '#FFF',
                      background: badgeClass === 'trial'
                        ? 'rgba(59,125,217,0.3)'
                        : badgeClass === 'active'
                          ? 'rgba(45,139,78,0.3)'
                          : 'rgba(217,79,59,0.3)',
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 3, background: '#FFF',
                        width: `${progressPct}%`, transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{daysText}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{dateText}</span>
                  </div>
                </div>
              </div>

              {/* ── Warning card (expired only) ── */}
              {isExpired && (
                <div
                  style={{
                    background: '#FDF0ED', border: '1px solid rgba(217,79,59,0.15)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#D94F3B', flexShrink: 0, marginTop: 1 }}>
                    warning
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#D94F3B' }}>
                      {t('settingsBs.subscription.accessLimited')}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6960', marginTop: 2, lineHeight: 1.4 }}>
                      {t('settingsBs.subscription.renewPrompt')}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Plan comparison ── */}
              <div className="bs-settings-label">{planSectionLabel}</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {/* Monthly */}
                <div
                  onClick={() => { if (!isActive) setSelectedPlan('MONTHLY'); }}
                  style={{
                    flex: 1,
                    background: selectedPlan === 'MONTHLY' ? '#F0FAF8' : '#FFF',
                    border: `2px solid ${selectedPlan === 'MONTHLY' ? '#0F7B6C' : '#E8E6DF'}`,
                    borderRadius: 12, padding: 14,
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {selectedPlan === 'MONTHLY' && (
                    <div
                      style={{
                        position: 'absolute', top: 10, right: 10, width: 20, height: 20,
                        borderRadius: '50%', background: '#0F7B6C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 12, color: '#FFF' }}>check</span>
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{t('settingsBs.subscription.monthly')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0F7B6C' }}>
                    50 <span style={{ fontSize: 12, fontWeight: 500, color: '#9E9B90' }}>{t('settingsBs.subscription.priceMonthly')}</span>
                  </div>
                </div>

                {/* Yearly */}
                <div
                  onClick={() => { if (!isActive) setSelectedPlan('YEARLY'); }}
                  style={{
                    flex: 1,
                    background: selectedPlan === 'YEARLY' ? '#F0FAF8' : '#FFF',
                    border: `2px solid ${selectedPlan === 'YEARLY' ? '#0F7B6C' : '#E8E6DF'}`,
                    borderRadius: 12, padding: 14,
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {selectedPlan === 'YEARLY' && (
                    <div
                      style={{
                        position: 'absolute', top: 10, right: 10, width: 20, height: 20,
                        borderRadius: '50%', background: '#0F7B6C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 12, color: '#FFF' }}>check</span>
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{t('settingsBs.subscription.yearly')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0F7B6C' }}>
                    500 <span style={{ fontSize: 12, fontWeight: 500, color: '#9E9B90' }}>{t('settingsBs.subscription.priceYearly')}</span>
                  </div>
                  <div
                    style={{
                      display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 100, background: '#FDF5E6', color: '#D4920B',
                    }}
                  >
                    {t('settingsBs.subscription.saveMoney')}
                  </div>
                </div>
              </div>

              {/* ── CTA Button ── */}
              {needsCta ? (
                <button
                  onClick={() => navigate('/subscription')}
                  style={{
                    height: 48, background: ctaBg, border: 'none', borderRadius: 12,
                    color: '#FFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, transition: 'all 0.15s', marginBottom: 20,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{ctaIcon}</span>
                  {ctaLabel}
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    height: 48, background: '#0F7B6C', border: 'none', borderRadius: 12,
                    color: '#FFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                    cursor: 'not-allowed', width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, marginBottom: 20, opacity: 0.5,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>check_circle</span>
                  {t('settingsBs.subscription.activePlan')}
                </button>
              )}

              {/* ── Billing History ── */}
              <div
                onClick={() => setHistoryOpen(!historyOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', padding: '12px 0 6px',
                }}
              >
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600, color: '#9E9B90' }}>
                  {t('settingsBs.subscription.billingHistory')}
                </span>
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: 18, color: '#9E9B90',
                    transition: 'transform 0.25s',
                    transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  expand_more
                </span>
              </div>

              {historyOpen && (
                <div
                  style={{
                    background: '#FFF', border: '1px solid #E8E6DF',
                    borderRadius: 12, overflow: 'hidden',
                  }}
                >
                  {payments.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9E9B90' }}>
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: 24, color: '#D4D2CC', display: 'block', marginBottom: 6 }}
                      >
                        receipt_long
                      </span>
                      {t('settingsBs.subscription.noPayments')}
                    </div>
                  ) : (
                    payments.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 14px',
                          borderBottom: '1px solid rgba(228,226,221,0.5)',
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            background: isExpired ? '#FDF0ED' : '#E8F5F1',
                            color: isExpired ? '#D94F3B' : '#0F7B6C',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>receipt</span>
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>
                            {paymentDesc(p)}
                          </div>
                          <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>
                            {new Date(p.paidAt).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                        </div>

                        {/* Method badge */}
                        <span
                          style={{
                            fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                            padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                            ...(methodClass(p.method) === 'method-konnect'
                              ? { background: '#EDF3FC', color: '#3B7DD9' }
                              : methodClass(p.method) === 'method-cash'
                                ? { background: '#E8F5F1', color: '#0F7B6C' }
                                : { background: '#F0EDF7', color: '#7C5CFC' }),
                          }}
                        >
                          {methodLabel(p.method)}
                        </span>

                        {/* Amount */}
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', flexShrink: 0 }}>
                          {p.amount / 1000} TND
                        </span>

                        {/* Status dot */}
                        <div
                          style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: p.status === 'PAID' ? '#2D8B4E' : '#D4920B',
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#9E9B90', padding: '20px 0', textAlign: 'center' }}>
              {t('settingsBs.subscription.loadError')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
