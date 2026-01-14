import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getEyeFunFacts } from '@/data/eyeFunFacts';

const FACT_DURATION = 18000; // 18 seconds per fact

/**
 * FunFactCard - Displays rotating eye-related fun facts
 * Shows a random fact on mount and rotates to a new one every 18 seconds
 * Includes a subtle circular progress indicator
 * Supports French and Arabic languages
 */
export default function FunFactCard() {
  const { t, i18n } = useTranslation();
  const facts = getEyeFunFacts(i18n.language);
  const factsLengthRef = useRef(facts.length);

  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * facts.length)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Update facts length ref when language changes
  useEffect(() => {
    factsLengthRef.current = facts.length;
  }, [facts.length]);

  // Progress animation - restarts when factIndex changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const animateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / FACT_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animateProgress);
      }
    };

    animationRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [factIndex]);

  // Fact rotation interval - runs once on mount
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsTransitioning(true);

      // After fade out completes, change fact and fade in
      setTimeout(() => {
        setFactIndex((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * factsLengthRef.current);
          } while (next === prev && factsLengthRef.current > 1);
          return next;
        });
        setIsTransitioning(false);
      }, 300);
    }, FACT_DURATION);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // SVG circle properties for progress indicator
  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-2xl text-amber-500 flex-shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          wb_incandescent
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
              {t('funFact.didYouKnow')}
            </p>
            {/* Subtle circular progress timer */}
            <svg
              width={size}
              height={size}
              className="flex-shrink-0 opacity-40"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-primary-400 transition-none"
              />
            </svg>
          </div>
          <p
            className={`text-sm text-gray-700 leading-relaxed transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {facts[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
