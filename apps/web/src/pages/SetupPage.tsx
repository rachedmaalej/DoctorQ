import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import { webBrand } from '../lib/brand';
import ProgressBar from '../components/onboarding/ProgressBar';

export default function SetupPage() {
  const navigate = useNavigate();
  const { clinicId: onboardingClinicId, setQrCode, setClinicInfo } = useOnboardingStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authClinic = useAuthStore((s) => s.clinic);

  // Use onboarding store's clinicId, or fall back to auth store (survives page refresh)
  const clinicId = onboardingClinicId || authClinic?.id || null;

  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const redirectedRef = useRef(false);

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

  const checkinUrl = `https://${webBrand.domain}/checkin/${clinicId}`;

  // Generate QR code client-side in parallel with animation
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
          setQrReady(true);
        }
      } catch {
        if (!cancelled) setQrError(true);
      }
    }
    generateQr();
    return () => { cancelled = true; };
  }, [checkinUrl, setQrCode]);

  // Animation sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleItems([0]), 300),
      setTimeout(() => setVisibleItems([0, 1]), 800),
      setTimeout(() => setVisibleItems([0, 1, 2]), 1300),
      setTimeout(() => setAnimDone(true), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Redirect when both animation AND QR are ready
  useEffect(() => {
    if (animDone && qrReady && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate('/welcome', { replace: true });
    }
  }, [animDone, qrReady, navigate]);

  const items = [
    'Compte créé',
    'Tableau de bord créé',
    'QR code généré',
  ];

  const handleRetry = async () => {
    setQrError(false);
    try {
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 440,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      });
      setQrCode(dataUrl, checkinUrl);
      setQrReady(true);
    } catch {
      setQrError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7F5' }}>
      <ProgressBar currentStep={2} />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center w-full" style={{ maxWidth: '400px' }}>
          {/* Logo */}
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B7A4A' }}>BleSaf</h2>

          {/* Title */}
          <h2
            className="text-xl font-bold mb-8"
            style={{ color: '#1A1A2E', fontSize: '22px', animation: 'setup-fade-in 500ms ease-out' }}
          >
            On prépare votre cabinet...
          </h2>

          {/* Checklist */}
          <div className="space-y-4 text-left inline-block">
            {items.map((item, idx) => (
              <div
                key={item}
                className="flex items-center gap-3"
                style={{
                  opacity: visibleItems.includes(idx) ? 1 : 0,
                  transform: visibleItems.includes(idx) ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 400ms ease-out, transform 400ms ease-out',
                }}
              >
                <span
                  className="inline-block text-lg"
                  style={{
                    transform: visibleItems.includes(idx) ? 'scale(1)' : 'scale(0)',
                    transition: 'transform 200ms ease-out',
                    transitionDelay: visibleItems.includes(idx) ? '200ms' : '0ms',
                  }}
                >
                  ✅
                </span>
                <span className="text-base" style={{ color: '#1A1A2E' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Error state */}
          {qrError && (
            <div className="mt-8">
              <p className="text-sm mb-3" style={{ color: '#D94040' }}>
                Erreur lors de la génération du QR code.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: '#1B7A4A' }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Waiting indicator if animation done but QR still loading */}
          {animDone && !qrReady && !qrError && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
              <span className="text-sm" style={{ color: '#888899' }}>Finalisation...</span>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes setup-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
