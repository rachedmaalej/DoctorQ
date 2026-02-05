import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface SubscriptionStatus {
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  smsCredits: number;
  canUseApp: boolean;
}

interface SmsBalance {
  credits: number;
  used: number;
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [smsBalance, setSmsBalance] = useState<SmsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subData, smsData] = await Promise.all([
        api.getSubscription(),
        api.getSmsBalance(),
      ]);
      setSubscription(subData);
      setSmsBalance(smsData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'MONTHLY' | 'YEARLY') => {
    setIsCheckoutLoading(plan);
    try {
      const { payUrl } = await api.createSubscriptionCheckout(plan);
      window.location.href = payUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsCheckoutLoading(null);
    }
  };

  const handleBuySms = async (packageName: 'starter' | 'standard' | 'pro') => {
    setIsCheckoutLoading(packageName);
    try {
      const { payUrl } = await api.createSmsCheckout(packageName);
      window.location.href = payUrl;
    } catch (error) {
      console.error('SMS checkout failed:', error);
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

  const isTrial = subscription?.status === 'TRIAL';
  const isExpired = subscription?.status === 'EXPIRED';
  const isActive = subscription?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Current Status Card */}
        <div className={`rounded-2xl p-6 ${
          isExpired ? 'bg-red-50 border-2 border-red-200' :
          isTrial ? 'bg-yellow-50 border-2 border-yellow-200' :
          'bg-green-50 border-2 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isExpired ? t('subscription.status.expired') :
                 isTrial ? t('subscription.status.trial') :
                 t('subscription.status.active')}
              </h2>
              {subscription?.daysRemaining !== null && (
                <p className={`text-sm mt-1 ${
                  isExpired ? 'text-red-600' :
                  isTrial ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  {isExpired
                    ? t('subscription.expiredMessage')
                    : t('subscription.daysRemaining', { days: subscription?.daysRemaining })}
                </p>
              )}
            </div>
            {isActive && subscription?.plan && (
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                {subscription.plan === 'MONTHLY' ? t('subscription.monthly') : t('subscription.yearly')}
              </span>
            )}
          </div>
        </div>

        {/* SMS Credits */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('subscription.smsCredits')}</h2>
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-900">{smsBalance?.credits || 0}</span>
              <span className="text-gray-500 ml-1">{t('subscription.smsRemaining')}</span>
            </div>
          </div>

          {(smsBalance?.credits || 0) < 20 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">{t('subscription.lowCreditsWarning')}</p>
            </div>
          )}

          {/* SMS Packages */}
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t('subscription.buyMoreSms')}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleBuySms('starter')}
              disabled={isCheckoutLoading === 'starter'}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-xl font-bold text-gray-900">100 SMS</div>
              <div className="text-gray-600">10 TND</div>
              <div className="text-xs text-gray-400 mt-1">0.10 TND/SMS</div>
            </button>
            <button
              onClick={() => handleBuySms('standard')}
              disabled={isCheckoutLoading === 'standard'}
              className="p-4 border-2 border-primary-300 bg-primary-50 rounded-xl hover:border-primary-400 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-xs text-primary-600 font-medium mb-1">{t('subscription.popular')}</div>
              <div className="text-xl font-bold text-gray-900">300 SMS</div>
              <div className="text-gray-600">25 TND</div>
              <div className="text-xs text-green-600 mt-1">0.08 TND/SMS</div>
            </button>
            <button
              onClick={() => handleBuySms('pro')}
              disabled={isCheckoutLoading === 'pro'}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-xl font-bold text-gray-900">1000 SMS</div>
              <div className="text-gray-600">70 TND</div>
              <div className="text-xs text-green-600 mt-1">0.07 TND/SMS</div>
            </button>
          </div>
        </div>

        {/* Subscription Plans (show if trial or expired) */}
        {(isTrial || isExpired) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('subscription.upgradePlan')}</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Monthly */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.monthly')}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">50</span>
                  <span className="text-gray-600">TND/mois</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.dashboard')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.unlimited')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.support')}
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('MONTHLY')}
                  disabled={isCheckoutLoading === 'MONTHLY'}
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isCheckoutLoading === 'MONTHLY' ? t('common.loading') : t('subscription.selectMonthly')}
                </button>
              </div>

              {/* Yearly */}
              <div className="border-2 border-primary-500 rounded-xl p-6 relative">
                <div className="absolute -top-3 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {t('subscription.savings')}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.yearly')}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">500</span>
                  <span className="text-gray-600">TND/an</span>
                </div>
                <p className="text-sm text-green-600 mb-4">{t('subscription.yearlySavings')}</p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.dashboard')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.unlimited')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('subscription.features.support')}
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('YEARLY')}
                  disabled={isCheckoutLoading === 'YEARLY'}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isCheckoutLoading === 'YEARLY' ? t('common.loading') : t('subscription.selectYearly')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {smsBalance && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.usage')}</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t('subscription.totalSmsSent')}</span>
              <span className="font-medium text-gray-900">{smsBalance.used}</span>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {t('subscription.needHelp')}{' '}
            <a href="mailto:support@blesaf.tn" className="text-primary-600 hover:underline">
              support@blesaf.tn
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
