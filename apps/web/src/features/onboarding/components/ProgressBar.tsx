import { motion } from 'framer-motion';
import { VISIBLE_STEPS } from '../constants/onboardingConfig';

interface ProgressBarProps {
  /** Current step index (0 = splash, 1 = welcome, etc.) */
  step: number;
}

/**
 * Thin 3px progress bar at top of illustration panel.
 * Splash (step 0) shows 0%. Steps 1–4 map to 25%–100%.
 */
export default function ProgressBar({ step }: ProgressBarProps) {
  const progress = step <= 0 ? 0 : ((step) / VISIBLE_STEPS) * 100;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-10"
      style={{ height: 'var(--ob-progress-h)' }}
    >
      <div className="h-full w-full bg-black/10">
        <motion.div
          className="h-full rounded-r-full"
          style={{ backgroundColor: 'var(--ob-brand-primary)' }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}
