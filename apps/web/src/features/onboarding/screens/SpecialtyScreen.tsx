import { useState } from 'react';
import type React from 'react';
import ProgressBar from '../components/ProgressBar';
import IllustrationPanel from '../components/IllustrationPanel';
import ContentCard from '../components/ContentCard';
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
 * Screen 2: Specialty picker — bottom sheet modal over 10 options.
 * "Autres" reveals a free-text input inside the sheet.
 * CTA enabled once a valid selection is made.
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

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ '--ob-illustration-h': '55dvh', '--ob-card-pad': '16px 20px 20px' } as React.CSSProperties}
    >
      <div className="relative">
        <ProgressBar step={step} />

        {/* Skip */}
        <button
          type="button"
          onClick={onSkip}
          className="absolute top-3 right-4 z-20 text-[13px] font-medium opacity-70 hover:opacity-100 transition-opacity"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
        >
          Skip
        </button>

        <IllustrationPanel
          src={ILLUSTRATION_PATHS.specialty}
          alt="Doctor with specialty icons"
        />
      </div>

      <ContentCard>
        <div className="flex flex-col h-full">
          <h1
            className="text-[22px] font-bold leading-tight mb-[4px]"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
          >
            {copy.headline}
          </h1>
          <p
            className="text-[13px] leading-relaxed mb-[14px]"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
          >
            {copy.subtitle}
          </p>

          {/* Select trigger */}
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="w-full flex items-center justify-between rounded-xl border-2 px-4 py-[11px] text-[14px] font-medium transition-colors"
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

          <div className="flex-1" />

          <PillButton onClick={onAdvance} disabled={!canAdvance}>
            {copy.cta} <span aria-hidden="true">&rarr;</span>
          </PillButton>
        </div>
      </ContentCard>

      {/* ── Bottom Sheet Overlay ── */}
      {isSheetOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end"
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
                className="text-[14px] font-700"
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

            {/* "Autres" free-text input — shown only when Autres is selected */}
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
