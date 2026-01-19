import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { funFacts, type FunFact } from '@/data/funFacts';

interface FunFactCardProps {
  refreshInterval?: number; // How often to show a new fact (ms)
}

// Map categories to MD3 icons
const categoryIcons: Record<FunFact['category'], string> = {
  anatomy: 'visibility',
  vision: 'palette',
  health: 'health_and_safety',
  medical: 'medical_information',
  trivia: 'lightbulb',
};

/**
 * Displays random eye-related fun facts to entertain patients while waiting
 * Rotates through 50 facts every 18 seconds by default
 * Includes a progress circle that shows time until next fact
 */
export default function FunFactCard({ refreshInterval = 18000 }: FunFactCardProps) {
  const { i18n } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const shuffledFactsRef = useRef<FunFact[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Shuffle facts once on mount
  useEffect(() => {
    shuffledFactsRef.current = [...funFacts].sort(() => Math.random() - 0.5);
  }, []);

  // Set up rotation interval and progress
  useEffect(() => {
    const progressUpdateInterval = 100; // Update progress every 100ms
    const totalSteps = refreshInterval / progressUpdateInterval;
    let currentStep = 0;

    // Reset progress
    setProgress(0);
    currentStep = 0;

    // Update progress smoothly
    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);

      // When progress completes, animate to next fact
      if (currentStep >= totalSteps) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
          setIsAnimating(false);
          setProgress(0);
          currentStep = 0;
        }, 300);
      }
    }, progressUpdateInterval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [refreshInterval]);

  const currentFact = shuffledFactsRef.current[currentFactIndex] || funFacts[currentFactIndex];

  if (!currentFact) return null;

  // Get the fact text based on current language
  const factText = i18n.language === 'ar' ? currentFact.ar : currentFact.fr;
  const title = i18n.language === 'ar' ? 'هل تعلم؟' : 'Le saviez-vous ?';
  const icon = categoryIcons[currentFact.category];

  // Calculate SVG circle progress (stroke-dashoffset based)
  const circleRadius = 10;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Progress circle with icon */}
        <div className="relative flex-shrink-0">
          {/* SVG Progress Circle */}
          <svg
            className="w-10 h-10 -rotate-90"
            viewBox="0 0 24 24"
          >
            {/* Background circle (grey track) */}
            <circle
              cx="12"
              cy="12"
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200"
            />
            {/* Progress circle (fills up then resets) */}
            <circle
              cx="12"
              cy="12"
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary-400 transition-all duration-100"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          {/* Icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-base text-primary-600"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              aria-hidden="true"
            >
              {icon}
            </span>
          </div>
        </div>

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
