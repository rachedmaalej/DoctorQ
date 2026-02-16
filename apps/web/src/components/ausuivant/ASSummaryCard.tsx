import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface RecapData {
  totalPatients: number;
  avgWaitMins: number | null;
  endTime: string | null;
  improvement: number | null;
}

export default function ASSummaryCard() {
  const { clinic } = useAuthStore();
  const [data, setData] = useState<RecapData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!clinic?.id) return;

    // Check if already dismissed today
    const key = `as_summary_dismissed_${clinic.id}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) {
      setDismissed(true);
      return;
    }

    api.getDailyRecap()
      .then((recap) => {
        if (recap?.yesterday) {
          setData({
            totalPatients: recap.yesterday.totalPatients || 0,
            avgWaitMins: recap.yesterday.avgWaitMins,
            endTime: null,
            improvement: recap.trends?.avgWait?.vsPrevDay ?? null,
          });
        }
      })
      .catch(() => {});
  }, [clinic?.id]);

  if (dismissed || !data || data.totalPatients === 0) return null;

  const handleDismiss = () => {
    if (clinic?.id) {
      const key = `as_summary_dismissed_${clinic.id}`;
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(key, today);
    }
    setDismissed(true);
  };

  // Format yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateLabel = `Hier — ${dayNames[yesterday.getDay()]} ${yesterday.getDate()} ${monthNames[yesterday.getMonth()]}`;

  return (
    <div className="as-fade-up as-fade-up-8">
      {/* Section Header */}
      <div style={{ padding: '20px 20px 10px' }}>
        <span
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'var(--text-tertiary)',
            fontWeight: 600,
          }}
        >
          Bilan
        </span>
      </div>

      {/* Dark card */}
      <div
        className="relative overflow-hidden"
        style={{
          margin: '0 20px 12px',
          padding: 16,
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2B28 100%)',
          borderRadius: 'var(--radius)',
          color: 'white',
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            top: -30,
            right: -30,
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
            {dateLabel}
          </span>
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center"
            aria-label="Fermer le bilan"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-6">
          <div>
            <div className="font-fraunces" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.1 }}>
              {data.totalPatients}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>patients vus</div>
          </div>
          <div>
            <div className="font-fraunces" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.1 }}>
              {data.avgWaitMins != null ? `${data.avgWaitMins} min` : '—'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>attente moyenne</div>
          </div>
          {data.endTime && (
            <div>
              <div className="font-fraunces" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.1 }}>
                {data.endTime}
              </div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>fin de journée</div>
            </div>
          )}
        </div>

        {/* Improvement footer */}
        {data.improvement != null && data.improvement !== 0 && (
          <div
            className="relative flex items-center gap-2"
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              style={{
                background: 'rgba(27,107,74,0.3)',
                color: '#7DD3A8',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              {data.improvement < 0 ? '↓' : '↑'} {Math.abs(data.improvement)}%
            </span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              d&apos;attente vs. semaine précédente
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
