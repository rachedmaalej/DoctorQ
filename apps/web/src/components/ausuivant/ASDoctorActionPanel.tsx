import ASIcon from './ASIcon';
import { useRef, useEffect, useState } from 'react';

import type { Doctor } from '@/types';
import { formatDoctorName } from './utils';

interface ASDoctorActionPanelProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  waitingCount: number;
  onCallNext: (doctorId: string) => void;
  onMarkAbsent: (doctorId: string) => void;
  onNotifyDelay: (doctorId: string) => void;
  onTogglePause: (doctorId: string) => void;
  onSetHomeVisit: (doctorId: string) => void;
}

// Token colors — must match ASDoctorPill
const TOKEN_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#D8ECF4', fg: '#4A6E8F' },
  teal: { bg: '#D5F0EB', fg: '#60B8AA' },
  amber: { bg: '#F5E6CB', fg: '#D4923A' },
  plum: { bg: '#E8D8E8', fg: '#8E618F' },
  rose: { bg: '#F0D8E8', fg: '#A12B98' },
  slate: { bg: '#E8EDE9', fg: '#9AAD9F' },
};

export default function ASDoctorActionPanel({
  doctor,
  isOpen,
  onClose,
  waitingCount,
  onCallNext,
  onMarkAbsent,
  onNotifyDelay,
  onTogglePause,
  onSetHomeVisit,
}: ASDoctorActionPanelProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pillRect, setPillRect] = useState<DOMRect | null>(null);

  // Find the pill element that triggered this menu
  useEffect(() => {
    if (!isOpen) return;
    const pills = document.querySelectorAll<HTMLElement>('.as-doctor-pill');
    for (const pill of pills) {
      const label = pill.getAttribute('aria-label') || '';
      if (label.includes(doctor.name.replace(/^Dr\.?\s*/i, ''))) {
        setPillRect(pill.getBoundingClientRect());
        pill.setAttribute('data-active-menu', 'true');
        return () => { pill.removeAttribute('data-active-menu'); };
      }
    }
  }, [isOpen, doctor.name, doctor.id]);

  if (!isOpen) return null;

  const isPaused = doctor.state === 'pause';
  const isAbsent = doctor.state === 'absent_today';
  const canCallNext = (doctor.state === 'consulting' || doctor.state === 'free') && waitingCount > 0;
  const color = TOKEN_COLORS[doctor.colorToken] || TOKEN_COLORS.slate;

  // Calculate menu position anchored to the pill
  const menuLeft = pillRect ? Math.max(12, Math.min(pillRect.left, window.innerWidth - 260)) : 18;
  const arrowLeft = pillRect ? Math.max(16, pillRect.left + pillRect.width / 2 - menuLeft) : 40;

  return (
    <>
      {/* MD3 Scrim */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 100,
          background: 'rgba(0,0,0,0.04)',
          transition: 'opacity 0.15s ease',
        }}
        onClick={onClose}
      />

      {/* Menu — anchored below pills */}
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          left: menuLeft - 18,
          top: '100%',
          marginTop: 8,
          zIndex: 110,
          width: 240,
        }}
      >
        {/* Arrow pointer connecting to pill */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: arrowLeft,
            width: 12,
            height: 12,
            background: color.bg,
            transform: 'rotate(45deg)',
            borderRadius: 2,
            zIndex: 1,
          }}
        />

        {/* Menu surface — MD3 elevation 2 */}
        <div
          className="as-menu-enter"
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'var(--color-surface)',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Header — doctor identity with color accent */}
          <div
            style={{
              padding: '10px 16px',
              background: color.bg,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: color.fg,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(doctor.name.replace(/^Dr\.?\s*/i, '') || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {formatDoctorName(doctor.name)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {waitingCount > 0
                  ? `${waitingCount} patient${waitingCount > 1 ? 's' : ''} en attente`
                  : 'Aucun patient en attente'}
              </div>
            </div>
          </div>

          {/* Menu items — MD3 standard density (48dp) */}
          <div style={{ padding: '4px 0' }}>
            {canCallNext && (
              <MenuItem
                icon={<ASIcon name="chevron_right" size={18} />}
                label="Appeler le suivant"
                iconColor={color.fg}
                onClick={() => { onCallNext(doctor.id); onClose(); }}
              />
            )}

            {!isAbsent && (
              <MenuItem
                icon={isPaused ? <ASIcon name="play_arrow" size={18} /> : <ASIcon name="pause" size={18} />}
                label={isPaused ? 'Reprendre' : 'Mettre en pause'}
                iconColor="var(--color-text-secondary)"
                onClick={() => { onTogglePause(doctor.id); onClose(); }}
              />
            )}

            {!isAbsent && (
              <MenuItem
                icon={<ASIcon name="schedule" size={18} />}
                label="Prévenir du retard"
                iconColor="var(--color-warning)"
                onClick={() => { onNotifyDelay(doctor.id); onClose(); }}
              />
            )}

            {!isAbsent && (
              <MenuItem
                icon={<ASIcon name="home" size={18} />}
                label="Visite à domicile"
                iconColor="var(--color-text-secondary)"
                onClick={() => { onSetHomeVisit(doctor.id); onClose(); }}
              />
            )}

            {/* Divider before destructive action */}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />

            <MenuItem
              icon={<ASIcon name="person_off" size={18} />}
              label={isAbsent ? 'Retirer absent' : 'Marquer absent'}
              iconColor="var(--color-error)"
              labelColor="var(--color-error)"
              onClick={() => { onMarkAbsent(doctor.id); onClose(); }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  iconColor,
  labelColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  iconColor: string;
  labelColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full"
      style={{
        padding: '0 16px',
        height: 48,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        borderRadius: 0,
        transition: 'background-color 0.1s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: iconColor, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: labelColor || 'var(--color-text-primary)' }}>
        {label}
      </span>
    </button>
  );
}
