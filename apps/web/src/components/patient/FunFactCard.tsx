import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { eyeFunFacts, type EyeFunFact } from '@/data/eyeFunFacts';

interface FunFactCardProps {
  refreshInterval?: number; // How often to show a new fact (ms)
}

/**
 * Displays random eye-related fun facts to entertain patients while waiting
 * Rotates through facts every 18 seconds by default
 */
export default function FunFactCard({ refreshInterval = 18000 }: FunFactCardProps) {
  const { t } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const shuffledFactsRef = useRef<EyeFunFact[]>([]);

  // Shuffle facts once on mount
  useEffect(() => {
    shuffledFactsRef.current = [...eyeFunFacts].sort(() => Math.random() - 0.5);
  }, []);

  // Set up rotation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % eyeFunFacts.length);
        setIsAnimating(false);
      }, 300);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const currentFact = shuffledFactsRef.current[currentFactIndex] || eyeFunFacts[currentFactIndex];

  if (!currentFact) return null;

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
            {t('funFact.didYouKnow')}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t(`eyeFunFacts.${currentFact.key}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
