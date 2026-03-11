import { SPECIALTIES, type SpecialtyId } from '../constants/onboardingConfig';

interface SpecialtyGridProps {
  selected: SpecialtyId | null;
  onSelect: (id: SpecialtyId) => void;
  compact?: boolean;
}

/**
 * 2x2 card picker for specialty selection.
 * Selected card gets brand-primary border + light green fill.
 * compact=true shrinks padding/font to fit inside the constrained 38vh card.
 */
export default function SpecialtyGrid({ selected, onSelect, compact }: SpecialtyGridProps) {
  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2 my-1' : 'gap-3 my-4'}`}>
      {SPECIALTIES.map((s) => {
        const isActive = selected === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`
              flex flex-col items-center justify-center
              ${compact ? 'gap-1 py-3 px-2' : 'gap-2 py-5 px-3'}
              rounded-2xl border-2 transition-all duration-200
              cursor-pointer active:scale-[0.97]
            `}
            style={{
              fontFamily: 'var(--ob-font)',
              borderColor: isActive ? 'var(--ob-brand-primary)' : '#E5E7EB',
              backgroundColor: isActive ? 'var(--ob-brand-bg)' : 'var(--ob-card-bg)',
            }}
          >
            <span
              className={`${compact ? 'text-[12px]' : 'text-[14px]'} font-medium`}
              style={{ color: isActive ? 'var(--ob-brand-primary)' : 'var(--ob-brand-text)' }}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
