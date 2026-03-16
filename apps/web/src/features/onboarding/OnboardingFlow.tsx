import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const { clinicId: storedClinicId, clinicName: storedClinicName } = useOnboardingStore();
  const { checkAuth } = useAuthStore();

  // Skip to QR reveal if clinic already created (OAuth callback or page refresh after signup)
  // Check sessionStorage for OAuth flow (survives checkAuth re-renders)
  const oauthSkip = sessionStorage.getItem('oauth_skip_to_qr') === '1';
  const oauthClinicId = sessionStorage.getItem('oauth_clinic_id');
  const oauthClinicName = sessionStorage.getItem('oauth_clinic_name_result');

  if (oauthSkip && oauthClinicId && oauthClinicName && !storedClinicId) {
    // Restore from sessionStorage into Zustand store
    useOnboardingStore.getState().setClinicInfo(oauthClinicId, oauthClinicName);
  }

  const effectiveClinicId = storedClinicId || oauthClinicId;
  const effectiveClinicName = storedClinicName || oauthClinicName;
  const skipToQr = searchParams.get('step') === 'qr' || oauthSkip || (!!storedClinicId && !!storedClinicName);
  const initialStep = skipToQr ? STEPS.indexOf('qr-reveal') : 0;
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  const [specialty, setSpecialty] = useState<SpecialtyId | null>(null);
  const [signUpResult, setSignUpResult] = useState<{ clinicId: string; clinicName: string } | null>(
    effectiveClinicId && effectiveClinicName
      ? { clinicId: effectiveClinicId, clinicName: effectiveClinicName }
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
    (clinicId: string, clinicName: string) => {
      setSignUpResult({ clinicId, clinicName });
      // Don't call checkAuth() here — it triggers a route guard re-render
      // which remounts OnboardingFlow and resets step to 0.
      // Auth is refreshed in handleComplete after QR reveal.
      advance();
    },
    [advance],
  );

  /** Called from QR reveal screen — final step of onboarding */
  const handleComplete = useCallback(async () => {
    trackOnboarding(EVENTS.ONBOARDING_COMPLETED);
    localStorage.setItem('blesaf_onboarded', 'true');
    // Clean up OAuth sessionStorage
    sessionStorage.removeItem('oauth_skip_to_qr');
    sessionStorage.removeItem('oauth_clinic_id');
    sessionStorage.removeItem('oauth_clinic_name_result');
    try {
      await api.updateOnboarding(3, true);
    } catch {
      // Non-blocking — dashboard will still work
    }
    // Queue the guided tour
    useTourStore.getState().setState('WELCOME');
    // Refresh auth now (after onboardingCompleted is set on server)
    await checkAuth();
    navigate('/dashboard');
  }, [navigate, checkAuth]);

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
    <div className="fixed top-0 left-0 right-0 bg-white overflow-hidden" style={{ height: '100dvh', fontFamily: 'var(--ob-font)' }}>
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
