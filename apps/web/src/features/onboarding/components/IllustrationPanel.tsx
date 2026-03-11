import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface IllustrationPanelProps {
  src: string;
  alt?: string;
  children?: ReactNode; // floating badges
}

/**
 * Full-bleed illustration area (58vh).
 * Zero padding — image fills edge-to-edge, bottom-anchored so characters
 * are cropped right where the white ContentCard overlaps.
 * Matches Verbivy reference: colored bg, characters large & bottom-flush.
 */
export default function IllustrationPanel({
  src,
  alt = 'Illustration',
  children,
}: IllustrationPanelProps) {
  return (
    <div
      className="relative w-full"
      style={{
        height: 'var(--ob-illustration-h)',
        backgroundColor: 'var(--ob-brand-bg)',
      }}
    >
      {/* Image pinned to TOP, full-width. The square 800x800 PNGs overflow
          below the panel — the card's negative margin covers the bottom. */}
      <motion.img
        src={src}
        alt={alt}
        className="absolute top-0 left-0 w-full h-auto"
        loading="lazy"
        decoding="async"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.08, ease: 'easeOut' }}
      />
      {children}
    </div>
  );
}
