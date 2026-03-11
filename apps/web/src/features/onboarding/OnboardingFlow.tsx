import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { STEPS } from './constants/onboardingConfig';
import type { SpecialtyId } from './constants/onboardingConfig';
import { trackOnboarding, EVENTS } from './hooks/useOnboardingAnalytics';
import { api } from '@/lib/api';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { useTourStore } from '@/features/tour/tourStore';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SpecialtyScreen from './screens/SpecialtyScreen';
import SignUpScreen from './screens/SignUpScreen';
import QRRevealScreen from './screens/QRRevealScreen';

/** Slide left on advance, slide right on back */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { clinicId: storedClinicId, clinicName: storedClinicName } = useOnboardingStore();
  const { checkAuth } = useAuthStore();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [specialty, setSpecialty] = useState<SpecialtyId | null>(null);
  const [signUpResult, setSignUpResult] = useState<{ clinicId: string; clinicName: string } | null>(
    storedClinicId && storedClinicName
      ? { clinicId: storedClinicId, clinicName: storedClinicName }
      : null,
  );

  const advance = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const skip = useCallback(() => {
    if (step === 2) {
      // Specialty step — default to "other"
      setSpecialty('autres');
    }
    setDirection(1);
    setStep((s) => s + 1);
  }, [step]);

  const handleSpecialtySelect = useCallback((id: SpecialtyId) => {
    setSpecialty(id);
    trackOnboarding(EVENTS.SPECIALTY_SELECTED, { specialty: id });
  }, []);

  const handleSignUpComplete = useCallback(
    async (clinicId: string, clinicName: string) => {
      setSignUpResult({ clinicId, clinicName });
      trackOnboarding(EVENTS.ONBOARDING_COMPLETED);
      localStorage.setItem('blesaf_onboarded', 'true');
      try {
        await api.updateOnboarding(3, true);
      } catch {
        // Non-blocking — dashboard will still work
      }
      // Queue the guided tour — fires every time a user goes through onboarding
      useTourStore.getState().setState('WELCOME');
      await checkAuth();
      navigate('/dashboard');
    },
    [navigate, checkAuth],
  );

  const handleComplete = useCallback(async () => {
    trackOnboarding(EVENTS.ONBOARDING_COMPLETED);
    localStorage.setItem('blesaf_onboarded', 'true');
    try {
      await api.updateOnboarding(3, true);
    } catch {
      // Non-blocking — dashboard will still work
    }
    navigate('/dashboard');
  }, [navigate]);

  // Track onboarding start on Welcome screen
  const handleSplashComplete = useCallback(() => {
    trackOnboarding(EVENTS.ONBOARDING_STARTED);
    advance();
  }, [advance]);

  const currentStep = STEPS[step];

  function renderScreen() {
    switch (currentStep) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      case 'welcome':
        return <WelcomeScreen step={step} onAdvance={advance} />;
      case 'specialty':
        return (
          <SpecialtyScreen
            step={step}
            specialty={specialty}
            onSelect={handleSpecialtySelect}
            onAdvance={advance}
            onSkip={skip}
          />
        );
      case 'signup':
        return (
          <SignUpScreen
            step={step}
            specialty={specialty}
            onAdvance={handleSignUpComplete}
          />
        );
      case 'qr-reveal':
        return (
          <QRRevealScreen
            step={step}
            clinicId={signUpResult?.clinicId ?? storedClinicId ?? ''}
            clinicName={signUpResult?.clinicName ?? storedClinicName ?? ''}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-white overflow-hidden" style={{ fontFamily: 'var(--ob-font)' }}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className="absolute inset-0 flex flex-col"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
