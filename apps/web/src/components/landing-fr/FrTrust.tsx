import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { ShieldCheck, Server, Lock, Trash2 } from 'lucide-react';

const PILLARS = [
  { icon: ShieldCheck, key: 'pillar1' },
  { icon: Server, key: 'pillar2' },
  { icon: Lock, key: 'pillar3' },
  { icon: Trash2, key: 'pillar4' },
] as const;

export default function FrTrust() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-navy">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <div className="text-center mb-14">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-fr-gold/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-fr-gold" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('landingFr.trust.title')}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('landingFr.trust.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
              style={{ transitionDelay: isInView ? `${i * 100}ms` : '0ms' }}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-fr-gold/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-fr-gold" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 font-inter">
                {t(`landingFr.trust.${key}Title`)}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(`landingFr.trust.${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
