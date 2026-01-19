import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { funFacts, type FunFact } from '@/data/funFacts';

interface FunFactCardProps {
  refreshInterval?: number; // How often to show a new fact (ms)
}

/**
 * Displays random eye-related fun facts to entertain patients while waiting
 * Rotates through 50 facts every 18 seconds by default
 */
export default function FunFactCard({ refreshInterval = 18000 }: FunFactCardProps) {
  const { i18n } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const shuffledFactsRef = useRef<FunFact[]>([]);

  // Shuffle facts once on mount
  useEffect(() => {
    shuffledFactsRef.current = [...funFacts].sort(() => Math.random() - 0.5);
  }, []);

  // Set up rotation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
        setIsAnimating(false);
      }, 300);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const currentFact = shuffledFactsRef.current[currentFactIndex] || funFacts[currentFactIndex];

  if (!currentFact) return null;

  // Get the fact text based on current language
  const factText = i18n.language === 'ar' ? currentFact.ar : currentFact.fr;
  const title = i18n.language === 'ar' ? 'هل تعلم؟' : 'Le saviez-vous ?';

  return (
    <div
      className={`bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
          {currentFact.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {factText}
          </p>
        </div>
      </div>
    </div>
  );
}
