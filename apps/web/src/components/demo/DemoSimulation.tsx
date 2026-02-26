import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import '@/components/receptionist/receptionist.css';
import '@/components/blesaf/blesaf.css';

// ── Design Tokens (matches receptionist/DesktopDashboard inline tokens) ──

const CYCLE_DURATION = 30_000; // 30s total loop

// ── Fake patient data ────────────────────────────────────────────────────

interface DemoPatient {
  id: string;
  name: string;
  phone: string;
  waitMinutes: number;
  position: number;
  status: 'WAITING' | 'IN_CONSULTATION';
  badge: 'priority' | 'stepped-out' | 'no-phone' | null;
}

interface DemoCurrentPatient {
  name: string;
  arrivedAt: string;
  consultingSinceMinutes: number;
  phone: string;
}

const INITIAL_PATIENTS: DemoPatient[] = [
  { id: 'p1', name: 'Fatma Khaldi', phone: '+21698123456', waitMinutes: 32, position: 1, status: 'WAITING', badge: null },
  { id: 'p2', name: 'Mohamed Ben Ali', phone: '+21655432100', waitMinutes: 18, position: 2, status: 'WAITING', badge: null },
  { id: 'p3', name: 'Sarra Mansouri', phone: '', waitMinutes: 5, position: 3, status: 'WAITING', badge: 'no-phone' },
];

const NEW_PATIENT: DemoPatient = {
  id: 'p4', name: 'Youssef Trabelsi', phone: '+21623987654', waitMinutes: 0, position: 4, status: 'WAITING', badge: null,
};

const INITIAL_CURRENT: DemoCurrentPatient = {
  name: 'Amira Jaziri',
  arrivedAt: '09:15',
  consultingSinceMinutes: 8,
  phone: '+21697111222',
};

// ── Helper Components (mirrors receptionist sub-components exactly) ──────

function DemoHeader({
  waitingCount,
  seenCount,
  endEstimate,
}: {
  waitingCount: number;
  seenCount: number;
  endEstimate: string;
}) {
  return (
    <div>
      {/* Main Row */}
      <div className="flex items-center justify-between px-5 py-1.5 bg-bs-surface border-b border-bs-border">
        <span
          className="text-bs-text-primary font-bold truncate mr-2"
          style={{ fontSize: 16, letterSpacing: '-0.02em' }}
        >
          Cabinet Dr Skander
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex items-center gap-1.5 rounded-full"
            style={{
              padding: '4px 10px 4px 7px',
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#EDF7F0',
              color: '#2D8B4E',
              border: '1px solid rgba(45,139,78,0.15)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#2D8B4E' }}
            />
            <span>Présent</span>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-5 pt-1.5 pb-2">
        <div className="flex gap-2">
          {/* Chip 1 — highlighted */}
          <div
            className="flex-1 bg-bs-accent-light text-center rounded-bs-sm py-1.5 px-2"
            style={{ border: '1px solid rgba(15,123,108,0.15)' }}
          >
            <div
              className="text-bs-accent font-bold leading-none"
              style={{ fontSize: 20, letterSpacing: '-0.03em' }}
            >
              {waitingCount}
            </div>
            <div
              className="text-bs-text-tertiary font-medium mt-[2px] uppercase"
              style={{ fontSize: 9, letterSpacing: '0.04em' }}
            >
              En attente
            </div>
          </div>
          {/* Chip 2 */}
          <div className="flex-1 bg-bs-surface border border-bs-border text-center rounded-bs-sm py-1.5 px-2">
            <div
              className="text-bs-text-primary font-bold leading-none"
              style={{ fontSize: 20, letterSpacing: '-0.03em' }}
            >
              {seenCount}
            </div>
            <div
              className="text-bs-text-tertiary font-medium mt-[2px] uppercase"
              style={{ fontSize: 9, letterSpacing: '0.04em' }}
            >
              Vus
            </div>
          </div>
          {/* Chip 3 */}
          <div className="flex-1 bg-bs-surface border border-bs-border text-center rounded-bs-sm py-1.5 px-2">
            <div
              className="text-bs-text-primary font-bold leading-none"
              style={{ fontSize: 20, letterSpacing: '-0.03em' }}
            >
              {endEstimate}
            </div>
            <div
              className="text-bs-text-tertiary font-medium mt-[2px] uppercase"
              style={{ fontSize: 9, letterSpacing: '0.04em' }}
            >
              Fin estimée
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoQuickAdd() {
  return (
    <div className="mx-5 flex gap-2 items-center">
      <input
        type="text"
        readOnly
        placeholder="Ajouter un patient..."
        className="flex-1 h-12 bg-bs-surface rounded-bs px-4 text-bs-text-primary outline-none placeholder:text-bs-text-tertiary"
        style={{ fontSize: 15, border: '1.5px solid #E8E6DF', fontFamily: 'inherit' }}
      />
      <div
        className="w-12 h-12 rounded-bs text-white flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#0F7B6C' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>person_add</span>
      </div>
    </div>
  );
}

function DemoSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex justify-between items-center px-5 pt-[18px] pb-2">
      <span
        className="text-bs-text-tertiary font-semibold uppercase"
        style={{ fontSize: 13, letterSpacing: '0.06em' }}
      >
        {title}
      </span>
    </div>
  );
}

