import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { X, CheckCircle } from 'lucide-react';

export default function FrBeforeAfter() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const beforeItems = [
    t('landingFr.beforeAfter.before1'),
    t('landingFr.beforeAfter.before2'),
    t('landingFr.beforeAfter.before3'),
    t('landingFr.beforeAfter.before4'),
  ];

  const afterItems = [
    t('landingFr.beforeAfter.after1'),
    t('landingFr.beforeAfter.after2'),
    t('landingFr.beforeAfter.after3'),
    t('landingFr.beforeAfter.after4'),
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-cream">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Before */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-red-900 font-inter">
                {t('landingFr.beforeAfter.beforeTitle')}
              </h3>
            </div>
            <ul className="space-y-4">
              {beforeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                  <span className="text-red-800 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-900 font-inter">
                {t('landingFr.beforeAfter.afterTitle')}
              </h3>
            </div>
            <ul className="space-y-4">
              {afterItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-green-800 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            to="/signup"
            className="inline-block bg-fr-gold text-fr-navy px-8 py-3.5 rounded-xl font-semibold hover:bg-fr-gold-light transition-all hover:scale-[1.02] duration-200"
          >
            {t('landingFr.hero.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
