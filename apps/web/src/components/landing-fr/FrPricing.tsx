import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { webBrand } from '../../lib/brand';
import { Check } from 'lucide-react';

export default function FrPricing() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const features = [
    t('landingFr.pricing.feature1'),
    t('landingFr.pricing.feature2'),
    t('landingFr.pricing.feature3'),
    t('landingFr.pricing.feature4'),
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-cream">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-fr-navy mb-4">
          {t('landingFr.pricing.title')}
        </h2>
        <p className="text-lg text-gray-600 text-center mb-4">
          {t('landingFr.pricing.subtitle')}
        </p>
        <div className="fr-divider mb-14" />

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          {/* Monthly */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-fr-navy mb-2 font-inter">
              {t('landingFr.pricing.monthly')}
            </h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-fr-navy">{webBrand.pricing.monthlyDisplay.split(' ')[0]}</span>
              <span className="text-lg text-gray-500">{webBrand.pricing.monthlyUnit}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full text-center bg-gray-100 text-fr-navy py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
            >
              {t('landingFr.pricing.selectMonthly')}
            </Link>
          </div>

          {/* Yearly */}
          <div className="bg-white rounded-2xl p-8 border-2 border-fr-gold relative shadow-sm">
            <div className="absolute -top-3 right-6 bg-fr-gold text-fr-navy px-3 py-1 rounded-full text-xs font-semibold">
              {t('landingFr.pricing.popular')}
            </div>
            <h3 className="text-xl font-semibold text-fr-navy mb-2 font-inter">
              {t('landingFr.pricing.yearly')}
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-fr-navy">{webBrand.pricing.yearlyDisplay.split(' ')[0]}</span>
              <span className="text-lg text-gray-500">{webBrand.pricing.yearlyUnit}</span>
            </div>
            <p className="text-green-600 font-medium text-sm mb-6">
              {t('landingFr.pricing.yearlySavings')}
            </p>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full text-center bg-fr-gold text-fr-navy py-3 rounded-lg font-semibold hover:bg-fr-gold-light transition-colors text-sm"
            >
              {t('landingFr.pricing.selectYearly')}
            </Link>
          </div>
        </div>

        {/* Trial CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('landingFr.pricing.trialNote')}</p>
          <Link
            to="/signup"
            className="inline-block bg-fr-navy text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-fr-navy-800 transition-all hover:scale-[1.02] duration-200"
          >
            {t('landingFr.pricing.startTrial')}
          </Link>
        </div>
      </div>
    </section>
  );
}
