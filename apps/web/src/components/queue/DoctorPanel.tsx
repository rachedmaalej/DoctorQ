import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getSpecialtyStyle } from '@/lib/specialty-colors';
import DoctorPanelDetail from './DoctorPanelDetail';

export interface DoctorPanelData {
  id: string;
  name: string;
  specialty: string | null;
  isPresent: boolean;
  currentPatient: {
    name: string;
    elapsedMinutes: number;
  } | null;
  waitingCount: number;
  seenCount: number;
  avgWaitMinutes: number | null;
}

interface DoctorPanelProps {
  doctor: DoctorPanelData;
  isOpen: boolean;
  onToggle: () => void;
  onCallNext: (doctorId: string) => void;
  isLast?: boolean;
}

function DoctorPanelInner({ doctor, isOpen, onToggle, onCallNext, isLast }: DoctorPanelProps) {
  const { t, i18n } = useTranslation();
  const spec = getSpecialtyStyle(doctor.specialty);
  const initial = doctor.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase();
  const isAr = i18n.language === 'ar';

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle, #E8E6DF)',
        boxShadow: isOpen ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      {/* Header row — always visible, ~44px */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 8px',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        }}
      >
        {/* 1. Specialty color bar */}
        <div
          style={{
            width: 3,
            height: 28,
            borderRadius: 2,
            background: spec.color,
            flexShrink: 0,
          }}
        />

        {/* 2. Doctor avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: spec.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
            {initial}
          </span>
          {/* Online pulse dot */}
          {doctor.isPresent && (
            <span
              className="as-pulse-consultation"
              style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#2D8B4E',
                border: '1.5px solid var(--color-surface-alt, #F0EFEA)',
              }}
            />
          )}
        </div>

        {/* 3. Doctor info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Name + Specialty tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-primary, #1A1A1A)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {doctor.name}
            </span>
            <span
              style={{
                fontSize: 7,
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: 3,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: spec.lightBg,
                color: spec.color,
                flexShrink: 0,
              }}
            >
              {isAr ? spec.labelAr : spec.label}
            </span>
          </div>

          {/* Row 2: Current patient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            {doctor.currentPatient ? (
              <>
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#2D8B4E',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 9, color: 'var(--color-text-muted, #9E9B90)' }}>
                  {doctor.currentPatient.name} · {doctor.currentPatient.elapsedMinutes}m
                </span>
              </>
            ) : (
              <span style={{ fontSize: 9, color: 'var(--color-text-muted, #9E9B90)' }}>
                {t('queue.doctors.free', '— libre —')}
              </span>
            )}
          </div>
        </div>

        {/* 4. Waiting count badge + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 4,
              lineHeight: '1.3',
              background: doctor.waitingCount > 0 ? spec.lightBg : 'var(--color-surface-alt, #F0EFEA)',
              color: doctor.waitingCount > 0 ? spec.color : 'var(--color-text-muted, #9E9B90)',
            }}
          >
            {doctor.waitingCount}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: 'var(--color-text-muted, #9E9B90)',
              textTransform: 'uppercase',
            }}
          >
            {t('queue.doctors.waiting', 'att.')}
          </span>
        </div>

        {/* 5. Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-muted, #9E9B90)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expandable detail tray */}
      <DoctorPanelDetail
        doctorId={doctor.id}
        seenCount={doctor.seenCount}
        avgWaitMinutes={doctor.avgWaitMinutes}
        waitingCount={doctor.waitingCount}
        isOpen={isOpen}
        onCallNext={onCallNext}
      />
    </div>
  );
}

const DoctorPanel = memo(DoctorPanelInner);
export default DoctorPanel;
