import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { trackOnboarding, EVENTS } from '../hooks/useOnboardingAnalytics';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { downloadQrCodePdf } from '@/utils/qrCodePdf';
import QRCode from 'qrcode';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  action?: () => void;
}

/**
 * Getting Started Widget — floating bottom-left checklist.
 * 3 items: queue open, share QR, call first patient.
 * Dismisses on 3/3 completion with confetti.
 */
export default function GettingStartedWidget() {
  const { clinic } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [qrShared, setQrShared] = useState(false);

  const clinicId = clinic?.id ?? '';
  const clinicName = clinic?.name ?? '';
  const checkinUrl = `https://${webBrand.domain}/checkin/${clinicId}`;

  // Check if widget was already dismissed
  useEffect(() => {
    if (localStorage.getItem('blesaf_getting_started_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleShareQr = useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 440,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      });
      await downloadQrCodePdf(dataUrl, clinicName);
      await api.updateActivationProgress({ qrDownloaded: true });
    } catch {
      // Non-blocking
    }
    setQrShared(true);
    trackOnboarding(EVENTS.CHECKLIST_ITEM_DONE, { item: 'share_qr' });
  }, [checkinUrl, clinicName]);

  const queueOpen = clinic?.isDoctorPresent ?? false;

  // Track first-patient-called locally (persisted in localStorage)
  const [firstPatientCalled, setFirstPatientCalled] = useState(
    () => localStorage.getItem('blesaf_first_patient_called') === 'true',
  );

  // Listen for queue activity to detect first patient call
  useEffect(() => {
    if (firstPatientCalled) return;
    const handler = () => {
      setFirstPatientCalled(true);
      localStorage.setItem('blesaf_first_patient_called', 'true');
      trackOnboarding(EVENTS.CHECKLIST_ITEM_DONE, { item: 'first_patient' });
    };
    window.addEventListener('blesaf:patient-called', handler);
    return () => window.removeEventListener('blesaf:patient-called', handler);
  }, [firstPatientCalled]);

  const items: ChecklistItem[] = [
    {
      id: 'queue_open',
      label: "File d'attente ouverte",
      done: queueOpen,
    },
    {
      id: 'share_qr',
      label: 'Partager votre QR Code',
      done: qrShared,
      action: handleShareQr,
    },
    {
      id: 'first_patient',
      label: 'Appeler votre premier patient',
      done: firstPatientCalled,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  // Auto-dismiss on all complete
  useEffect(() => {
    if (allDone && !dismissed) {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { x: 0.15, y: 0.85 },
        colors: ['#1B6B45', '#F4A261', '#A8D5C2'],
      });
      trackOnboarding(EVENTS.CHECKLIST_COMPLETED);

      const timer = setTimeout(() => {
        setDismissed(true);
        localStorage.setItem('blesaf_getting_started_dismissed', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 left-6 z-50 w-[320px] rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        style={{ backgroundColor: 'var(--ob-card-bg)', fontFamily: 'var(--ob-font)' }}
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', delay: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px]" role="img" aria-label="rocket">🚀</span>
            <span
              className="text-[15px] font-semibold"
              style={{ color: 'var(--ob-brand-text)' }}
            >
              Premiers pas
            </span>
          </div>
          <span
            className="text-[13px] font-medium"
            style={{ color: 'var(--ob-brand-subtle)' }}
          >
            {doneCount}/{items.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-5 mb-3 h-[3px] rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--ob-brand-primary)' }}
            initial={false}
            animate={{ width: `${(doneCount / items.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Checklist */}
        <div className="border-t border-gray-100">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3 ${
                item.action && !item.done ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={item.action && !item.done ? item.action : undefined}
            >
              {item.done ? (
                <motion.span
                  className="flex-shrink-0 text-[16px]"
                  style={{ color: 'var(--ob-brand-primary)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  &#10003;
                </motion.span>
              ) : (
                <span className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300" />
              )}
              <span
                className={`text-[13px] ${item.done ? 'line-through opacity-50' : ''}`}
                style={{
                  fontFamily: 'var(--ob-font)',
                  color: 'var(--ob-brand-text)',
                }}
              >
                {item.label}
              </span>
              {item.action && !item.done && (
                <span className="ml-auto text-[12px]" style={{ color: 'var(--ob-brand-primary)' }}>
                  &rarr;
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
