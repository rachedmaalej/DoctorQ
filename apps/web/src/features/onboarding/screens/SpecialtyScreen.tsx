import { useState } from 'react';
import OnboardingLayout from '../components/OnboardingLayout';
import PillButton from '../components/PillButton';
import { SCREEN_COPY, ILLUSTRATION_PATHS, SPECIALTIES, type SpecialtyId } from '../constants/onboardingConfig';

interface SpecialtyScreenProps {
  step: number;
  specialty: SpecialtyId | null;
  onSelect: (id: SpecialtyId) => void;
  onAdvance: () => void;
  onSkip: () => void;
}

/**
 * Screen 2: Specialty picker.
 * Mobile: bottom sheet modal over 10 options.
 * Desktop: inline 2-column chip grid — all options visible at once.
 */
export default function SpecialtyScreen({
  step,
  specialty,
  onSelect,
  onAdvance,
  onSkip,
}: SpecialtyScreenProps) {
  const copy = SCREEN_COPY.specialty;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [autresText, setAutresText] = useState('');

  const canAdvance =
    specialty !== null && (specialty !== 'autres' || autresText.trim().length > 0);

  const selectedLabel = specialty
    ? SPECIALTIES.find((s) => s.id === specialty)?.label
    : null;

  const handleOptionSelect = (id: SpecialtyId) => {
    onSelect(id);
    if (id !== 'autres') {
      setIsSheetOpen(false);
    }
  };

  const closeSheet = () => setIsSheetOpen(false);

  const skipButton = (
    <button
      type="button"
      onClick={onSkip}
      className="text-[13px] font-medium opacity-70 hover:opacity-100 transition-opacity"
      style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
    >
      Passer
    </button>
  );

  return (
    <div className="relative h-full">
      <OnboardingLayout
        step={step}
        illustrationSrc={ILLUSTRATION_PATHS.specialty}
        illustrationAlt="Doctor with specialty icons"
        headerRight={skipButton}
      >
        <div className="flex flex-col items-center md:items-stretch md:h-full">
          {/* Desktop: skip link inline */}
          <div className="hidden md:flex items-center justify-between mb-1 w-full">
            <span
              className="text-[12px] font-medium"
              style={{ color: 'var(--ob-brand-subtle)' }}
            >
              Étape 2 / 4
            </span>
            <button
              type="button"
              onClick={onSkip}
              className="text-[13px] font-medium hover:underline transition-all"
              style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
            >
              Passer &rarr;
            </button>
          </div>

          <h1
            className="text-[22px] font-bold leading-tight mb-[4px] text-center md:text-left md:text-[28px] md:mb-[6px]"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
          >
            {copy.headline}
          </h1>
          <p
            className="text-[13px] leading-relaxed mb-[14px] text-center md:text-left md:text-[14px] md:mb-5"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
          >
            {copy.subtitle}
          </p>

          {/* ── Mobile: Select trigger (opens bottom sheet) ── */}
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="md:hidden w-full flex items-center justify-between rounded-xl border-2 px-4 py-[11px] text-[14px] font-medium transition-colors"
            style={{
              fontFamily: 'var(--ob-font)',
              borderColor: specialty ? 'var(--ob-brand-primary)' : '#E5E7EB',
              backgroundColor: specialty ? 'var(--ob-brand-bg)' : '#FAFAFA',
              color: specialty ? 'var(--ob-brand-text)' : 'var(--ob-brand-subtle)',
            }}
          >
            <span style={{ fontWeight: specialty ? 600 : 500 }}>
              {selectedLabel ?? 'Choisir une spécialité…'}
            </span>
            <span
              className="text-[11px] transition-transform duration-200"
              style={{
                color: 'var(--ob-brand-subtle)',
                transform: isSheetOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </span>
          </button>

          {/* ── Desktop: inline chip grid ── */}
          <div className="hidden md:grid grid-cols-2 gap-2 mb-5">
            {SPECIALTIES.map((s) => {
              const isActive = specialty === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className="px-3 py-[10px] rounded-[10px] border-2 text-[13px] font-medium text-center transition-all hover:border-[var(--ob-brand-primary)] hover:bg-[var(--ob-brand-bg)]"
                  style={{
                    fontFamily: 'var(--ob-font)',
                    borderColor: isActive ? 'var(--ob-brand-primary)' : '#E5E7EB',
                    backgroundColor: isActive ? 'var(--ob-brand-bg)' : '#FAFAFA',
                    color: isActive ? 'var(--ob-brand-primary)' : 'var(--ob-brand-text)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Desktop: "Autres" free-text input */}
          {specialty === 'autres' && (
            <div className="hidden md:block mb-4">
              <input
                type="text"
                value={autresText}
                onChange={(e) => setAutresText(e.target.value)}
                placeholder="Ex. Neurologie, Urologie…"
                autoFocus
                className="w-full rounded-xl border-2 px-4 py-2 text-[13px] outline-none"
                style={{
                  fontFamily: 'var(--ob-font)',
                  borderColor: 'var(--ob-brand-primary)',
                  backgroundColor: 'var(--ob-brand-bg)',
                  color: 'var(--ob-brand-text)',
                }}
              />
            </div>
          )}

          <PillButton onClick={onAdvance} disabled={!canAdvance} className="w-full md:max-w-full mt-2 md:mt-0">
            {copy.cta} <span aria-hidden="true">&rarr;</span>
          </PillButton>
        </div>
      </OnboardingLayout>

      {/* ── Mobile: Bottom Sheet Overlay ── */}
      {isSheetOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end md:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => e.target === e.currentTarget && closeSheet()}
        >
          <div
            className="w-full flex flex-col bg-white"
            style={{
              borderRadius: '20px 20px 0 0',
              maxHeight: '65%',
              animation: 'sheetSlideUp 0.22s ease',
            }}
          >
            {/* Sheet header */}
            <div
              className="flex items-center justify-between shrink-0 border-b"
              style={{ padding: '14px 20px 12px', borderColor: '#F3F4F6' }}
            >
              <span
                className="text-[14px]"
                style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)', fontWeight: 700 }}
              >
                Votre spécialité
              </span>
              <button
                type="button"
                onClick={closeSheet}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[14px]"
                style={{ background: '#F3F4F6', color: 'var(--ob-brand-subtle)', fontFamily: 'var(--ob-font)' }}
              >
                ✕
              </button>
            </div>

            {/* Option list */}
            <div className="overflow-y-auto flex-1">
              {SPECIALTIES.map((s) => {
                const isActive = specialty === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleOptionSelect(s.id)}
                    className="w-full flex items-center justify-between text-left px-5 border-b transition-colors"
                    style={{
                      fontFamily: 'var(--ob-font)',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      padding: '13px 20px',
                      borderColor: '#F9FAFB',
                      backgroundColor: isActive ? 'var(--ob-brand-bg)' : 'transparent',
                      color: isActive ? 'var(--ob-brand-primary)' : 'var(--ob-brand-text)',
                    }}
                  >
                    {s.label}
                    {isActive && (
                      <span style={{ color: 'var(--ob-brand-primary)', fontSize: '14px' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* "Autres" free-text input */}
            {specialty === 'autres' && (
              <div
                className="shrink-0 border-t"
                style={{ padding: '10px 20px 14px', borderColor: '#F3F4F6' }}
              >
                <input
                  type="text"
                  value={autresText}
                  onChange={(e) => setAutresText(e.target.value)}
                  placeholder="Ex. Neurologie, Urologie…"
                  autoFocus
                  className="w-full rounded-xl border-2 px-4 py-2 text-[13px] outline-none"
                  style={{
                    fontFamily: 'var(--ob-font)',
                    borderColor: 'var(--ob-brand-primary)',
                    backgroundColor: 'var(--ob-brand-bg)',
                    color: 'var(--ob-brand-text)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