function DemoCurrentPatientCard({
  patient,
  isCallingNext,
  onCallNext,
}: {
  patient: DemoCurrentPatient;
  isCallingNext: boolean;
  onCallNext: () => void;
}) {
  return (
    <div
      className="bs-cp-card mx-5 rounded-bs p-4 text-white relative overflow-hidden"
      style={{ backgroundColor: '#0F7B6C' }}
    >
      <div
        className="uppercase font-semibold opacity-70 mb-1.5"
        style={{ fontSize: 11, letterSpacing: '0.08em' }}
      >
        En consultation
      </div>
      <div className="font-bold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
        {patient.name}
      </div>
      <div className="opacity-70 mt-0.5" style={{ fontSize: 13 }}>
        Arrivé à {patient.arrivedAt} · {patient.consultingSinceMinutes} min
      </div>
      <div className="flex gap-2 mt-3.5">
        <button
          onClick={onCallNext}
          disabled={isCallingNext}
          className="h-9 px-3.5 rounded-full font-semibold flex items-center gap-1.5 transition-all duration-150 active:opacity-90"
          style={{
            fontSize: 13,
            backgroundColor: isCallingNext ? 'rgba(255,255,255,0.7)' : '#fff',
            color: '#0F7B6C',
            border: '1.5px solid #fff',
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
          >
            {isCallingNext ? 'hourglass_empty' : 'check_circle'}
          </span>
          {isCallingNext ? 'Appel...' : 'Terminer'}
        </button>
        <button
          className="h-9 px-3.5 rounded-full text-white font-semibold flex items-center transition-all duration-150"
          style={{
            fontSize: 13,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>phone</span>
        </button>
      </div>
    </div>
  );
}

function getWaitDotColor(minutes: number): string {
  if (minutes <= 20) return 'bg-bs-green';
  if (minutes <= 45) return 'bg-bs-amber';
  return 'bg-bs-red';
}

function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function DemoQueueItem({
  patient,
  isFirst,
  isLast,
  isNew,
}: {
  patient: DemoPatient;
  isFirst: boolean;
  isLast: boolean;
  isNew: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 py-3 relative transition-all duration-500',
        !isLast && 'border-b border-bs-border',
        isNew && 'animate-bs-slide-in',
      )}
    >
      {/* Position circle */}
      <div
        className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold',
          isFirst ? 'bg-bs-accent-light text-bs-accent' : 'bg-bs-surface-alt text-bs-text-secondary',
        )}
        style={{ fontSize: 13 }}
      >
        {patient.position}
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0">
        <div className="text-bs-text-primary font-semibold truncate" style={{ fontSize: 15 }}>
          {patient.name}
        </div>
        <div className="flex items-center gap-1.5 mt-px" style={{ fontSize: 12, color: '#9E9B90' }}>
          <span className={clsx('w-[7px] h-[7px] rounded-full shrink-0', getWaitDotColor(patient.waitMinutes))} />
          <span>
            {formatWaitTime(patient.waitMinutes)}
            {patient.phone && ' · \u{1F4F1}'}
          </span>
        </div>
      </div>

      {/* Badge */}
      {patient.badge === 'no-phone' && (
        <span
          className="shrink-0 rounded-full px-2 py-[3px] uppercase bg-bs-surface-alt text-bs-text-tertiary"
          style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}
        >
          Sans tél.
        </span>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 shrink-0">
        <div
          className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center text-bs-text-tertiary',
            !patient.phone && 'opacity-20',
          )}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>phone</span>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-bs-text-tertiary">
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>more_vert</span>
        </div>
      </div>
    </div>
  );
}

function DemoQueueList({
  patients,
  newPatientId,
}: {
  patients: DemoPatient[];
  newPatientId: string | null;
}) {
  return (
    <div className="px-5 flex flex-col gap-0.5">
      {patients.map((patient, i) => (
        <DemoQueueItem
          key={patient.id}
          patient={patient}
          isFirst={i === 0}
          isLast={i === patients.length - 1}
          isNew={patient.id === newPatientId}
        />
      ))}
    </div>
  );
}

