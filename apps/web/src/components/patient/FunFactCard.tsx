import { useState, useEffect, useRef } from 'react';
import { eyeFunFacts } from '@/data/eyeFunFacts';

const FACT_DURATION = 18000; // 18 seconds per fact

/**
 * FunFactCard - Displays rotating eye-related fun facts
 * Shows a random fact on mount and rotates to a new one every 18 seconds
 * Includes a subtle circular progress indicator
 */
export default function FunFactCard() {
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * eyeFunFacts.length)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset progress when fact changes
    startTimeRef.current = Date.now();
    setProgress(0);

    // Animate progress
    const animateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / FACT_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animateProgress);
      }
    };

    animationRef.current = requestAnimationFrame(animateProgress);

    // Rotate fact
    const interval = setInterval(() => {
      // Start fade out
      setIsTransitioning(true);

      // After fade out completes, change fact and fade in
      setTimeout(() => {
        setFactIndex((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * eyeFunFacts.length);
          } while (next === prev && eyeFunFacts.length > 1);
          return next;
        });
        setIsTransitioning(false);
        // Reset progress for new fact
        startTimeRef.current = Date.now();
        setProgress(0);
      }, 300);
    }, FACT_DURATION);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
              Le saviez-vous ?
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
            {eyeFunFacts[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
