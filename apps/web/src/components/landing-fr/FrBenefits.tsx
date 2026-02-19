import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { Clock, Heart, FileText, Users, BarChart3, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  { icon: Clock, key: 'card1' },
  { icon: Heart, key: 'card2' },
  { icon: FileText, key: 'card3' },
  { icon: Users, key: 'card4' },
  { icon: BarChart3, key: 'card5' },
  { icon: ShieldCheck, key: 'card6' },
] as const;

export default function FrBenefits() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-cream-warm">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-fr-navy mb-4">
          {t('landingFr.benefits.title')}
        </h2>
        <div className="fr-divider mb-14" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ transitionDelay: isInView ? `${i * 80}ms` : '0ms' }}
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-fr-gold-pale flex items-center justify-center">
                <Icon className="w-6 h-6 text-fr-gold" />
              </div>
              <h3 className="text-base font-semibold text-fr-navy mb-2 font-inter">
                {t(`landingFr.benefits.${key}Title`)}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t(`landingFr.benefits.${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
