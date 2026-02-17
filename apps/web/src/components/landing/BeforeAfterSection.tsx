import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function BeforeAfterSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const beforeItems = [
    t('landing.beforeAfter.before1'),
    t('landing.beforeAfter.before2'),
    t('landing.beforeAfter.before3'),
    t('landing.beforeAfter.before4'),
  ];

  const afterItems = [
    t('landing.beforeAfter.after1'),
    t('landing.beforeAfter.after2'),
    t('landing.beforeAfter.after3'),
    t('landing.beforeAfter.after4'),
  ];

  return (
    <section id="before-after" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 rtl:md:flex-row-reverse">
          {/* Before */}
          <div className="bg-red-50 rounded-2xl p-6 sm:p-8 border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500" style={{ fontSize: 22 }}>
                  sentiment_dissatisfied
                </span>
              </div>
              <h3 className="text-xl font-bold text-red-900">
                {t('landing.beforeAfter.beforeTitle')}
              </h3>
            </div>
            <ul className="space-y-4">
              {beforeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-400 mt-0.5 flex-shrink-0" style={{ fontSize: 20 }}>
                    close
                  </span>
                  <span className="text-red-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="bg-green-50 rounded-2xl p-6 sm:p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600" style={{ fontSize: 22 }}>
                  sentiment_satisfied
                </span>
              </div>
              <h3 className="text-xl font-bold text-green-900">
                {t('landing.beforeAfter.afterTitle')}
              </h3>
            </div>
            <ul className="space-y-4">
              {afterItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 flex-shrink-0" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-green-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            to="/signup"
            className="inline-block bg-primary-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-all hover:scale-105 duration-200"
          >
            {t('landing.hero.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
