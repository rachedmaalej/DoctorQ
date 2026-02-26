import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface ActivationProgress {
  accountCreated: boolean;
  dashboardConfigured: boolean;
  qrDownloaded: boolean;
  firstPatientAdded: boolean;
  dismissed: boolean;
}

interface ActivationChecklistProps {
  onQrDownload?: () => void;
}

export default function ActivationChecklist({ onQrDownload }: ActivationChecklistProps) {
  const [progress, setProgress] = useState<ActivationProgress | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const data = await api.getActivationProgress();
      setProgress(data);

      if (data.dismissed) return;

      // Check if all done
      if (data.accountCreated && data.dashboardConfigured && data.qrDownloaded && data.firstPatientAdded) {
        setAllDone(true);
        setShowCompletion(true);
        // Auto-dismiss after 5 seconds
        setTimeout(async () => {
          setShowCompletion(false);
          try {
            await api.updateActivationProgress({ dismissed: true });
            setProgress((prev) => prev ? { ...prev, dismissed: true } : prev);
          } catch { /* ignore */ }
        }, 5000);
      }
    } catch {
      // Silently fail — don't block the dashboard
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Don't render if dismissed or not loaded
  if (!progress || progress.dismissed) return null;

  // Show completion message
  if (showCompletion) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border" style={{ borderColor: '#C3E6D0' }}>
        <p className="text-center font-semibold" style={{ color: '#1B7A4A' }}>
          Votre cabinet est opérationnel. ✦
        </p>
      </div>
    );
  }

  if (allDone) return null;

  const completedCount = [
    progress.accountCreated,
    progress.dashboardConfigured,
    progress.qrDownloaded,
    progress.firstPatientAdded,
  ].filter(Boolean).length;

  const progressPercent = (completedCount / 4) * 100;

  // Collapsed pill view
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="bg-white rounded-full px-4 py-2 shadow-sm border text-sm font-medium flex items-center gap-2 cursor-pointer"
        style={{ borderColor: '#C3E6D0', color: '#1B7A4A' }}
      >
        Démarrer avec BleSaf — {completedCount}/4
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>
    );
  }

  const items = [
    { label: 'Compte créé', done: progress.accountCreated },
    { label: 'Tableau de bord configuré', done: progress.dashboardConfigured },
    {
      label: 'Imprimer votre QR code',
      done: progress.qrDownloaded,
      action: progress.qrDownloaded ? undefined : onQrDownload,
      actionLabel: 'Télécharger',
    },
    { label: 'Ajouter votre premier patient', done: progress.firstPatientAdded },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: '#D0DDD6' }}>
      <h3 className="font-semibold text-base mb-2" style={{ color: '#1A1A2E' }}>
        Démarrer avec BleSaf
      </h3>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DDD6' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: '#1B7A4A',
              transition: 'width 400ms ease',
            }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: '#555566' }}>
          {completedCount} / 4 étapes
        </span>
      </div>

      {/* Checklist items */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            {item.done ? (
              <span className="text-base" style={{ color: '#1B7A4A' }}>✅</span>
            ) : (
              <span
                className="inline-block w-5 h-5 rounded border-2"
                style={{ borderColor: '#D0DDD6' }}
              />
            )}
            <span
              className={`text-sm flex-1 ${item.done ? 'line-through' : ''}`}
              style={{ color: item.done ? '#888899' : '#1A1A2E' }}
            >
              {item.label}
            </span>
            {item.action && (
              <button
                onClick={item.action}
                className="text-xs font-medium px-3 py-1 rounded-md"
                style={{
                  backgroundColor: '#E8F5EE',
                  color: '#1B7A4A',
                }}
              >
                {item.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Collapse button */}
      <div className="mt-4 text-right">
        <button
          onClick={() => setCollapsed(true)}
          className="text-sm cursor-pointer"
          style={{ color: '#888899' }}
        >
          Masquer ▲
        </button>
      </div>
    </div>
  );
}
