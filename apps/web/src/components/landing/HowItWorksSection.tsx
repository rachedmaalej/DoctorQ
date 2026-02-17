import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const STEP_ICONS = ['person_add', 'qr_code_2', 'dashboard'];

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const steps = [
    { title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc'), icon: STEP_ICONS[0] },
    { title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc'), icon: STEP_ICONS[1] },
    { title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc'), icon: STEP_ICONS[2] },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-5xl mx-auto`}>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
          {t('landing.howItWorks.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-0.5 bg-gray-200" aria-hidden="true" />

          {steps.map((step, i) => (
            <div
              key={i}
              className="text-center relative"
              style={{ transitionDelay: isInView ? `${i * 150}ms` : '0ms' }}
            >
              {/* Number circle */}
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl relative z-10">
                {i + 1}
              </div>
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-50 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary-600"
                  style={{ fontSize: 28 }}
                >
                  {step.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
