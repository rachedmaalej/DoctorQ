import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Screen 0: BléSaf wordmark centered, fades out upward after 1.2s.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="flex items-center justify-center h-full w-full bg-white"
      style={{ fontFamily: 'var(--ob-font)' }}
    >
      <motion.div
        className="flex items-baseline gap-1 select-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'var(--ob-brand-primary)' }}
        >
          Blé
        </span>
        <span
          className="text-4xl font-extrabold tracking-widest uppercase"
          style={{ color: 'var(--ob-brand-text)' }}
        >
          SAF
        </span>
      </motion.div>
    </div>
  );
}
