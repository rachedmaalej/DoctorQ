import { useTranslation } from 'react-i18next';

interface MorningHeroCardProps {
  waitingCount: number;
  seenCount: number;
  variant?: 'mobile' | 'desktop';
  onAddPatientClick?: () => void;
}

export default function MorningHeroCard({
  waitingCount,
  seenCount,
  variant = 'mobile',
  onAddPatientClick,
}: MorningHeroCardProps) {
  const { t } = useTranslation();
  const isDesktop = variant === 'desktop';

  const stats = [
    { value: waitingCount, label: t('dashboard.statsPanel.waiting', 'EN ATTENTE') },
    { value: seenCount, label: t('dashboard.statsPanel.seen', 'VUS') },
    { value: '—', label: t('dashboard.morningState.maxLabel', 'MAX PATS.') },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(140deg, #0F7B6C 0%, #167a6e 55%, #1a9e8c 100%)',
        borderRadius: 16,
        padding: isDesktop ? '22px 26px' : 20,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: isDesktop ? 'flex' : undefined,
        alignItems: isDesktop ? 'center' : undefined,
        justifyContent: isDesktop ? 'space-between' : undefined,
        gap: isDesktop ? 24 : undefined,
        flexShrink: 0,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          insetInlineEnd: isDesktop ? -36 : -24,
          top: isDesktop ? -36 : -24,
          width: isDesktop ? 180 : 130,
          height: isDesktop ? 180 : 130,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      {!isDesktop && (
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: -34,
            width: 88,
            height: 88,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Text content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Eyebrow pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(255,255,255,0.14)',
            borderRadius: 20,
            padding: '3px 10px 3px 6px',
            fontSize: isDesktop ? 11 : 10,
            fontWeight: 600,
            letterSpacing: '0.03em',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.75)',
              flexShrink: 0,
            }}
          />
          {t('dashboard.morningState.queueReady', "File d'attente prête")}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: isDesktop ? 22 : 19,
            fontWeight: 700,
            marginBottom: 4,
            lineHeight: 1.2,
          }}
        >
          {t('dashboard.morningState.greeting', 'Bonne journée !')}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: isDesktop ? 13 : 12,
            opacity: 0.78,
            marginBottom: isDesktop ? 0 : 16,
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
          }}
        >
          {t('dashboard.morningState.noPatientYet', 'Aucun patient pour l\'instant.\nAjoutez le premier pour démarrer.')}
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isDesktop ? 20 : 14,
          marginBottom: isDesktop ? 0 : 16,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 20 : 14 }}>
            {i > 0 && (
              <div
                style={{
                  width: 1,
                  alignSelf: 'stretch',
                  minHeight: isDesktop ? 40 : 32,
                  background: isDesktop ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.20)',
                }}
              />
            )}
            <div>
              <div style={{ fontSize: isDesktop ? 30 : 24, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.72,
                  marginTop: isDesktop ? 3 : 2,
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA button — mobile only */}
      {!isDesktop && onAddPatientClick && (
        <button
          type="button"
          onClick={onAddPatientClick}
          aria-label={t('dashboard.morningState.addFirstPatient', 'Ajouter le 1er patient')}
          style={{
            background: 'rgba(255,255,255,0.96)',
            color: '#0F7B6C',
            border: 'none',
            borderRadius: 11,
            padding: '12px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          {t('dashboard.morningState.addFirstPatient', 'Ajouter le 1er patient')}
        </button>
      )}
    </div>
  );
}
