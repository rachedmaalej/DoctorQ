import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PSStarRatingProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
}

export default function PSStarRating({ onRate, disabled }: PSStarRatingProps) {
  const { t } = useTranslation();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);

  const hintKey = selectedStar === 0
    ? 'feedback.tapToRate'
    : `feedback.ratingLabel.${selectedStar}`;

  return (
    <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>
        {t('feedback.question')}
      </p>

      <div
        style={{ display: 'flex', justifyContent: 'center', gap: 8 }}
        role="radiogroup"
        aria-label={t('feedback.ariaRatingGroup')}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hoveredStar || selectedStar);
          return (
            <button
              key={star}
              role="radio"
              aria-checked={selectedStar === star}
              aria-label={t('feedback.ariaStarLabel', { count: star })}
              disabled={disabled}
              onPointerEnter={() => setHoveredStar(star)}
              onPointerLeave={() => setHoveredStar(0)}
              onClick={() => {
                setSelectedStar(star);
                onRate(star);
              }}
              style={{
                padding: 4,
                background: 'none',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s ease',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: 40,
                  color: active ? '#F5A623' : '#D4DAD6',
                  fontVariationSettings: active
                    ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 40"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 40",
                  transition: 'color 0.15s ease',
                }}
              >
                star
              </span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
        {t(hintKey)}
      </p>
    </div>
  );
}
