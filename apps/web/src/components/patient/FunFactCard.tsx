import { useState, useEffect } from 'react';
import { eyeFunFacts } from '@/data/eyeFunFacts';

/**
 * FunFactCard - Displays rotating eye-related fun facts
 * Shows a random fact on mount and rotates to a new one every 18 seconds
 */
export default function FunFactCard() {
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * eyeFunFacts.length)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
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
      }, 300); // Matches transition duration
    }, 18000); // 18 seconds per fact

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-2xl text-amber-500 flex-shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          wb_incandescent
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            Le saviez-vous ?
          </p>
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
