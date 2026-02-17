import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const BENEFIT_ICONS = ['schedule', 'sentiment_satisfied', 'eco'];
const BENEFIT_COLORS = [
  { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'bg-blue-100' },
  { bg: 'bg-green-50', icon: 'text-green-600', ring: 'bg-green-100' },
  { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'bg-amber-100' },
];

export default function BenefitsSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const benefits = [
    { title: t('landing.benefits.card1Title'), desc: t('landing.benefits.card1Desc'), icon: BENEFIT_ICONS[0], color: BENEFIT_COLORS[0] },
    { title: t('landing.benefits.card2Title'), desc: t('landing.benefits.card2Desc'), icon: BENEFIT_ICONS[1], color: BENEFIT_COLORS[1] },
    { title: t('landing.benefits.card3Title'), desc: t('landing.benefits.card3Desc'), icon: BENEFIT_ICONS[2], color: BENEFIT_COLORS[2] },
  ];

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {t('landing.benefits.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center"
              style={{ transitionDelay: isInView ? `${i * 100}ms` : '0ms' }}
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${b.color.ring} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${b.color.icon}`} style={{ fontSize: 28 }}>
                  {b.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
