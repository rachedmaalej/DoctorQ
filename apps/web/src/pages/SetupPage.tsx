import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import { webBrand } from '../lib/brand';
import { api } from '../lib/api';
import ProgressBar from '../components/onboarding/ProgressBar';
import type { SetupPhase } from '../stores/onboardingStore';

// ── Animated setup checklist (welcome phase) ──
const STEP_KEYS = ['onboarding.setup.step1', 'onboarding.setup.step2', 'onboarding.setup.step3'] as const;
const STEP_DEFAULTS = ['Création du cabinet', 'Configuration de la file', 'Génération du QR code'];

// Timeline: item appears → spins 800ms → checks. Staggered 1200ms apart.
// Total: ~400ms (first appear) + 3×1200ms = ~4s inside 5.2s phase
const APPEAR_DELAY = 600;   // first item appears after 600ms
const STEP_GAP = 1200;      // between each step
const SPIN_DURATION = 800;  // spinner visible before check

function SetupChecklist() {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<('hidden' | 'spinning' | 'done')[]>(['hidden', 'hidden', 'hidden']);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_KEYS.forEach((_, i) => {
      // Show item (spinning)
      timers.push(setTimeout(() => {
        setSteps(prev => { const next = [...prev]; next[i] = 'spinning'; return next; });
      }, APPEAR_DELAY + i * STEP_GAP));

      // Complete item (done)
      timers.push(setTimeout(() => {
        setSteps(prev => { const next = [...prev]; next[i] = 'done'; return next; });
      }, APPEAR_DELAY + i * STEP_GAP + SPIN_DURATION));
    });

    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="setup-checklist">
      {STEP_KEYS.map((key, i) => (
        <div
          key={key}
          className={`setup-check-item ${steps[i] !== 'hidden' ? 'show' : ''} ${steps[i] === 'done' ? 'done' : ''}`}
        >
          {steps[i] === 'spinning' && <div className="setup-spinner" />}
          {steps[i] === 'done' && (
            <div className="setup-check-circle">
              <svg viewBox="0 0 14 14" className="setup-check-svg">
                <path d="M2 7l3.5 3.5L12 4" />
              </svg>
            </div>
          )}
          {steps[i] === 'hidden' && <div className="setup-check-placeholder" />}
          <span className="setup-check-text">{t(key, STEP_DEFAULTS[i])}</span>
        </div>
      ))}
    </div>
  );
}

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    clinicId: onboardingClinicId,
    setQrCode,
    setClinicInfo,
    setupPhase,
    setSetupPhase,
    setTestPatientId,
  } = useOnboardingStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authClinic = useAuthStore((s) => s.clinic);

  const clinicId = onboardingClinicId || authClinic?.id || null;
  const clinicName = useOnboardingStore((s) => s.clinicName) || authClinic?.name || '';

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [testPatientEntry, setTestPatientEntry] = useState<{ id: string; patientName: string; position: number } | null>(null);

  // Sync onboarding store from auth store on page refresh
  useEffect(() => {
    if (!onboardingClinicId && authClinic?.id) {
      setClinicInfo(authClinic.id, authClinic.name);
    }
  }, [onboardingClinicId, authClinic, setClinicInfo]);

  // Guard: must be authenticated and have clinic info
  if (!isAuthenticated || !clinicId) {
    return <Navigate to="/signup" replace />;
  }

  // If onboarding already completed, go to dashboard
  if (authClinic?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const checkinUrl = `https://${webBrand.domain}/checkin/${clinicId}`;

  // Generate QR code in background (needed for WelcomePage)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    async function generateQr() {
      try {
        const dataUrl = await QRCode.toDataURL(checkinUrl, {
          width: 440,
          margin: 2,
          color: { dark: '#1A1A2E', light: '#FFFFFF' },
        });
        if (!cancelled) {
          setQrCode(dataUrl, checkinUrl);
        }
      } catch {
        // QR generation will be retried on WelcomePage if needed
      }
    }
    generateQr();
    return () => { cancelled = true; };
  }, [checkinUrl, setQrCode]);

  // Phase A: Welcome animation → auto-advance to addPatient
  // Opens the queue silently in the background during the transition
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (setupPhase !== 'welcome') return;

    // If queue was already opened (refresh), skip ahead
    if (authClinic?.isDoctorPresent) {
      setSetupPhase('addPatient');
      return;
    }

    // Open queue silently in background
    api.setDoctorPresence(true).catch(() => {});

    const timer = setTimeout(() => {
      setSetupPhase('addPatient');
    }, 5200);
    return () => clearTimeout(timer);
  }, [setupPhase, setSetupPhase, authClinic?.isDoctorPresent]);

  // Phase B: Add test patient
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleAddTestPatient = useCallback(async () => {
    setIsActionLoading(true);
    try {
      const entry = await api.addPatient({
        patientName: t('onboarding.setup.testPatientName', 'Patient Test'),
        patientPhone: '',
      });
      setTestPatientId(entry.id);
      setTestPatientEntry({ id: entry.id, patientName: entry.patientName ?? 'Patient Test', position: entry.position });
      setTimeout(() => {
        setSetupPhase('ready');
      }, 1200);
    } catch {
      // Let user retry
    } finally {
      setIsActionLoading(false);
    }
  }, [t, setTestPatientId, setSetupPhase]);

  // Phase D: Navigate to welcome (keep test patient so doctor sees it on dashboard)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleGoToQrCode = useCallback(() => {
    navigate('/welcome', { replace: true });
  }, [navigate]);

  const renderPhaseContent = (phase: SetupPhase) => {
    switch (phase) {
      case 'welcome':
        return (
          <div className="text-center" style={{ animation: 'setup-fade-in 600ms ease-out' }}>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E', fontSize: '26px' }}>
              {t('onboarding.setup.ready', 'Votre cabinet est prêt')}
            </h1>
            <p className="text-lg" style={{ color: '#1B7A4A', fontWeight: 600 }}>
              {clinicName}
            </p>
            <SetupChecklist />
          </div>
        );

      case 'addPatient':
        return (
          <div className="text-center" style={{ animation: 'setup-fade-in 400ms ease-out' }}>
            <p className="text-lg mb-6" style={{ color: '#1A1A2E', fontSize: '18px', lineHeight: '1.5' }}>
              {t('onboarding.setup.addPatient', 'Ajoutons un patient test pour voir comment ça marche.')}
            </p>
            <button
              onClick={handleAddTestPatient}
              disabled={isActionLoading}
              className="w-full font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                height: '52px',
                maxWidth: '320px',
                margin: '0 auto',
                borderRadius: '8px',
                backgroundColor: '#1B7A4A',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => !isActionLoading && (e.currentTarget.style.backgroundColor = '#165f3a')}
              onMouseLeave={(e) => !isActionLoading && (e.currentTarget.style.backgroundColor = '#1B7A4A')}
            >
              {isActionLoading ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>person_add</span>
                  {t('onboarding.setup.addCta', 'Ajouter')}
                </>
              )}
            </button>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center" style={{ animation: 'setup-fade-in 400ms ease-out' }}>
            {testPatientEntry && (
              <div
                className="mx-auto mb-6 px-4 py-3 bg-white rounded-xl shadow-sm text-left flex items-center gap-3"
                style={{
                  maxWidth: '320px',
                  borderLeft: '4px solid #1B7A4A',
                  animation: 'setup-slide-in 400ms ease-out',
                }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-base" style={{ color: '#1A1A2E' }}>
                    {testPatientEntry.patientName}
                  </p>
                  <p className="text-sm" style={{ color: '#888899' }}>
                    Position #{testPatientEntry.position}
                  </p>
                </div>
                <div
                  className="px-2 py-1 rounded-md text-xs font-medium"
                  style={{ backgroundColor: '#E8F5EE', color: '#1B7A4A' }}
                >
                  En attente
                </div>
              </div>
            )}

            <p className="text-lg mb-6" style={{ color: '#1A1A2E', fontSize: '17px', lineHeight: '1.6' }}>
              {t('onboarding.setup.done', "C'est aussi simple que ça. Demain, vos vrais patients s'inscriront via votre QR code.")}
            </p>
            <button
              onClick={handleGoToQrCode}
              className="w-full font-semibold text-white flex items-center justify-center gap-2"
              style={{
                height: '52px',
                maxWidth: '320px',
                margin: '0 auto',
                borderRadius: '8px',
                backgroundColor: '#1B7A4A',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#165f3a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1B7A4A')}
            >
              {t('onboarding.setup.seeCta', 'Voir mon QR code')} →
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7F5' }}>
      <ProgressBar currentStep={2} />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold" style={{ color: '#1B7A4A' }}>BléSaf</h2>
          </div>

          {renderPhaseContent(setupPhase)}
        </div>
      </main>

      <style>{`
        @keyframes setup-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes setup-slide-in {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* ── Setup Checklist ── */
        .setup-checklist {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 260px;
          margin: 28px auto 0;
        }
        .setup-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateY(8px);
        }
        .setup-check-item.show {
          animation: setup-item-in 400ms ease-out forwards;
        }
        @keyframes setup-item-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Placeholder (hidden state) */
        .setup-check-placeholder {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
        }

        /* Spinner */
        .setup-spinner {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2.5px solid #E8F5EE;
          border-top-color: #1B7A4A;
          animation: setup-spin 700ms linear infinite;
          flex-shrink: 0;
        }
        @keyframes setup-spin {
          to { transform: rotate(360deg); }
        }

        /* Checkmark circle */
        .setup-check-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #1B7A4A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: setup-check-pop 350ms ease;
        }
        @keyframes setup-check-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .setup-check-svg {
          width: 13px;
          height: 13px;
        }
        .setup-check-svg path {
          stroke: white;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: setup-check-draw 300ms 80ms ease forwards;
        }
        @keyframes setup-check-draw {
          to { stroke-dashoffset: 0; }
        }

        /* Text */
        .setup-check-text {
          font-size: 14px;
          color: #888899;
          text-align: left;
          transition: color 250ms;
        }
        [dir="rtl"] .setup-check-text {
          text-align: right;
        }
        .setup-check-item.done .setup-check-text {
          color: #1A1A2E;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
