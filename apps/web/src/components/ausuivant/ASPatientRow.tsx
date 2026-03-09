import ASIcon from './ASIcon';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';
import { formatDisplayName, formatArrivalTime } from './utils';

/** Reusable menu item for the context menu */
function MenuItem({ icon, label, onClick, color }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full"
      style={{
        padding: '0 14px',
        height: 40,
        fontSize: 13,
        fontWeight: 500,
        border: 'none',
        background: 'transparent',
        color: color || 'var(--color-text-primary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'background-color 0.1s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  );
}

// Doctor color palette — Tricolor (from Blue / Green / Warm rows)
const DOCTOR_COLORS = [
  { bg: '#E8EEF9', fg: '#1A3C8F' }, // cobalt
  { bg: '#E8F5EE', fg: '#1A7A4A' }, // green
  { bg: '#FEF0E6', fg: '#E8712A' }, // amber
  { bg: '#EDE6F9', fg: '#5A3C8F' }, // violet
  { bg: '#F9E6EA', fg: '#8F3C5A' }, // rose
  { bg: '#EDF0F7', fg: '#6B7A99' }, // neutral
];

export function getDoctorColor(doctorId: string | null, doctors: Doctor[]): typeof DOCTOR_COLORS[0] {
  if (!doctorId) return DOCTOR_COLORS[5]; // slate for unassigned
  const idx = doctors.findIndex(d => d.id === doctorId);
  return DOCTOR_COLORS[idx >= 0 ? idx % DOCTOR_COLORS.length : 5];
}

export function getDoctorInitial(doctorId: string | null, doctors: Doctor[]): string {
  if (!doctorId) return '?';
  const doc = doctors.find(d => d.id === doctorId);
  if (!doc) return '?';
  const stripped = doc.name.replace(/^Dr\.?\s*/i, '').trim();
  return (stripped.charAt(0) || doc.name.charAt(0)).toUpperCase();
}

interface ASPatientRowProps {
  entry: QueueEntry;
  doctors: Doctor[];
  position: number;
  estimatedWaitMinutes: number | null;
  onMarkUrgent?: (id: string) => void;
  onRemove?: (id: string) => void;
  onCallIn?: (id: string) => void;
  onMarkNoShow?: (id: string) => void;
  onTransfer?: (id: string) => void;
  animationDelay?: number;
}

export default function ASPatientRow({
  entry,
  doctors,
  position,
  estimatedWaitMinutes,
  onMarkUrgent,
  onRemove,
  onCallIn,
  onMarkNoShow,
  onTransfer,
  animationDelay = 0,
}: ASPatientRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const isInConsultation = entry.status === QueueStatus.IN_CONSULTATION;
  const isNotified = entry.status === QueueStatus.NOTIFIED;
  const isUrgent = entry.priority === 'urgent';
  const hasAppointment = entry.appointmentTime != null;
  const hasPhone = !!entry.patientPhone;
  const hasMultiDoctor = doctors.filter(d => d.isActive && d.state !== 'inactive').length > 1;
  const displayName = formatDisplayName(entry.patientName);
  const arrivalTime = entry.arrivedAt ? formatArrivalTime(entry.arrivedAt) : '';
  const appointmentDisplay = hasAppointment
    ? formatArrivalTime(entry.appointmentTime!)
    : null;

  const color = getDoctorColor(entry.doctorId, doctors);
  const initial = getDoctorInitial(entry.doctorId, doctors);
  const showDoctorBadge = doctors.length > 0;

  // Wait time since arrival
  const waitMinutes = Math.round((Date.now() - new Date(entry.arrivedAt).getTime()) / 60000);

  // Count how many menu items will be visible (for height estimation)
  const menuItemCount =
    (onCallIn && !isInConsultation ? 1 : 0) +
    (hasPhone ? 1 : 0) +
    (onTransfer && hasMultiDoctor ? 1 : 0) +
    (onMarkUrgent ? 1 : 0) +
    (onMarkNoShow && !isInConsultation ? 1 : 0) +
    (onRemove ? 1 : 0);
  const estimatedMenuHeight = menuItemCount * 40 + 8 + (onRemove ? 9 : 0); // items + padding + separator

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < estimatedMenuHeight + 8;

      setMenuPos({
        top: openUpward ? rect.top - estimatedMenuHeight - 4 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(true);
  };


  return (
    <div
      role="listitem"
      aria-label={`${displayName}, position ${position}${isUrgent ? ', urgent' : ''}${isInConsultation ? ', en consultation' : ''}`}
      className="as-fade-up-card relative flex items-center gap-3"
      style={{
        padding: '10px 14px',
        background: isUrgent ? 'rgba(206,40,38,0.04)' : 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: `1px solid ${isUrgent ? 'rgba(206,40,38,0.15)' : 'var(--color-border-subtle)'}`,
        boxShadow: 'var(--shadow-card)',
        animationDelay: `${animationDelay}s`,
        minHeight: 52,
      }}
    >
      {/* Position + Doctor badge */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Position number */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: isInConsultation
              ? 'var(--section-consult-accent)'
              : isNotified
                ? 'var(--section-waiting-bg)'
                : 'var(--color-surface-alt)',
            color: isInConsultation
              ? 'white'
              : isNotified
                ? 'var(--section-waiting-text)'
                : 'var(--color-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {position}
        </div>

        {/* Doctor initial badge */}
        {showDoctorBadge && (
          <div
            className="flex items-center justify-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: 8,
              background: color.bg,
              color: color.fg,
              fontWeight: 700,
              fontSize: 10,
            }}
            title={doctors.find(d => d.id === entry.doctorId)?.name || 'Non assign\u00e9'}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 1 }}>
          <span
            className="truncate"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}
          >
            {displayName}
          </span>

          {/* Urgent badge */}
          {isUrgent && (
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                background: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                flexShrink: 0,
              }}
            >
              Urgent
            </span>
          )}

          {/* RDV / SANS RDV tag */}
          {hasAppointment ? (
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                background: 'var(--section-waiting-bg)',
                color: 'var(--section-waiting-text)',
                flexShrink: 0,
              }}
            >
              {appointmentDisplay}
            </span>
          ) : (
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              Sans RDV
            </span>
          )}

          {/* Notified status */}
          {isNotified && (
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                background: 'var(--section-waiting-bg)',
                color: 'var(--section-waiting-accent)',
                flexShrink: 0,
              }}
            >
              NOTIFIÉ
            </span>
          )}
        </div>

        {/* Meta: arrival time + wait duration */}
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {isInConsultation
            ? 'En consultation'
            : `Arriv\u00e9e ${arrivalTime} \u00b7 ${waitMinutes} min`}
        </span>
      </div>

      {/* Right side: estimated wait + actions */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        {/* Estimated wait (not shown for in-consultation) */}
        {!isInConsultation && (
          <div className="text-right" style={{ minWidth: 36 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-text-primary)',
              }}
            >
              {estimatedWaitMinutes != null ? `~${estimatedWaitMinutes}` : '\u2014'}
            </div>
            <div
              style={{
                fontSize: 8,
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.3px',
              }}
            >
              min est.
            </div>
          </div>
        )}

        {/* Action menu button */}
        <button
          ref={btnRef}
          onClick={toggleMenu}
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: menuOpen ? 'var(--color-surface-alt)' : 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <ASIcon name="more_vert" size={16} />
        </button>

        {/* Portal dropdown — rendered at body level to escape all overflow/transform */}
        {menuOpen && menuPos && createPortal(
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="as-menu-enter"
              style={{
                position: 'fixed',
                top: menuPos.top,
                right: menuPos.right,
                zIndex: 9999,
                background: 'var(--color-surface)',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 180,
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              {/* Call in now */}
              {onCallIn && !isInConsultation && (
                <MenuItem
                  icon={<ASIcon name="campaign" size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                  label="Appeler maintenant"
                  onClick={() => { onCallIn(entry.id); setMenuOpen(false); }}
                />
              )}

              {/* Send WhatsApp status link */}
              {hasPhone && (
                <MenuItem
                  icon={<ASIcon name="send" size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
                  label="Envoyer le lien"
                  onClick={() => {
                    const statusUrl = `${window.location.origin}/patient/${entry.id}`;
                    const msg = `Bonjour ${(entry.patientName || '').split(' ')[0]}, suivez votre position en temps réel :\n${statusUrl}`;
                    const phone = entry.patientPhone?.replace(/\D/g, '') || '';
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                    setMenuOpen(false);
                  }}
                />
              )}

              {/* Transfer to another doctor */}
              {onTransfer && hasMultiDoctor && (
                <MenuItem
                  icon={<ASIcon name="swap_horiz" size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
                  label="Transférer"
                  onClick={() => { onTransfer(entry.id); setMenuOpen(false); }}
                />
              )}

              {/* Mark urgent toggle */}
              {onMarkUrgent && (
                <MenuItem
                  icon={<ASIcon name="warning" size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
                  label={isUrgent ? 'Retirer urgent' : 'Marquer urgent'}
                  onClick={() => { onMarkUrgent(entry.id); setMenuOpen(false); }}
                />
              )}

              {/* No-show */}
              {onMarkNoShow && !isInConsultation && (
                <MenuItem
                  icon={<ASIcon name="person_off" size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
                  label="Absent"
                  onClick={() => { onMarkNoShow(entry.id); setMenuOpen(false); }}
                />
              )}

              {/* Separator */}
              {onRemove && (
                <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 12px' }} />
              )}

              {/* Remove — destructive, always last */}
              {onRemove && (
                <MenuItem
                  icon={<ASIcon name="close" size={16} style={{ flexShrink: 0 }} />}
                  label="Retirer"
                  color="var(--color-error)"
                  onClick={() => { onRemove(entry.id); setMenuOpen(false); }}
                />
              )}
            </div>
          </>,
          document.body,
        )}
      </div>
    </div>
  );
}
