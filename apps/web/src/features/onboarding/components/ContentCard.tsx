import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
}

/**
 * White bottom card with large top border-radius (28px).
 * Pulls UP 20px via negative margin so the rounded corners
 * bite into the illustration — matching the Verbivy reference.
 */
export default function ContentCard({ children }: ContentCardProps) {
  return (
    <motion.div
      className="relative z-10 flex-1"
      style={{
        marginTop: '-20px',
        backgroundColor: 'var(--ob-card-bg)',
        borderRadius: 'var(--ob-card-radius) var(--ob-card-radius) 0 0',
        padding: 'var(--ob-card-pad)',
        fontFamily: 'var(--ob-font)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
