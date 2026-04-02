import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import PSStarRating from './PSStarRating';
import PSGoogleReviewCTA from './PSGoogleReviewCTA';

type FeedbackPhase = 'rating' | 'submitting' | 'google_prompt' | 'thanked';

interface PSCompletedScreenProps {
  entryId: string;
  doctorName?: string | null;
  feedbackEnabled?: boolean;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PSCompletedScreen({ entryId, doctorName, feedbackEnabled = true }: PSCompletedScreenProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<FeedbackPhase>(feedbackEnabled ? 'rating' : 'thanked');
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

  const handleRate = async (rating: number) => {
    setPhase('submitting');
    try {
      const result = await api.submitFeedback(entryId, rating);
      if (result.showGooglePrompt && result.googleReviewUrl) {
        setGoogleReviewUrl(result.googleReviewUrl);
        setPhase('google_prompt');
      } else {
        setPhase('thanked');
      }
    } catch {
      // On error (including 409 duplicate), silently show thanked state
      setPhase('thanked');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 20px 20px',
      }}
    >
      {/* Success icon */}
      <div className="ps-done-circle">
        <CheckIcon />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 24,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          marginBottom: 6,
        }}
      >
        {t('feedback.merciTitle', 'Merci pour votre visite')}
      </div>

      {/* Subtitle */}
      {doctorName && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {t('feedback.chezDocteur', { name: doctorName, defaultValue: `Chez le ${doctorName}` })}
        </div>
      )}

      {/* Star rating phase */}
      {(phase === 'rating' || phase === 'submitting') && (
        <PSStarRating onRate={handleRate} disabled={phase === 'submitting'} />
      )}

      {/* Google review CTA phase */}
      {phase === 'google_prompt' && googleReviewUrl && (
        <PSGoogleReviewCTA
          googleReviewUrl={googleReviewUrl}
          entryId={entryId}
          onDismiss={() => setPhase('thanked')}
        />
      )}

      {/* Thanked phase (rating 1-3 or after Google prompt) */}
      {phase === 'thanked' && feedbackEnabled && (
        <div
          className="ps-fade-up"
          style={{
            background: 'var(--relax-bg, #EEF3F0)',
            borderRadius: 14,
            padding: 20,
            textAlign: 'center',
            marginTop: 12,
            width: '100%',
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: 28,
              color: 'var(--relax-accent, #356B58)',
              fontVariationSettings: "'FILL' 1",
              display: 'block',
              marginBottom: 8,
            }}
          >
            favorite
          </span>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('feedback.privateThanks')}
          </p>
        </div>
      )}
    </div>
  );
}
