import OnboardingLayout from '../components/OnboardingLayout';
import PillButton from '../components/PillButton';
import { SCREEN_COPY, ILLUSTRATION_PATHS } from '../constants/onboardingConfig';

interface WelcomeScreenProps {
  step: number;
  onAdvance: () => void;
}

/**
 * Screen 1: Welcome with hero illustration.
 * "Votre cabinet numérique en 2 minutes."
 */
export default function WelcomeScreen({ step, onAdvance }: WelcomeScreenProps) {
  const copy = SCREEN_COPY.welcome;

  return (
    <OnboardingLayout
      step={step}
      illustrationSrc={ILLUSTRATION_PATHS.welcome}
      illustrationAlt="Doctors greeting patients"
      illustrationHeight="65dvh"
    >
      <div className="flex flex-col items-center text-center gap-[18px] md:items-start md:text-left md:h-auto md:gap-[18px]">
        <h1
          className="text-[24px] font-bold leading-tight md:text-[32px]"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
        >
          {copy.headline}
        </h1>
        <p
          className="text-[14px] leading-relaxed mb-4 md:text-[16px] md:mb-6"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
        >
          {copy.subtitle}
        </p>
        <PillButton onClick={onAdvance} className="md:max-w-[320px]">
          {copy.cta} <span aria-hidden="true">&rarr;</span>
        </PillButton>
      </div>
    </OnboardingLayout>
  );
}
