import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

interface ChecklistState {
  qrDisplayed: boolean;
  firstPatient: boolean;
  firstCall: boolean;
  dismissed: boolean;
}

interface FirstMorningChecklistProps {
  /** Number of patients currently in queue (or seen today) */
  hasPatients: boolean;
  /** Number of patients seen/called today */
  hasCalled: boolean;
  /** Callback when first patient milestone is hit */
  onFirstPatient?: () => void;
}

function getStorageKey(clinicId: string) {
  return `firstMorning_${clinicId}`;
}

function loadState(clinicId: string): ChecklistState {
  try {
    const raw = localStorage.getItem(getStorageKey(clinicId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { qrDisplayed: false, firstPatient: false, firstCall: false, dismissed: false };
}

function saveState(clinicId: string, state: ChecklistState) {
  localStorage.setItem(getStorageKey(clinicId), JSON.stringify(state));
}

export default function FirstMorningChecklist({ hasPatients, hasCalled, onFirstPatient }: FirstMorningChecklistProps) {
  const { t } = useTranslation();
  const { clinic } = useAuthStore();
  const [state, setState] = useState<ChecklistState>({ qrDisplayed: false, firstPatient: false, firstCall: false, dismissed: false });
  const [celebrateIndex, setCelebrateIndex] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (!clinic?.id) return;
    setState(loadState(clinic.id));
  }, [clinic?.id]);

  // Auto-complete "first patient" when queue has patients
  useEffect(() => {
    if (!clinic?.id || state.firstPatient) return;
    if (hasPatients) {
      setState(prev => {
        const next = { ...prev, firstPatient: true };
        saveState(clinic!.id, next);
        return next;
      });
      setCelebrateIndex(1);
      onFirstPatient?.();
      setTimeout(() => setCelebrateIndex(null), 1500);
    }
  }, [hasPatients, clinic?.id, state.firstPatient, onFirstPatient]);

  // Auto-complete "first call" when doctor has called a patient
  useEffect(() => {
    if (!clinic?.id || state.firstCall) return;
    if (hasCalled) {
      setState(prev => {
        const next = { ...prev, firstCall: true };
        saveState(clinic!.id, next);
        return next;
      });
      setCelebrateIndex(2);
      setTimeout(() => setCelebrateIndex(null), 1500);
    }
  }, [hasCalled, clinic?.id, state.firstCall]);

  const handleQrCheck = useCallback(() => {
    if (!clinic?.id) return;
    setState(prev => {
      const next = { ...prev, qrDisplayed: !prev.qrDisplayed };
      saveState(clinic!.id, next);
      return next;
    });
    if (!state.qrDisplayed) {
      setCelebrateIndex(0);
      setTimeout(() => setCelebrateIndex(null), 1500);
    }
  }, [clinic?.id, state.qrDisplayed]);

  const handleDismiss = useCallback(() => {
    if (!clinic?.id) return;
    setState(prev => {
      const next = { ...prev, dismissed: true };
      saveState(clinic!.id, next);
      return next;
    });
  }, [clinic?.id]);

  // Don't render if dismissed or no clinic
  if (!clinic?.id || state.dismissed) return null;

  // Don't render if all items are complete (auto-dismiss after a delay would be nice but keep it simple)
  const allComplete = state.qrDisplayed && state.firstPatient && state.firstCall;

  const items = [
    {
      icon: 'qr_code_2',
      label: t('firstMorning.qrPoster'),
      done: state.qrDisplayed,
      clickable: true,
      onClick: handleQrCheck,
    },
    {
      icon: 'person_add',
      label: t('firstMorning.firstPatient'),
      done: state.firstPatient,
      clickable: false,
    },
    {
      icon: 'directions_walk',
      label: t('firstMorning.firstCall'),
      done: state.firstCall,
      clickable: false,
    },
  ];

  const completedCount = items.filter(i => i.done).length;
  const progressPercent = (completedCount / items.length) * 100;

  return (
    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-sky-600 text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            rocket_launch
          </span>
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
            {t('firstMorning.title')}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label={t('common.close')}
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/60 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
              item.done
                ? 'bg-white/80'
                : 'bg-white/50'
            } ${item.clickable && !item.done ? 'cursor-pointer hover:bg-white/90' : ''} ${
              celebrateIndex === index ? 'ring-2 ring-green-400 ring-offset-1' : ''
            }`}
            onClick={item.clickable && !item.done ? item.onClick : undefined}
            role={item.clickable && !item.done ? 'button' : undefined}
            tabIndex={item.clickable && !item.done ? 0 : undefined}
          >
            {/* Checkbox circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                item.done
                  ? 'bg-green-500 text-white scale-110'
                  : 'border-2 border-gray-300 bg-white'
              } ${celebrateIndex === index ? 'animate-bounce' : ''}`}
            >
              {item.done && (
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                  check
                </span>
              )}
            </div>

            {/* Icon */}
            <span
              className={`material-symbols-outlined text-lg transition-colors ${
                item.done ? 'text-green-600' : 'text-sky-500'
              }`}
              style={{ fontVariationSettings: item.done ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span
              className={`text-sm font-medium transition-colors ${
                item.done ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}
            >
              {item.label}
            </span>

            {/* Tap hint for clickable items */}
            {item.clickable && !item.done && (
              <span className="text-xs text-sky-400 ltr:ml-auto rtl:mr-auto">{t('firstMorning.tapToConfirm')}</span>
            )}
          </div>
        ))}
      </div>

      {/* All done message */}
      {allComplete && (
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold text-green-600 mb-2">
            {t('firstMorning.allDone')}
          </p>
          <button
            onClick={handleDismiss}
            className="text-xs text-sky-600 hover:text-sky-800 font-medium underline"
          >
            {t('firstMorning.dismiss')}
          </button>
        </div>
      )}
    </div>
  );
}
