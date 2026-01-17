import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEyeFunFacts, type EyeFunFact } from '@/data/eyeFunFacts';

interface FunFactCardProps {
  refreshInterval?: number; // How often to show a new fact (ms)
}

/**
 * Displays random eye-related fun facts to entertain patients while waiting
 */
export default function FunFactCard({ refreshInterval = 10000 }: FunFactCardProps) {
  const { t } = useTranslation();
  const [currentFact, setCurrentFact] = useState<EyeFunFact | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Get initial fact
    const facts = getEyeFunFacts(1);
    if (facts.length > 0) {
      setCurrentFact(facts[0]);
    }

    // Set up interval to change facts
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        const newFacts = getEyeFunFacts(1);
        if (newFacts.length > 0) {
          setCurrentFact(newFacts[0]);
        }
        setIsAnimating(false);
      }, 300);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!currentFact) return null;

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {currentFact.emoji}
        </span>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
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
