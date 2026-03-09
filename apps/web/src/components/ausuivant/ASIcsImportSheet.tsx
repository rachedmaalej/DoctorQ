import ASIcon from './ASIcon';
import { useState, useEffect, useRef } from 'react';

import { api } from '@/lib/api';
import { parseIcsFile, type ParsedEvent } from '@/lib/icsParser';
import type { Doctor } from '@/types';
import { formatDoctorName, getTokenColor } from './utils';

interface ASIcsImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: Doctor[];
  defaultDuration?: number;
  onSlotsCreated: () => void;
}

export default function ASIcsImportSheet({
  isOpen,
  onClose,
  doctors = [],
  defaultDuration = 15,
  onSlotsCreated,
}: ASIcsImportSheetProps) {
  const activeDoctors = doctors.filter((d) => d.isActive && d.state !== 'inactive');
  const hasMultiDoctor = activeDoctors.length > 1;

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [events, setEvents] = useState<(ParsedEvent & { selected: boolean })[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setEvents([]);
    setFileName('');
    setSelectedDoctorId(null);
    setError('');
    setShowSuccess(false);
    setStep('upload');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    try {
      const text = await file.text();
      const today = new Date();
      const parsed = parseIcsFile(text, today);

      if (parsed.length === 0) {
        setError('Aucun rendez-vous trouvé pour aujourd\'hui dans ce fichier');
        return;
      }

      setEvents(parsed.map((ev) => ({ ...ev, selected: true })));
      setStep('preview');
    } catch {
      setError('Impossible de lire le fichier ICS');
    }
  };

  const toggleEvent = (idx: number) => {
    setEvents((prev) => prev.map((ev, i) => (i === idx ? { ...ev, selected: !ev.selected } : ev)));
  };

  const selectedCount = events.filter((ev) => ev.selected).length;

  const handleImport = async () => {
    const doctorId = selectedDoctorId || activeDoctors[0]?.id;
    if (!doctorId) {
      setError('Aucun médecin sélectionné');
      return;
    }

    const selected = events.filter((ev) => ev.selected);
    if (selected.length === 0) return;

    setIsSubmitting(true);
    setError('');

    try {
      const batchSlots = selected.map((ev) => {
        // If no end time or duration is 0, use default duration
        const durationMs = ev.endTime.getTime() - ev.startTime.getTime();
        const endTime = durationMs > 0 ? ev.endTime : new Date(ev.startTime.getTime() + defaultDuration * 60 * 1000);

        return {
          doctorId,
          startTime: ev.startTime.toISOString(),
          endTime: endTime.toISOString(),
          slotType: 'named' as const,
          patientName: ev.summary || undefined,
        };
      });

      await api.createScheduleSlotsBatch(batchSlots);
      setShowSuccess(true);
      setTimeout(() => {
        onSlotsCreated();
        handleClose();
      }, 1200);
    } catch {
      setError('Erreur lors de l\'import');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (d: Date) => {
    return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
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
            Importer depuis Doctolib
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
              {selectedCount} rendez-vous importé{selectedCount > 1 ? 's' : ''}
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
                          padding: '6px 14px', borderRadius: 20, fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          background: isSelected ? colors.bg : 'var(--color-surface-alt)',
                          color: isSelected ? colors.fg : 'var(--color-text-secondary)',
                          border: isSelected ? `1.5px solid ${colors.fg}` : '1.5px solid transparent',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDoctorName(doc.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'upload' ? (
              <>
                {/* Instructions */}
                <div style={{
                  background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)',
                  padding: '16px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                    Comment exporter depuis Doctolib :
                  </div>
                  <ol style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Connectez-vous sur <strong>pro.doctolib.fr</strong></li>
                    <li>Allez dans <strong>Mon agenda</strong> → cliquez sur <strong>Exporter</strong></li>
                    <li>Téléchargez le fichier <strong>.ics</strong></li>
                  </ol>
                </div>

                {/* File picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics,.ical,.ifb,.icalendar"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center"
                  style={{
                    width: '100%', padding: '28px 20px',
                    borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: '2px dashed var(--color-border)',
                    background: 'var(--color-surface)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <ASIcon name="upload" size={28} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Sélectionner le fichier .ics
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    ou glissez-déposez ici
                  </span>
                  {fileName && (
                    <div className="flex items-center gap-1.5" style={{ marginTop: 10, fontSize: 12, color: 'var(--color-primary)' }}>
                      <ASIcon name="description" size={14} />
                      {fileName}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Preview list */}
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rendez-vous trouvés ({events.length})
                </div>

                <div style={{ maxHeight: '45dvh', overflowY: 'auto', marginBottom: 16 }}>
                  {events.map((ev, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3"
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        opacity: ev.selected ? 1 : 0.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={ev.selected}
                        onChange={() => toggleEvent(idx)}
                        style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                        </div>
                        {ev.summary && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.summary}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Back to upload */}
                <button
                  onClick={() => { setStep('upload'); setEvents([]); setFileName(''); }}
                  style={{
                    fontSize: 13, color: 'var(--color-text-muted)', background: 'none',
                    border: 'none', cursor: 'pointer', marginBottom: 12,
                    textDecoration: 'underline',
                  }}
                >
                  Choisir un autre fichier
                </button>
              </>
            )}

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--color-error-bg)', color: 'var(--color-error)',
                marginTop: 12,
              }}>
                {error}
              </div>
            )}

            {/* Import button (only in preview step) */}
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || isSubmitting}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 'var(--radius)',
                  fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: selectedCount === 0 ? 'var(--color-surface-alt)' : 'var(--color-primary)',
                  color: selectedCount === 0 ? 'var(--color-text-muted)' : '#fff',
                  opacity: isSubmitting ? 0.7 : 1,
                  marginTop: 12,
                }}
              >
                {isSubmitting
                  ? 'Import en cours...'
                  : `Importer ${selectedCount} rendez-vous`}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
