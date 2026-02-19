import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { UserPlus, QrCode, LayoutDashboard } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, key: 'step1' },
  { icon: QrCode, key: 'step2' },
  { icon: LayoutDashboard, key: 'step3' },
] as const;

export default function FrHowItWorks() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-navy">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
          {t('landingFr.howItWorks.title')}
        </h2>
        <div className="fr-divider mb-14" />

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-fr-gold/30" aria-hidden="true" />

          {STEPS.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className="text-center relative"
              style={{ transitionDelay: isInView ? `${i * 150}ms` : '0ms' }}
            >
              {/* Number circle */}
              <div className="w-10 h-10 mx-auto mb-5 rounded-full bg-fr-gold text-fr-navy flex items-center justify-center font-bold text-lg relative z-10">
                {i + 1}
              </div>
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-fr-gold" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-inter">
                {t(`landingFr.howItWorks.${key}Title`)}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(`landingFr.howItWorks.${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
