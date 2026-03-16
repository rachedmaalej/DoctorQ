import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar';
import StepDots from './StepDots';

interface OnboardingLayoutProps {
  step: number;
  illustrationSrc: string;
  illustrationAlt: string;
  children: ReactNode;
  /** Optional element rendered top-right (e.g. Skip button) */
  headerRight?: ReactNode;
  /** Override mobile illustration height (default: 55dvh) */
  illustrationHeight?: string;
  /** Override mobile card overlap (default: var(--ob-card-overlap)) */
  cardOverlap?: string;
  /** Align card content to top instead of center (useful for tall forms) */
  alignTop?: boolean;
}

/**
 * Responsive onboarding screen layout.
 *  - Mobile: illustration stacked on top (55dvh), white card overlapping below
 *  - Desktop (md+): 50/50 side-by-side split — illustration left, content right
 *  - Mobile uses ProgressBar (thin bar), Desktop uses StepDots (pill dots)
 */
export default function OnboardingLayout({
  step,
  illustrationSrc,
  illustrationAlt,
  children,
  headerRight,
  illustrationHeight = '42dvh',
  cardOverlap,
  alignTop = false,
}: OnboardingLayoutProps) {
  return (
    <div className="flex flex-col h-full md:flex-row">
      {/* ── Left / Top: Illustration ──
          Mobile: fixed height via inline style (55dvh default, overridable per screen)
          Desktop: md:!h-full overrides inline height to fill parent, overflow hidden clips image */}
      <div
        className="relative flex-shrink-0 overflow-hidden md:w-1/2 md:!h-full"
        style={{
          height: illustrationHeight,
          backgroundColor: 'var(--ob-brand-bg)',
        }}
      >
        {/* Mobile-only progress bar */}
        <div className="md:hidden">
          <ProgressBar step={step} />
        </div>

        {/* Mobile-only skip / header-right */}
        {headerRight && (
          <div className="absolute top-3 right-4 z-20 md:hidden">
            {headerRight}
          </div>
        )}

        {/* Illustration image
            Mobile: absolute, pinned top, natural width, overflows below (card overlaps)
            Desktop: relative, fills panel via object-cover, anchored top-center */}
        <motion.img
          src={illustrationSrc}
          alt={illustrationAlt}
          className="absolute top-0 left-0 w-full h-auto md:relative md:h-full md:w-full md:object-cover md:object-top"
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.08, ease: 'easeOut' }}
        />
      </div>

      {/* ── Mobile: overlapping white card ── */}
      <div className={`md:hidden relative z-10 flex-1 flex flex-col ${alignTop ? 'justify-start' : 'justify-center'}`}
        style={{
          marginTop: cardOverlap ?? 'var(--ob-card-overlap)',
          backgroundColor: 'var(--ob-card-bg)',
          borderRadius: 'var(--ob-card-radius) var(--ob-card-radius) 0 0',
          padding: 'var(--ob-card-pad)',
          fontFamily: 'var(--ob-font)',
        }}
      >
        {children}
      </div>

      {/* ── Desktop: right content panel ── */}
      <div className="hidden md:flex md:w-1/2 md:flex-col md:justify-center md:px-14 lg:px-20 relative"
        style={{ fontFamily: 'var(--ob-font)' }}
      >
        {/* Desktop skip / header-right */}
        {headerRight && (
          <div className="absolute top-6 right-8">
            {headerRight}
          </div>
        )}

        <div className="max-w-[420px]">
          <StepDots step={step} />
          {children}
        </div>
      </div>
    </div>
  );
}
