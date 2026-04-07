import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io, type Socket } from 'socket.io-client';
import { useCheckInStore } from '@/stores/checkInStore';
import { webBrand } from '@/lib/brand';
import type {
  PublicQueueSnapshot,
  CheckInPayload,
  CheckInResponse,
} from '@/types/checkin';

// ─── API helpers ────────────────────────────────────────

function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const h = window.location.hostname;
  if (h.includes('web-zeta-five-39') || h.includes('blesaf'))
    return 'https://doctorqapi-production-ac8b.up.railway.app';
  if (h.includes('ausuivant'))
    return 'https://ausuivant-api-production-production.up.railway.app';
  return 'http://localhost:3001';
}

const API = getApiBase();

// ─── Phone formatting ───────────────────────────────────

function displayPhone(raw: string): string {
  // FR: "6 12 34 56 78" (groups of 1+2+2+2+2)
  if (webBrand.country === 'FR') {
    if (raw.length <= 1) return raw;
    if (raw.length <= 3) return `${raw.slice(0, 1)} ${raw.slice(1)}`;
    if (raw.length <= 5) return `${raw.slice(0, 1)} ${raw.slice(1, 3)} ${raw.slice(3)}`;
    if (raw.length <= 7) return `${raw.slice(0, 1)} ${raw.slice(1, 3)} ${raw.slice(3, 5)} ${raw.slice(5)}`;
    return `${raw.slice(0, 1)} ${raw.slice(1, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`;
  }
  // TN: "XX XXX XXX" (groups of 2+3+3)
  if (raw.length <= 2) return raw;
  if (raw.length <= 5) return `${raw.slice(0, 2)} ${raw.slice(2)}`;
  return `${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5)}`;
}

// ─── TopBar ─────────────────────────────────────────────

