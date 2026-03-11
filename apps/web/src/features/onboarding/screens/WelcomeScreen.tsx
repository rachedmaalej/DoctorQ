import type React from 'react';
import ProgressBar from '../components/ProgressBar';
import IllustrationPanel from '../components/IllustrationPanel';
import ContentCard from '../components/ContentCard';
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
    <div
      className="flex flex-col h-full"
      style={{ '--ob-illustration-h': '62vh' } as React.CSSProperties}
    >
      <div className="relative">
        <ProgressBar step={step} />
        <IllustrationPanel
          src={ILLUSTRATION_PATHS.welcome}
          alt="Doctors greeting patients"
        />
      </div>

      <ContentCard>
        <div className="flex flex-col items-center justify-center h-full text-center gap-2">
          <h1
            className="text-[24px] font-bold leading-tight"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
          >
            {copy.headline}
          </h1>
          <p
            className="text-[14px] leading-relaxed mb-4"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
          >
            {copy.subtitle}
          </p>
          <PillButton onClick={onAdvance}>
            {copy.cta} <span aria-hidden="true">&rarr;</span>
          </PillButton>
        </div>
      </ContentCard>
    </div>
  );
}
