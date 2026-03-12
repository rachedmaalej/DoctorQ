import { motion } from 'framer-motion';
import { VISIBLE_STEPS } from '../constants/onboardingConfig';

interface StepDotsProps {
  /** Current step index (0 = splash, 1 = welcome, etc.) */
  step: number;
}

/**
 * Dot-style step indicator for desktop onboarding.
 * Active step renders as a wider pill; inactive steps are small circles.
 */
export default function StepDots({ step }: StepDotsProps) {
  // Steps 1–4 map to dots 0–3 (splash doesn't count)
  const activeIndex = step - 1;

  return (
    <div className="flex items-center gap-[6px] mb-5">
      {Array.from({ length: VISIBLE_STEPS }, (_, i) => {
        const isActive = i === activeIndex;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              height: 8,
              backgroundColor: isActive
                ? 'var(--ob-brand-primary)'
                : '#D9D9D9',
            }}
            initial={false}
            animate={{ width: isActive ? 28 : 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        );
      })}
    </div>
  );
}
