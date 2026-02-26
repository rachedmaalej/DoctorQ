import { useState, useEffect, useCallback } from 'react';

interface PatientSimulationProps {
  onComplete?: () => void;
}

export default function PatientSimulation({ onComplete }: PatientSimulationProps) {
  const [stage, setStage] = useState<
    'idle' | 'scanning' | 'flash' | 'patient' | 'pulse' | 'success' | 'subtitle' | 'done'
  >('idle');
  const [isReplaying, setIsReplaying] = useState(false);

  const runSimulation = useCallback(() => {
    setStage('idle');
    const timers: ReturnType<typeof setTimeout>[] = [];

    // t=1500ms: Phone icon scans QR
    timers.push(setTimeout(() => setStage('scanning'), 1500));
    // t=2100ms: Flash on QR
    timers.push(setTimeout(() => setStage('flash'), 2100));
    // t=2300ms: Patient card appears
    timers.push(setTimeout(() => setStage('patient'), 2300));
    // t=2800ms: Patient card pulse
    timers.push(setTimeout(() => setStage('pulse'), 2800));
    // t=3200ms: Success message
    timers.push(setTimeout(() => setStage('success'), 3200));
    // t=3800ms: Subtitle
    timers.push(setTimeout(() => setStage('subtitle'), 3800));
    // t=4000ms: Done
    timers.push(setTimeout(() => {
      setStage('done');
      setIsReplaying(false);
      onComplete?.();
    }, 4000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    const cleanup = runSimulation();
    return cleanup;
  }, [runSimulation]);

  const handleReplay = () => {
    setIsReplaying(true);
    runSimulation();
  };

  const showPhone = stage !== 'idle';
  const showFlash = stage === 'flash';
  const showPatient = ['patient', 'pulse', 'success', 'subtitle', 'done'].includes(stage);
  const showPulse = stage === 'pulse';
  const showSuccess = ['success', 'subtitle', 'done'].includes(stage);
  const showSubtitle = ['subtitle', 'done'].includes(stage);
  const isDone = stage === 'done';

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <p className="text-sm mb-4" style={{ color: '#888899' }}>
        Voici ce que vos patients vivront.
      </p>

      {/* Phone mockup */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '300px',
          height: '520px',
          border: '2px solid #D0DDD6',
          borderRadius: '32px',
          backgroundColor: '#F4F7F5',
        }}
      >
        {/* Phone notch */}
        <div
          className="mx-auto mt-2 rounded-full"
          style={{ width: '80px', height: '6px', backgroundColor: '#D0DDD6' }}
        />

        {/* Phone content */}
        <div className="p-4 mt-4">
          {/* Idle state */}
          {!showPatient && (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#1B7A4A',
                    animation: 'sim-pulse-dot 1.5s ease-in-out infinite',
                  }}
                />
                <p className="text-sm" style={{ color: '#888899' }}>
                  En attente d&apos;un patient...
                </p>
              </div>
            </div>
          )}

          {/* Patient card */}
          {showPatient && (
            <div
              className="bg-white rounded-lg p-4 shadow-sm"
              style={{
                borderLeft: '4px solid #1B7A4A',
                animation: showPulse
                  ? 'sim-card-pulse 300ms ease-out'
                  : 'sim-card-enter 400ms ease-out forwards',
              }}
            >
              <p className="font-semibold text-base" style={{ color: '#1A1A2E' }}>
                Ahmed Ben Ali
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: '#555566' }}>
                <span>🕐 {timeStr}</span>
                <span>•</span>
                <span>Position #1</span>
              </div>
              <p className="text-sm mt-2" style={{ color: '#888899' }}>
                En attente de consultation
              </p>
            </div>
          )}
        </div>

        {/* Phone scanning animation */}
        {showPhone && !showPatient && (
          <div
            className="absolute"
            style={{
              top: '40%',
              right: '-20px',
              animation: 'sim-phone-scan 600ms ease-out forwards',
              fontSize: '24px',
            }}
          >
            📱
          </div>
        )}

        {/* Flash overlay */}
        {showFlash && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'white',
              animation: 'sim-flash 200ms ease-out forwards',
              borderRadius: '32px',
            }}
          />
        )}
      </div>

      {/* Success message below phone */}
      <div className="mt-4 text-center min-h-16">
        {showSuccess && (
          <p
            className="font-semibold text-lg"
            style={{
              color: '#1B7A4A',
              animation: 'sim-fade-in 400ms ease-out',
            }}
          >
            ✦ Votre premier patient vient de s&apos;inscrire seul.
          </p>
        )}
        {showSubtitle && (
          <p
            className="text-sm mt-1"
            style={{
              color: '#888899',
              animation: 'sim-fade-in 400ms ease-out',
            }}
          >
            Votre essai de 30 jours est actif.
          </p>
        )}
      </div>

      {/* Replay link */}
      {isDone && !isReplaying && (
        <button
          onClick={handleReplay}
          className="mt-2 text-sm underline cursor-pointer"
          style={{ color: '#888899' }}
        >
          Revoir la simulation
        </button>
      )}

      {/* Animations */}
      <style>{`
        @keyframes sim-pulse-dot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes sim-phone-scan {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(-40px); opacity: 1; }
        }
        @keyframes sim-flash {
          0% { opacity: 0; }
          30% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes sim-card-enter {
          from { transform: translateX(-16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes sim-card-pulse {
          0% { transform: scale(1.0); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1.0); }
        }
        @keyframes sim-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
