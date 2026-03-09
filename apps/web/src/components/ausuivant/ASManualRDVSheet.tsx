import ASIcon from './ASIcon';
import { useState, useEffect } from 'react';

import { api } from '@/lib/api';
import type { Doctor } from '@/types';
import { formatDoctorName, getTokenColor } from './utils';

interface SlotRow {
  id: string;
  hour: string;
  minute: string;
  patientName: string;
}

interface ASManualRDVSheetProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: Doctor[];
  defaultDuration?: number;
  onSlotsCreated: () => void;
}

let rowId = 0;
function nextId() {
  return `row-${++rowId}`;
}

const HOURS = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const INTERVALS = [
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
];

export default function ASManualRDVSheet({
  isOpen,
  onClose,
  doctors = [],
  defaultDuration = 15,
  onSlotsCreated,
}: ASManualRDVSheetProps) {
  const activeDoctors = doctors.filter((d) => d.isActive && d.state !== 'inactive');
  const hasMultiDoctor = activeDoctors.length > 1;

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Quick-fill state
  const [qfStartHour, setQfStartHour] = useState('08');
  const [qfEndHour, setQfEndHour] = useState('12');
  const [qfInterval, setQfInterval] = useState(defaultDuration <= 15 ? 15 : defaultDuration <= 20 ? 20 : 30);

  // Auto-select first doctor
  useEffect(() => {
    if (isOpen && !selectedDoctorId && activeDoctors.length > 0) {
      setSelectedDoctorId(activeDoctors[0].id);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const resetForm = () => {
    setSlots([]);
    setSelectedDoctorId(null);
    setError('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleQuickFill = () => {
    const startH = parseInt(qfStartHour);
    const endH = parseInt(qfEndHour);
    if (startH >= endH) return;

    const newSlots: SlotRow[] = [];
    let currentMin = startH * 60;
    const endMin = endH * 60;

    while (currentMin < endMin) {
      const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const m = (currentMin % 60).toString().padStart(2, '0');
      newSlots.push({ id: nextId(), hour: h, minute: m, patientName: '' });
      currentMin += qfInterval;
    }

    setSlots((prev) => [...prev, ...newSlots]);
  };

  const addRow = () => {
    const lastSlot = slots[slots.length - 1];
    let nextH = '09';
    let nextM = '00';
    if (lastSlot) {
      const totalMin = parseInt(lastSlot.hour) * 60 + parseInt(lastSlot.minute) + qfInterval;
      nextH = Math.floor(totalMin / 60).toString().padStart(2, '0');
      nextM = (totalMin % 60).toString().padStart(2, '0');
    }
    setSlots((prev) => [...prev, { id: nextId(), hour: nextH, minute: nextM, patientName: '' }]);
  };

  const removeRow = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateRow = (id: string, field: keyof SlotRow, value: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async () => {
    if (slots.length === 0) return;
    const doctorId = selectedDoctorId || activeDoctors[0]?.id;
    if (!doctorId) {
      setError('Aucun médecin sélectionné');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batchSlots = slots.map((s) => {
        const start = new Date(today);
        start.setHours(parseInt(s.hour), parseInt(s.minute), 0, 0);
        const end = new Date(start.getTime() + defaultDuration * 60 * 1000);

        return {
          doctorId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          slotType: 'named' as const,
          patientName: s.patientName.trim() || undefined,
        };
      });

      await api.createScheduleSlotsBatch(batchSlots);
      setShowSuccess(true);
      setTimeout(() => {
        onSlotsCreated();
        handleClose();
      }, 1200);
    } catch {
      setError('Erreur lors de la création des créneaux');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: isOpen ? 'rgba(44,74,62,0.4)' : 'rgba(44,74,62,0)',
          zIndex: 200,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'background 0.3s ease',
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-1/2"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(${isOpen ? '0' : '100%'})`,
          width: '100%',
          maxWidth: 430,
          maxHeight: '92dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          zIndex: 210,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px 0' }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Agenda du jour
          </span>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="flex items-center justify-center"
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-alt)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
          >
            <ASIcon name="close" size={18} />
          </button>
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center" style={{ padding: '40px 20px' }}>
            <div
              className="as-success-pop flex items-center justify-center"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-primary-light)',
              }}
            >
              <ASIcon name="check" size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>
              {slots.length} créneau{slots.length > 1 ? 'x' : ''} ajouté{slots.length > 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <div style={{ padding: '16px 20px 24px' }}>
            {/* Doctor selector */}
            {hasMultiDoctor && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Médecin
                </div>
                <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: 4 }}>
                  {activeDoctors.map((doc) => {
                    const colors = getTokenColor(doc.colorToken);
                    const isSelected = doc.id === selectedDoctorId;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          background: isSelected ? colors.bg : 'var(--color-surface-alt)',
                          color: isSelected ? colors.fg : 'var(--color-text-secondary)',
                          border: isSelected ? `1.5px solid ${colors.fg}` : '1.5px solid transparent',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDoctorName(doc.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick-fill section */}
            <div
              style={{
                background: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <ASIcon name="bolt" size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Remplissage rapide</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>De</span>
                  <select
                    value={qfStartHour}
                    onChange={(e) => setQfStartHour(e.target.value)}
                    style={{
                      padding: '4px 6px', borderRadius: 6, fontSize: 13,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>à</span>
                  <select
                    value={qfEndHour}
                    onChange={(e) => setQfEndHour(e.target.value)}
                    style={{
                      padding: '4px 6px', borderRadius: 6, fontSize: 13,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>chaque</span>
                  <select
                    value={qfInterval}
                    onChange={(e) => setQfInterval(parseInt(e.target.value))}
                    style={{
                      padding: '4px 6px', borderRadius: 6, fontSize: 13,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    }}
                  >
                    {INTERVALS.map((iv) => <option key={iv.value} value={iv.value}>{iv.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleQuickFill}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12,
                    fontWeight: 600, background: 'var(--color-primary)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  Générer
                </button>
              </div>
            </div>

            {/* Slot list */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Créneaux ({slots.length})
              </div>

              {slots.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '20px 0', fontSize: 13,
                  color: 'var(--color-text-muted)', fontStyle: 'italic',
                }}>
                  Utilisez le remplissage rapide ou ajoutez des créneaux manuellement
                </div>
              )}

              <div style={{ maxHeight: '40dvh', overflowY: 'auto' }}>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2"
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {/* Time selectors */}
                    <select
                      value={slot.hour}
                      onChange={(e) => updateRow(slot.id, 'hour', e.target.value)}
                      style={{
                        padding: '5px 4px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        width: 52,
                      }}
                    >
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>:</span>
                    <select
                      value={slot.minute}
                      onChange={(e) => updateRow(slot.id, 'minute', e.target.value)}
                      style={{
                        padding: '5px 4px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        width: 52,
                      }}
                    >
                      {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {/* Patient name */}
                    <input
                      type="text"
                      value={slot.patientName}
                      onChange={(e) => updateRow(slot.id, 'patientName', e.target.value)}
                      placeholder="Nom (optionnel)"
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 13,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        minWidth: 0,
                      }}
                    />

                    {/* Delete button */}
                    <button
                      onClick={() => removeRow(slot.id)}
                      aria-label="Supprimer"
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        color: 'var(--color-text-muted)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <ASIcon name="delete" size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add row button */}
              <button
                onClick={addRow}
                className="flex items-center gap-1.5"
                style={{
                  marginTop: 8, padding: '8px 0', fontSize: 13,
                  fontWeight: 500, color: 'var(--color-primary)', background: 'none',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <ASIcon name="add" size={16} />
                Ajouter un créneau
              </button>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--color-error-bg)', color: 'var(--color-error)',
                marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={slots.length === 0 || isSubmitting}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 'var(--radius)',
                fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: slots.length === 0 ? 'var(--color-surface-alt)' : 'var(--color-primary)',
                color: slots.length === 0 ? 'var(--color-text-muted)' : '#fff',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Enregistrement...'
                : `Enregistrer ${slots.length} créneau${slots.length !== 1 ? 'x' : ''}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