function DemoFloatingCTA({
  nextName,
  disabled,
}: {
  nextName: string;
  disabled: boolean;
}) {
  return (
    <div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full"
      style={{
        padding: '12px 20px 24px',
        background: 'linear-gradient(to top, #F6F5F0 60%, transparent)',
      }}
    >
      <div
        className={clsx(
          'w-full h-14 border-none rounded-2xl text-white font-bold flex items-center justify-center gap-2.5 relative overflow-hidden',
          disabled && 'opacity-50',
          !disabled && 'bs-cta-accent',
        )}
        style={{
          fontSize: 16,
          fontFamily: 'inherit',
          backgroundColor: '#0F7B6C',
          boxShadow: disabled ? 'none' : '0 6px 28px rgba(15,123,108,0.45), 0 2px 8px rgba(15,123,108,0.3)',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_forward</span>
        Appeler Suivant
        {nextName && (
          <span className="font-normal opacity-80" style={{ fontSize: 14 }}>
            {'· '}{nextName}
          </span>
        )}
      </div>
    </div>
  );
}

function DemoWhatsAppBadge({ visible }: { visible: boolean }) {
  return (
    <div
      className={clsx(
        'absolute top-2 right-3 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-bs-md transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
      )}
      style={{
        backgroundColor: '#25D366',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        className="material-symbols-rounded"
        style={{
          fontSize: 16,
          animation: visible ? 'bs-pulse-dot 1.5s ease infinite' : 'none',
        }}
      >
        chat
      </span>
      Notification envoyée
    </div>
  );
}

// ── Main Demo Simulation ─────────────────────────────────────────────────

export default function DemoSimulation() {
  const [patients, setPatients] = useState<DemoPatient[]>(INITIAL_PATIENTS);
  const [currentPatient, setCurrentPatient] = useState<DemoCurrentPatient>(INITIAL_CURRENT);
  const [seenCount, setSeenCount] = useState(7);
  const [newPatientId, setNewPatientId] = useState<string | null>(null);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  // Compute derived stats
  const waitingCount = patients.length;
  const avgConsult = 10;
  const now = new Date();
  const totalMins = waitingCount * avgConsult;
  const endTime = new Date(now.getTime() + totalMins * 60000);
  const endEstimate = `~${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    // Reset state for each cycle
    setPatients(INITIAL_PATIENTS);
    setCurrentPatient(INITIAL_CURRENT);
    setSeenCount(7);
    setNewPatientId(null);
    setIsCallingNext(false);
    setShowWhatsApp(false);

    // ── t=5s: New patient scans QR and appears ──
    addTimer(() => {
      setPatients(prev => [...prev, { ...NEW_PATIENT, waitMinutes: 0 }]);
      setNewPatientId('p4');
      // Clear "new" animation after it plays
      addTimer(() => setNewPatientId(null), 600);
    }, 5000);

    // ── t=12s: Doctor taps "Call Next" ──
    addTimer(() => {
      setIsCallingNext(true);

      // After 800ms transition: shift queue
      addTimer(() => {
        setIsCallingNext(false);
        // Fatma K. moves into consultation, Amira is done
        setCurrentPatient({
          name: 'Fatma Khaldi',
          arrivedAt: '09:23',
          consultingSinceMinutes: 0,
          phone: '+21698123456',
        });
        setSeenCount(8);
        setPatients(prev => {
          const remaining = prev.filter(p => p.id !== 'p1');
          return remaining.map((p, i) => ({ ...p, position: i + 1 }));
        });
      }, 800);
    }, 12000);

    // ── t=20s: WhatsApp notification badge pulses ──
    addTimer(() => {
      setShowWhatsApp(true);
      // Hide after 5s
      addTimer(() => setShowWhatsApp(false), 5000);
    }, 20000);

    // ── t=30s: Loop the cycle ──
    addTimer(() => {
      setCycleKey(k => k + 1);
    }, CYCLE_DURATION);

    return clearTimers;
  }, [cycleKey, addTimer, clearTimers]);

  // Increment wait times every ~15s for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => prev.map(p => ({ ...p, waitMinutes: p.waitMinutes + 1 })));
    }, 15000);
    return () => clearInterval(interval);
  }, [cycleKey]);

  const nextName = patients.length > 0
    ? patients[0].name.split(' ').slice(0, 1).join('') + ' ' + (patients[0].name.split(' ')[1]?.[0] ?? '') + '.'
    : '';

  return (
    <div
      className="relative w-full max-w-[375px] mx-auto overflow-hidden rounded-2xl border border-bs-border shadow-bs-lg"
      style={{
        background: '#F6F5F0',
        fontFamily: "'DM Sans', 'IBM Plex Sans Arabic', sans-serif",
        height: 680,
      }}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden pb-[100px]" style={{ scrollbarWidth: 'none' }}>
        <DemoHeader
          waitingCount={waitingCount}
          seenCount={seenCount}
          endEstimate={endEstimate}
        />
        <DemoQuickAdd />

        <DemoSectionHeader title="En consultation" />
        <DemoCurrentPatientCard
          patient={currentPatient}
          isCallingNext={isCallingNext}
          onCallNext={() => {}}
        />

        {patients.length > 0 && (
          <>
            <DemoSectionHeader title="File d'attente" />
            <DemoQueueList patients={patients} newPatientId={newPatientId} />
          </>
        )}
      </div>

      <DemoFloatingCTA
        nextName={nextName}
        disabled={patients.length === 0}
      />

      <DemoWhatsAppBadge visible={showWhatsApp} />
    </div>
  );
}
