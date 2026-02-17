import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { webBrand } from '../../lib/brand';

function Check() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const features = [
    t('landing.pricing.feature1'),
    t('landing.pricing.feature2'),
    t('landing.pricing.feature3'),
    t('landing.pricing.feature4'),
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {t('landing.pricing.title')}
        </h2>
        <p className="text-xl text-gray-600 text-center mb-12">
          {t('landing.pricing.subtitle')}
        </p>

        {/* Founding Clinic Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 sm:p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏅</span>
            <h3 className="text-lg font-bold text-amber-900">
              {t('landing.pricing.founderTitle')}
            </h3>
          </div>
          <p className="text-amber-800 text-sm sm:text-base mb-1">
            {t('landing.pricing.founderSubtitle')}
          </p>
          <p className="text-amber-600 text-xs">
            {t('landing.pricing.founderNote')}
          </p>
        </div>

        {/* Subscription Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Monthly */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('landing.pricing.monthly')}
            </h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">{webBrand.pricing.monthlyDisplay.split(' ')[0]}</span>
              <span className="text-xl text-gray-600">{webBrand.pricing.monthlyUnit}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              {t('landing.pricing.selectMonthly')}
            </Link>
          </div>

          {/* Yearly */}
          <div className="bg-white rounded-2xl p-8 border-2 border-primary-500 relative">
            <div className="absolute -top-3 right-6 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('landing.pricing.popular')}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('landing.pricing.yearly')}
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-gray-900">{webBrand.pricing.yearlyDisplay.split(' ')[0]}</span>
              <span className="text-xl text-gray-600">{webBrand.pricing.yearlyUnit}</span>
            </div>
            <p className="text-green-600 font-medium mb-6">
              {t('landing.pricing.yearlySavings')}
            </p>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('landing.pricing.selectYearly')}
            </Link>
          </div>
        </div>

        {/* Trial CTA */}
        <div className="text-center mt-8">
          <p className="text-lg text-gray-600 mb-4">{t('landing.pricing.trialNote')}</p>
          <Link
            to="/signup"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all hover:scale-105 duration-200"
          >
            {t('landing.pricing.startTrial')}
          </Link>
        </div>
      </div>
    </section>
  );
}