function TopBar({
  clinicName,
  specialty,
  isOnline,
}: {
  clinicName: string;
  specialty: string;
  isOnline: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-black/[.06] sticky top-0 z-20">
      <div className="w-10 h-10 rounded-xl bg-[#356B58] flex items-center justify-center shrink-0">
        <span className="material-symbols-rounded text-white text-[20px]">medical_services</span>
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-[#1B2D25] font-['Sora'] truncate">
          {clinicName}
        </div>
        {specialty && (
          <div className="text-[11px] text-[#aaa] font-['DM_Sans'] truncate">{specialty}</div>
        )}
      </div>
      {isOnline && (
        <div className="ml-auto flex items-center gap-1.5 bg-[#E8F5EE] text-[#356B58] text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t('checkin.live_badge')}
        </div>
      )}
    </div>
  );
}

// ─── LiveQueueCard (Compact Banner + Open Door) ────────

function LiveQueueCard({ snapshot }: { snapshot: PublicQueueSnapshot }) {
  const { t } = useTranslation();
  const ahead = snapshot.waitingCount;
  const position = ahead + 1;
  const estMinutes = Math.max(1, ahead * snapshot.avgConsultMinutes);
  const totalSegments = Math.max(position, 2);

  return (
    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,.05)] mb-3">
      <div className="px-[18px] py-[14px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-[#1B2D25] font-['Sora']">
            {t('checkin.queue_title')}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#356B58]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('checkin.live_label')}
          </span>
        </div>

        {/* Banner: position block + wait time */}
        <div className="flex items-center gap-3.5 mb-3.5">
          {/* Position block */}
          <div className="w-[60px] h-[60px] bg-[#356B58] rounded-[14px] flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-normal text-white/60 font-['Sora'] leading-none">#</span>
            <span className="text-[30px] font-semibold text-white font-['Sora'] leading-none tracking-tight">{position}</span>
          </div>
          {/* Wait time */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] font-light text-[#1B2D25] font-['Sora'] leading-none tracking-tight">~{estMinutes}</span>
              <span className="text-[12px] font-medium text-[#888]">min</span>
            </div>
            <div className="text-[10px] text-[#aaa] mt-1">{t('checkin.wait_estimate')}</div>
          </div>
        </div>

        {/* Progress bar: YOU (left) → waiting → CONSULTING/door (right) */}
        <div>
          {/* Direction arrow */}
          <div className="flex justify-center mb-1">
            <svg width="40" height="6" viewBox="0 0 40 6" fill="none" className="opacity-40">
              <path d="M2 3h34M33 1l3 2-3 2" stroke="#aaa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Bar row: avatar → segments → door icon */}
          <div className="flex items-center gap-1.5">
            {/* You avatar */}
            <div className="w-[22px] h-[22px] rounded-full border-[2.5px] border-dashed border-[#356B58] flex items-center justify-center shrink-0 animate-you-pulse">
              <span className="text-[9px] font-bold text-[#356B58] font-['Sora']">?</span>
            </div>
            {/* Segments */}
            <div className="flex-1 flex items-center gap-[2px]">
              {Array.from({ length: totalSegments }, (_, i) => {
                const isYou = i === 0;
                const isConsult = i === totalSegments - 1;
                return (
                  <div
                    key={i}
                    className={
                      isYou
                        ? 'flex-1 h-[5px] rounded-[3px] bg-[#356B58] shadow-[0_0_0_2px_rgba(53,107,88,0.12)]'
                        : isConsult
                          ? 'flex-1 h-[5px] rounded-[3px] bg-[#356B58]'
                          : 'flex-1 h-[5px] rounded-[3px] bg-[#EAECE6]'
                    }
                    style={{ minWidth: isYou ? 6 : undefined }}
                  />
                );
              })}
            </div>
            {/* Door icon */}
            <span className="material-symbols-rounded text-[22px] text-[#356B58] shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
              meeting_room
            </span>
          </div>
          {/* Labels */}
          <div className="flex items-center justify-between mt-1.5 px-[1px]">
            <span className="text-[9px] font-semibold text-[#356B58]">{t('checkin.you_label')}</span>
            <span className="text-[9px] font-medium text-[#aaa]">{t('checkin.in_consult_label')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NameCard ───────────────────────────────────────────

function NameCard({
  value,
  onChange,
  hasError,
  cardRef,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  cardRef: React.Ref<HTMLDivElement>;
}) {
  const { t } = useTranslation();
  return (
    <div ref={cardRef} className="bg-white rounded-[20px] p-5 mb-3 shadow-[0_2px_12px_rgba(0,0,0,.05)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-[22px] h-[22px] rounded-full bg-[#356B58] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          1
        </span>
        <span className="text-[15px] font-semibold text-[#1B2D25]">{t('checkin.name_title')}</span>
      </div>
      <div
        className={`flex items-center gap-3 px-4 py-3.5 border-[1.5px] rounded-[14px] transition-all duration-200 ${
          hasError
            ? 'border-red-300 bg-red-50 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,.12)]'
            : 'border-[#356B58]/15 bg-[#fafafa] focus-within:border-[#356B58] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(53,107,88,.08)]'
        }`}
      >
        <span className="material-symbols-rounded text-[20px] text-[#ccc]">person_outline</span>
        <input
          type="text"
          autoComplete="name"
          inputMode="text"
          placeholder={t('checkin.name_placeholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-['Sora'] text-[15px] text-[#1B2D25] placeholder:text-[#ccc] placeholder:font-light"
        />
      </div>
      {hasError && (
        <p className="mt-2 text-[12px] text-red-500 flex items-center gap-1">
          <span className="material-symbols-rounded text-[13px]">error</span>
          {t('checkin.name_required')}
        </p>
      )}
    </div>
  );
}

// ─── PhoneCard ──────────────────────────────────────────

function PhoneCard({
  rawPhone,
  digitCount,
  onChange,
}: {
  rawPhone: string;
  digitCount: number;
  onChange: (raw: string) => void;
}) {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, webBrand.phone.localDigits);
    onChange(raw);
  };

  return (
    <div className="bg-white rounded-[20px] p-5 mb-3 shadow-[0_2px_12px_rgba(0,0,0,.05)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-[22px] h-[22px] rounded-full bg-[#356B58] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          2
        </span>
        <span className="text-[15px] font-semibold text-[#1B2D25]">{t('checkin.phone_title')}</span>
        <span className="text-[11px] font-normal text-[#bbb] ml-1">{t('checkin.optional')}</span>
      </div>
      <div className="flex items-center border-[1.5px] border-[#356B58]/15 rounded-[14px] bg-[#fafafa] overflow-hidden transition-all duration-200 focus-within:border-[#356B58] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(53,107,88,.08)]">
        <div className="px-3.5 py-3.5 bg-[#356B58]/[.08] text-[15px] font-semibold text-[#356B58] border-r border-[#356B58]/10 shrink-0">
          {webBrand.phone.countryCode}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder={webBrand.country === 'FR' ? '6 12 34 56 78' : 'XX XXX XXX'}
          maxLength={webBrand.phone.localDigits + 4}
          autoComplete="tel-national"
          value={displayPhone(rawPhone)}
          onChange={handleChange}
          className="flex-1 px-3.5 py-3.5 bg-transparent border-none outline-none font-['Sora'] text-[15px] text-[#1B2D25] tracking-[.06em] placeholder:text-[#ccc] placeholder:font-light placeholder:tracking-normal"
        />
        <div className="px-3.5 text-[11px] font-semibold text-[#356B58] bg-[#356B58]/[.08] self-stretch flex items-center border-l border-[#356B58]/10">
          {digitCount}/{webBrand.phone.localDigits}
        </div>
      </div>
      <p className="text-[11px] text-[#bbb] mt-2 font-['DM_Sans']">{t('checkin.phone_hint')}</p>
    </div>
  );
}

// ─── FixedCTA ───────────────────────────────────────────

function FixedCTA({
  nextPosition,
  isSubmitting,
  onSubmit,
}: {
  nextPosition: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
      <div className="max-w-sm mx-auto">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-[17px] bg-[#356B58] text-white rounded-2xl font-['Sora'] text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform duration-150 disabled:opacity-60 disabled:pointer-events-none"
          style={{ paddingBottom: 'calc(17px + env(safe-area-inset-bottom, 0px))' }}
        >
          {isSubmitting ? (
            <span className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <span className="material-symbols-rounded text-[18px]">queue</span>
          )}
          {t('checkin.cta', { n: nextPosition })}
        </button>
      </div>
    </div>
  );
}

// ─── SuccessOverlay ─────────────────────────────────────

function SuccessOverlay({
  result,
  snapshot,
}: {
  result: CheckInResponse;
  snapshot: PublicQueueSnapshot | null;
}) {
  const { t } = useTranslation();

  const liveEstimate = snapshot
    ? Math.max(1, (result.position - 1) * snapshot.avgConsultMinutes)
    : result.estimatedWaitMinutes;

  // Show range when available
  const hasRange = result.minWaitMins != null && result.maxWaitMins != null && result.minWaitMins !== result.maxWaitMins;
  const rangeMin = result.minWaitMins ?? liveEstimate;
  const rangeMax = result.maxWaitMins ?? liveEstimate;

  // Progress bar
  const totalSlots = Math.max(result.totalInQueue + 2, 8);
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const slotPos = i + 1;
    if (slotPos < result.position) return 'done';
    if (slotPos === result.position) return 'you';
    return 'empty';
  });

  return (
    <div className="absolute inset-0 z-50 bg-[#EAECE6] flex flex-col items-center pt-[80px] px-6 pb-10 animate-ci-slide-up overflow-y-auto">
      {/* Check circle */}
      <div className="w-24 h-24 rounded-full bg-[#356B58] flex items-center justify-center mb-5 shadow-[0_0_0_12px_rgba(53,107,88,.15),0_0_0_24px_rgba(53,107,88,.06)] shrink-0">
        <span className="material-symbols-rounded text-[44px] text-white">check</span>
      </div>

      <h1 className="text-[24px] font-semibold text-[#1B2D25] text-center mb-1.5 font-['Sora']">
        {t('checkin.success_title', { n: result.position })}
      </h1>
      <p className="text-[14px] text-[#888] text-center mb-7 font-['DM_Sans'] leading-relaxed whitespace-pre-line">
        {t('checkin.success_sub')}
      </p>

      {/* Position card */}
      <div className="w-full bg-white rounded-[20px] p-5 mb-3 shadow-[0_4px_20px_rgba(0,0,0,.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[56px] font-light text-[#356B58] leading-none tracking-[-0.02em] block">
              {result.position}
            </span>
            <span className="text-[13px] text-[#aaa] mt-1 font-['DM_Sans'] block">
              {t('checkin.success_pos_label')}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-light text-[#1B2D25]">
              {hasRange ? `${rangeMin}–${rangeMax} min` : `~${liveEstimate} min`}
            </div>
            <div className="text-[12px] text-[#aaa] font-['DM_Sans']">
              {t('checkin.success_wait_label')}
            </div>
          </div>
        </div>

        <div className="h-px bg-[#f0f0f0] mb-3.5" />

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {slots.map((type, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                type === 'done'
                  ? 'bg-[#356B58] opacity-100'
                  : type === 'you'
                    ? 'bg-[#1B2D25] opacity-100 animate-you-pulse'
                    : 'bg-[#356B58] opacity-[.08]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="w-full flex gap-2.5 mt-0">
        {/* TODO: implement share/notify handlers */}
        <button
          type="button"
          className="flex-1 py-3.5 border border-[#356B58]/20 rounded-[14px] bg-white font-['DM_Sans'] text-[13px] font-medium text-[#356B58] flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-rounded text-[18px]">share</span>
          {t('checkin.action_share')}
        </button>
        <button
          type="button"
          className="flex-1 py-3.5 border border-[#356B58]/20 rounded-[14px] bg-white font-['DM_Sans'] text-[13px] font-medium text-[#356B58] flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-rounded text-[18px]">notifications</span>
          {t('checkin.action_notify')}
        </button>
      </div>
    </div>
  );
}

// ─── SkeletonLoader ─────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="px-4 pt-4 space-y-3 animate-pulse">
      <div className="bg-white rounded-[20px] p-[18px] h-48" />
      <div className="bg-white rounded-[20px] p-5 h-20" />
      <div className="bg-white rounded-[20px] p-5 h-24" />
    </div>
  );
}

// ─── ErrorView ──────────────────────────────────────────

function ErrorView({ error }: { error: string }) {
  const { t } = useTranslation();
  const isNotFound = error === 'clinic_not_found';

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center gap-4">
      <span className="material-symbols-rounded text-[48px] text-[#356B58]/40">error_outline</span>
      <h2 className="text-[18px] font-semibold text-[#1B2D25]">
        {isNotFound ? t('checkin.err_not_found_h') : t('checkin.err_network_h')}
      </h2>
      <p className="text-[14px] text-[#999] font-['DM_Sans'] leading-relaxed">
        {isNotFound ? t('checkin.err_not_found_b') : t('checkin.err_network_b')}
      </p>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="absolute top-4 left-4 right-4 z-40 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px] font-['DM_Sans'] text-center animate-ci-slide-down">
      {message}
    </div>
  );
}

// ─── CheckInPage (root) ─────────────────────────────────

export default function CheckInPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { t, i18n } = useTranslation();
  const store = useCheckInStore();
  const { phase, snapshot, result, name, rawPhone } = store;
  const nameCardRef = useRef<HTMLDivElement>(null);
  const [nameError, setNameError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [closureReason, setClosureReason] = useState<string | null>(null);

  // Reset store on mount/unmount
  useEffect(() => {
    store.reset();
    return () => {
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // Fetch initial snapshot
  useEffect(() => {
    if (!clinicId) return;

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`${API}/api/queue/${clinicId}/public`);
        if (res.status === 404) {
          store.setError('clinic_not_found');
          return;
        }
        if (!res.ok) throw new Error('network');
        const data: PublicQueueSnapshot = await res.json();
        store.setSnapshot(data);
      } catch {
        store.setError('network_error');
      }
    };

    // Check if today is a closure day (jours fériés / congés)
    const checkClosure = async () => {
      try {
        const res = await fetch(`${API}/api/clinic/closures/today?clinicId=${clinicId}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data?.isClosed) {
            setClosureReason(data.reason || 'Fermé aujourd\'hui');
          }
        }
      } catch {
        // Non-critical — don't block check-in if closure check fails
      }
    };

    fetchSnapshot();
    checkClosure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // Socket.io subscription
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'success') return;
    if (!clinicId) return;

    const socket = io(API, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join:public', { clinicId });

    socket.on('queue:public:update', (update: Partial<PublicQueueSnapshot>) => {
      store.updateSnapshot(update);
    });

    return () => {
      socket.emit('leave:public', { clinicId });
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'ready' || phase === 'success', clinicId]);

  // Clear name error on type
  useEffect(() => {
    if (name.trim()) setNameError(false);
  }, [name]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setNameError(true);
      nameCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    store.setPhase('submitting');

    const payload: CheckInPayload = {
      name: name.trim(),
      ...(rawPhone.length === webBrand.phone.localDigits && { phone: `${webBrand.phone.countryCode}${rawPhone}` }),
    };

    try {
      const res = await fetch(`${API}/api/queue/checkin/${clinicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: payload.name,
          patientPhone: payload.phone || '',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = body?.error?.code;
        if (code === 'ALREADY_CHECKED_IN') {
          setToast(t('checkin.err_already_checked_in'));
        } else if (code === 'CLINIC_INACTIVE') {
          setToast(t('checkin.err_clinic_inactive'));
        } else {
          setToast(t('checkin.err_generic'));
        }
        store.setPhase('ready');
        return;
      }

      const body = await res.json();
      const entry = body.data;

      const checkInResult: CheckInResponse = {
        entryId: entry.id,
        position: entry.position,
        estimatedWaitMinutes: entry.estimatedWaitMins ?? Math.max(1, (entry.position - 1) * (snapshot?.avgConsultMinutes ?? 10)),
        minWaitMins: entry.minWaitMins,
        maxWaitMins: entry.maxWaitMins,
        totalInQueue: snapshot?.waitingCount ? snapshot.waitingCount + 1 : entry.position,
      };

      store.setResult(checkInResult);
    } catch {
      setToast(t('checkin.err_network_h'));
      store.setPhase('ready');
    }
  }, [name, rawPhone, clinicId, snapshot, store, t]);

  const isRTL = i18n.language === 'ar';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#EAECE6] font-['Sora',sans-serif] relative overflow-hidden max-w-sm mx-auto"
    >
      {/* TopBar — always visible */}
      <TopBar
        clinicName={snapshot?.clinicName ?? '...'}
        specialty={snapshot?.specialty ?? ''}
        isOnline={phase === 'ready' || phase === 'success'}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* Loading */}
      {phase === 'loading' && <SkeletonLoader />}

      {/* Error */}
      {phase === 'error' && <ErrorView error={store.error ?? 'network_error'} />}

      {/* Ready / Submitting */}
      {(phase === 'ready' || phase === 'submitting') && snapshot && (
        <>
          <div className="h-[calc(100vh-64px)] overflow-y-auto pb-24 px-4 pt-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Closure banner — jours fériés / congés */}
            {closureReason && (
              <div
                className="mb-3 p-4 rounded-[20px] text-center shadow-[0_2px_12px_rgba(0,0,0,.05)]"
                style={{
                  background: '#FDF0ED',
                  border: '1px solid #FEE2E2',
                }}
              >
                <span className="material-symbols-rounded text-[28px] text-[#D94F3B] block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  event_busy
                </span>
                <div className="text-[14px] font-semibold text-[#D94F3B] font-['Sora']">
                  Le cabinet est fermé aujourd'hui
                </div>
                <div className="text-[12px] text-[#6B6960] mt-1">
                  {closureReason}
                </div>
              </div>
            )}
            <LiveQueueCard snapshot={snapshot} />
            <NameCard
              value={name}
              onChange={store.setName}
              hasError={nameError}
              cardRef={nameCardRef}
            />
            <PhoneCard
              rawPhone={rawPhone}
              digitCount={rawPhone.length}
              onChange={store.setRawPhone}
            />
          </div>
          <FixedCTA
            nextPosition={snapshot.waitingCount + 1}
            isSubmitting={phase === 'submitting'}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {/* Success */}
      {phase === 'success' && result && (
        <SuccessOverlay result={result} snapshot={snapshot} />
      )}
    </div>
  );
}
