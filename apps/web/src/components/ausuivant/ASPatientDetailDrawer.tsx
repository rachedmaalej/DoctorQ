import ASIcon from './ASIcon';

import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';
import { getDoctorColor } from './ASPatientRow';
import { formatDisplayName, formatArrivalTime, formatDoctorName } from './utils';

interface ASPatientDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: QueueEntry | null;
  doctors: Doctor[];
  onMarkUrgent: (id: string) => void;
  onTransfer: (id: string) => void;
  onMarkNoShow: (id: string) => void;
  onCallIn: (id: string) => void;
  onMarkDone: (id: string) => void;
  onRemove: (id: string) => void;
  variant?: 'mobile' | 'desktop';
}

export default function ASPatientDetailDrawer({
  isOpen,
  onClose,
  entry,
  doctors,
  onMarkUrgent,
  onTransfer,
  onMarkNoShow,
  onCallIn,
  onMarkDone,
  onRemove,
  variant = 'mobile',
}: ASPatientDetailDrawerProps) {
  if (!isOpen || !entry) return null;
  const isDesktop = variant === 'desktop';

  const displayName = formatDisplayName(entry.patientName);
  const arrivalTime = entry.arrivedAt ? formatArrivalTime(entry.arrivedAt) : '';
  const doctor = doctors.find((d) => d.id === entry.doctorId);
  const color = getDoctorColor(entry.doctorId, doctors);
  const isInConsultation = entry.status === QueueStatus.IN_CONSULTATION;
  const isUrgent = entry.priority === 'urgent';
  const waitMinutes = Math.round((Date.now() - new Date(entry.arrivedAt).getTime()) / 60000);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: isDesktop ? 'rgba(44,74,62,0.18)' : 'rgba(44,74,62,0.4)',
          zIndex: 200,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={isDesktop ? 'as-detail-drawer-desktop' : 'fixed bottom-0 left-0 right-0'}
        style={isDesktop ? {} : {
          maxWidth: 430,
          margin: '0 auto',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          zIndex: 210,
          maxHeight: '80dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle (mobile only) */}
        {!isDesktop && (
          <div className="flex justify-center" style={{ padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-subtle)' }} />
          </div>
        )}

        {/* Patient header */}
        <div style={{ padding: '8px 18px 16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-3">
              {/* Doctor badge */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: color.bg,
                  color: color.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {doctor ? formatDoctorName(doctor.name) : 'Non assigne'} &middot; Arrivee {arrivalTime}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ASIcon name="close" size={16} />
            </button>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 14 }}>
            <InfoChip
              label={isInConsultation ? 'En consultation' : `${waitMinutes} min d'attente`}
              bg={isInConsultation ? 'var(--color-primary)' : 'var(--color-surface-alt)'}
              color={isInConsultation ? 'white' : 'var(--color-text-secondary)'}
            />
            {isUrgent && (
              <InfoChip label="Urgent" bg="var(--color-error-bg)" color="var(--color-error)" />
            )}
            {entry.appointmentTime && (
              <InfoChip
                label={`RDV ${formatArrivalTime(entry.appointmentTime)}`}
                bg="var(--color-primary-light)"
                color="#3A7A5E"
              />
            )}
            {!entry.appointmentTime && (
              <InfoChip label="Sans RDV" bg="var(--color-surface-alt)" color="var(--color-text-muted)" />
            )}
          </div>

          {/* Phone */}
          {entry.patientPhone && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Tel: {entry.patientPhone}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            padding: '8px 18px 24px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              padding: '8px 0 6px',
            }}
          >
            Actions
          </div>

          <div className="flex flex-col gap-1">
            {!isInConsultation && (
              <ActionBtn
                icon={<ASIcon name="call" size={16} />}
                label="Appeler en consultation"
                color="var(--color-primary)"
                onClick={() => { onCallIn(entry.id); onClose(); }}
              />
            )}

            {isInConsultation && (
              <ActionBtn
                icon={<ASIcon name="check_circle" size={16} />}
                label="Terminer la consultation"
                color="var(--color-primary)"
                onClick={() => { onMarkDone(entry.id); onClose(); }}
              />
            )}

            <ActionBtn
              icon={<ASIcon name="swap_horiz" size={16} />}
              label="Transferer a un autre medecin"
              color="var(--color-info)"
              onClick={() => { onTransfer(entry.id); onClose(); }}
            />

            {!isUrgent && (
              <ActionBtn
                icon={<ASIcon name="warning" size={16} />}
                label="Marquer urgent"
                color="var(--color-warning)"
                onClick={() => { onMarkUrgent(entry.id); onClose(); }}
              />
            )}

            <ActionBtn
              icon={<ASIcon name="person_off" size={16} />}
              label="Marquer absent"
              color="var(--color-error)"
              onClick={() => { onMarkNoShow(entry.id); onClose(); }}
            />

            <ActionBtn
              icon={<ASIcon name="close" size={16} />}
              label="Retirer de la file"
              color="var(--color-error)"
              onClick={() => { onRemove(entry.id); onClose(); }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoChip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full"
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {label}
      </span>
    </button>
  );
}
