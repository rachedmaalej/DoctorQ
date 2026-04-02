import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { webBrand } from '../lib/brand';
import type { SubscriptionTier } from '../types';

interface SubscriptionStatus {
  status: string;
  plan: string | null;
  tier: SubscriptionTier;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  canUseApp: boolean;
  limits: { dailyPatients: number; maxDoctors: number; historyDays: number };
  usage: { dailyPatientCount: number };
}

interface TierInfo {
  tier: string;
  monthly: { amount: number; amountDisplay: number; currency: string };
  yearly: { amount: number; amountDisplay: number; currency: string; savings: number };
  limits: { dailyPatients: number; maxDoctors: number; historyDays: number };
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Gratuit',
  SOLO_PRO: 'Solo Pro',
  EQUIPE: 'Équipe',
  CLINIQUE: 'Clinique',
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  FREE: 'Pour découvrir la plateforme',
  SOLO_PRO: 'Pour un médecin indépendant',
  EQUIPE: 'Pour un cabinet multi-praticiens',
  CLINIQUE: 'Pour les grandes structures',
};

const TIER_FEATURES: Record<string, string[]> = {
  FREE: [
    '1 médecin',
    '30 patients/jour',
    'Historique 7 jours',
    'Filigrane AuSuivant',
  ],
  SOLO_PRO: [
    '1 médecin',
    '100 patients/jour',
    'Historique 90 jours',
    'Sans filigrane',
    'Support prioritaire',
  ],
  EQUIPE: [
    'Jusqu\'à 5 médecins',
    '100 patients/jour',
    'Historique 90 jours',
    'Sans filigrane',
    'Support prioritaire',
  ],
  CLINIQUE: [
    'Médecins illimités',
    'Patients illimités',
    'Historique illimité',
    'Image de marque personnalisée',
    'Support dédié',
  ],
};

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subData, pricingData] = await Promise.all([
        api.getSubscription(),
        api.getPricing(),
      ]);
      setSubscription(subData as SubscriptionStatus);
      setTiers(pricingData.tiers || []);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (tier === 'FREE') return;
    setIsCheckoutLoading(tier);
    try {
      const { payUrl } = await api.createSubscriptionCheckout(billingCycle, tier);
      window.location.href = payUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsCheckoutLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const currentTier = subscription?.tier || 'FREE';
  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{t('subscription.title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Current Status Banner */}
        <div className={`rounded-2xl p-6 ${
          isExpired ? 'bg-red-50 border-2 border-red-200' :
          isTrial ? 'bg-yellow-50 border-2 border-yellow-200' :
          'bg-green-50 border-2 border-green-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isExpired ? t('subscription.status.expired') :
                   isTrial ? t('subscription.status.trial') :
                   t('subscription.status.active')}
                </h2>
                <span className="px-2 py-0.5 bg-white/60 rounded-full text-xs font-medium text-gray-700">
                  {TIER_LABELS[currentTier] || currentTier}
                </span>
              </div>
              {subscription?.daysRemaining !== null && subscription?.daysRemaining !== undefined && (
                <p className={`text-sm mt-1 ${
                  isExpired ? 'text-red-600' :
                  isTrial ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  {isExpired
                    ? t('subscription.expiredMessage')
                    : t('subscription.daysRemaining', { days: subscription.daysRemaining })}
                </p>
              )}
            </div>
            {/* Usage indicator */}
            {subscription && subscription.limits.dailyPatients < Infinity && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Patients aujourd'hui
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.usage.dailyPatientCount} / {subscription.limits.dailyPatients}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <div className="bg-white rounded-full p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'MONTHLY'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'YEARLY'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-1.5 text-xs text-green-600 font-semibold">-2 mois</span>
            </button>
          </div>
        </div>

        {/* Tier Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tierInfo) => {
            const isCurrentTier = tierInfo.tier === currentTier;
            const isPopular = tierInfo.tier === 'SOLO_PRO';
            const isFree = tierInfo.tier === 'FREE';
            const price = billingCycle === 'MONTHLY' ? tierInfo.monthly : tierInfo.yearly;
            const features = TIER_FEATURES[tierInfo.tier] || [];

            return (
              <div
                key={tierInfo.tier}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isPopular
                    ? 'border-2 border-primary-500 shadow-lg'
                    : isCurrentTier
                    ? 'border-2 border-green-400 bg-green-50/30'
                    : 'border-2 border-gray-200'
                } bg-white`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Recommandé
                  </div>
                )}

                {/* Current tier badge */}
                {isCurrentTier && !isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Votre forfait
                  </div>
                )}

                {/* Tier name & description */}
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {TIER_LABELS[tierInfo.tier]}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {TIER_DESCRIPTIONS[tierInfo.tier]}
                </p>

                {/* Price */}
                <div className="mt-4 mb-2">
                  {isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">0 €</span>
                      <span className="text-gray-500">/mois</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {billingCycle === 'MONTHLY'
                          ? `${price.amountDisplay} €`
                          : `${Math.round(price.amountDisplay / 12)} €`}
                      </span>
                      <span className="text-gray-500">/mois</span>
                    </div>
                  )}
                  {billingCycle === 'YEARLY' && !isFree && (
                    <p className="text-xs text-gray-400 mt-1">
                      {price.amountDisplay} € facturé annuellement
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mt-4 mb-6 flex-1">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-500 cursor-default"
                  >
                    Forfait actuel
                  </button>
                ) : isFree ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-50 text-gray-400 cursor-default"
                  >
                    Inclus
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(tierInfo.tier)}
                    disabled={isCheckoutLoading === tierInfo.tier}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCheckoutLoading === tierInfo.tier
                      ? t('common.loading')
                      : currentTier === 'FREE'
                      ? 'Commencer'
                      : 'Changer de forfait'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {t('subscription.needHelp')}{' '}
            <a href={`mailto:${webBrand.supportEmail}`} className="text-primary-600 hover:underline">
              {webBrand.supportEmail}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
