import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Doctor } from '@/types';
import '@/components/receptionist/receptionist.css';

interface BSTeamAccessPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = ['#0F7B6C', '#3B7DD9', '#D4920B', '#7C5CFC'] as const;

const SPECIALTY_STYLES: Record<string, { bg: string; color: string }> = {
  'Cardiologie':        { bg: '#EDF3FC', color: '#3B7DD9' },
  'Dermatologie':       { bg: '#FDF5E6', color: '#D4920B' },
  'Ophtalmologie':      { bg: '#E8F5F1', color: '#0F7B6C' },
  'Pédiatrie':          { bg: '#F0EDF7', color: '#7C5CFC' },
  'Médecine générale':  { bg: '#F0F7F0', color: '#2D8B4E' },
  'Dentisterie':        { bg: '#FDF0ED', color: '#D94F3B' },
  'Gynécologie':        { bg: '#FCF0F7', color: '#C44BA0' },
};

const SPECIALTIES = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Ophtalmologie',
  'Pédiatrie',
  'Dentisterie',
  'Gynécologie',
];

function getInitials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '').toUpperCase();
}

function getSpecialtyStyle(specialty: string | null): { bg: string; color: string } {
  if (!specialty) return { bg: '#EDF3FC', color: '#3B7DD9' };
  return SPECIALTY_STYLES[specialty] ?? { bg: '#EDF3FC', color: '#3B7DD9' };
}

export default function BSTeamAccessPanel({ isOpen, onClose }: BSTeamAccessPanelProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Fetch doctors when panel opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getDoctors()
        .then(setDoctors)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (deletingDoctor) {
          setDeletingDoctor(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, deletingDoctor]);

  const handleToggleExpand = useCallback((doctorId: string) => {
    setExpandedId(prev => prev === doctorId ? null : doctorId);
  }, []);

  const handleToggleActive = useCallback(async (doctor: Doctor) => {
    const newActive = !doctor.isActive;
    // Optimistic update
    setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, isActive: newActive } : d));
    try {
      await api.updateDoctor(doctor.id, { isActive: newActive });
    } catch {
      // Revert on failure
      setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, isActive: !newActive } : d));
    }
  }, []);

  const handleDurationChange = useCallback(async (doctor: Doctor, delta: number) => {
    const newMins = Math.min(60, Math.max(5, doctor.avgConsultationMins + delta));
    if (newMins === doctor.avgConsultationMins) return;
    // Optimistic update
    setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, avgConsultationMins: newMins } : d));
    try {
      await api.updateDoctor(doctor.id, { avgConsultationMins: newMins });
    } catch {
      // Revert on failure
      setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, avgConsultationMins: doctor.avgConsultationMins } : d));
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingDoctor) return;
    setDeleteLoading(true);
    try {
      await api.deleteDoctor(deletingDoctor.id);
      setDoctors(prev => prev.filter(d => d.id !== deletingDoctor.id));
      if (expandedId === deletingDoctor.id) setExpandedId(null);
      setDeletingDoctor(null);
    } catch {
      // silently fail
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingDoctor, expandedId]);

  const handleAddDoctor = useCallback(async () => {
    if (!newName.trim()) return;
    setAddingDoctor(true);
    try {
      const doctor = await api.createDoctor({
        name: newName.trim(),
        specialty: newSpecialty || undefined,
      });
      setDoctors(prev => [...prev, doctor]);
      setNewName('');
      setNewSpecialty('');
    } catch {
      // silently fail
    } finally {
      setAddingDoctor(false);
    }
  }, [newName, newSpecialty]);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Équipe & accès</span>
        </div>

        <div className="bs-panel-body">
          {/* Section label with count badge */}
          <div
            className="bs-settings-label"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Médecins
            {!loading && doctors.length > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: '#E8F5F1',
                color: '#0F7B6C',
                padding: '2px 8px',
                borderRadius: 100,
              }}>
                {doctors.length} médecin{doctors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Doctor list */}
          <div
            className="bs-settings-group"
            style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}
          >
            {loading ? (
              <div style={{
                fontSize: 13,
                color: '#9E9B90',
                padding: '32px 20px',
                textAlign: 'center',
              }}>
                Chargement...
              </div>
            ) : doctors.length === 0 ? (
              /* Empty state */
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#E8F5F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 28, color: '#0F7B6C' }}
                  >
                    group
                  </span>
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1A1A1A',
                  marginBottom: 4,
                }}>
                  Aucun médecin ajouté
                </div>
                <div style={{
                  fontSize: 13,
                  color: '#9E9B90',
                  lineHeight: 1.5,
                  maxWidth: 260,
                  margin: '0 auto',
                }}>
                  Ajoutez vos médecins pour organiser la file d'attente par praticien
                </div>
              </div>
            ) : (
              /* Doctor cards */
              doctors.map((doctor, index) => {
                const isExpanded = expandedId === doctor.id;
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const specStyle = getSpecialtyStyle(doctor.specialty);

                return (
                  <div
                    key={doctor.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < doctors.length - 1
                        ? '1px solid rgba(228,226,221,0.5)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: isExpanded ? '#FAFAF7' : 'transparent',
                    }}
                    onClick={() => handleToggleExpand(doctor.id)}
                  >
                    {/* Main card row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#FFF',
                        flexShrink: 0,
                        letterSpacing: -0.3,
                      }}>
                        {getInitials(doctor.name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#1A1A1A',
                        }}>
                          {doctor.name}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 3,
                        }}>
                          {doctor.specialty && (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: specStyle.bg,
                              color: specStyle.color,
                            }}>
                              {doctor.specialty}
                            </span>
                          )}
                          <span style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: '#9E9B90',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}>
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: 12 }}
                            >
                              schedule
                            </span>
                            {doctor.avgConsultationMins} min
                          </span>
                        </div>
                      </div>

                      {/* Status dot */}
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: doctor.isActive ? '#2D8B4E' : '#D4D2CC',
                      }} title={doctor.isActive ? 'Actif' : 'Inactif'} />

                      {/* Chevron */}
                      <span
                        className="material-symbols-rounded"
                        style={{
                          fontSize: 18,
                          color: '#D4D2CC',
                          flexShrink: 0,
                          transition: 'transform 0.25s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        expand_more
                      </span>
                    </div>

                    {/* Expandable section */}
                    <div
                      style={{
                        maxHeight: isExpanded ? 320 : 0,
                        opacity: isExpanded ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease, padding 0.35s ease',
                        paddingTop: isExpanded ? 12 : 0,
                        paddingBottom: isExpanded ? 4 : 0,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Active toggle row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                      }}>
                        <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>
                          Actif
                        </span>
                        <div
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            position: 'relative',
                            cursor: 'pointer',
                            flexShrink: 0,
                            background: doctor.isActive ? '#0F7B6C' : '#E8E6DF',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => handleToggleActive(doctor)}
                        >
                          <div style={{
                            position: 'absolute',
                            top: 3,
                            left: doctor.isActive ? 23 : 3,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#FFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s',
                          }} />
                        </div>
                      </div>

                      {/* Duration stepper row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                      }}>
                        <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>
                          Durée consultation
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1.5px solid #E8E6DF',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}>
                          <button
                            style={{
                              width: 32,
                              height: 32,
                              background: '#F0EFEA',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6B6960',
                              fontSize: 16,
                              fontWeight: 700,
                            }}
                            onClick={() => handleDurationChange(doctor, -5)}
                            disabled={doctor.avgConsultationMins <= 5}
                          >
                            &minus;
                          </button>
                          <div style={{
                            width: 36,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#1A1A1A',
                            background: '#FFF',
                            borderLeft: '1.5px solid #E8E6DF',
                            borderRight: '1.5px solid #E8E6DF',
                          }}>
                            {doctor.avgConsultationMins}
                          </div>
                          <button
                            style={{
                              width: 32,
                              height: 32,
                              background: '#F0EFEA',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6B6960',
                              fontSize: 16,
                              fontWeight: 700,
                            }}
                            onClick={() => handleDurationChange(doctor, 5)}
                            disabled={doctor.avgConsultationMins >= 60}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{
                        height: 1,
                        background: '#E8E6DF',
                        margin: '8px 0',
                      }} />

                      {/* Delete button */}
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: '#FDF0ED',
                          border: '1px solid rgba(217,79,59,0.15)',
                          color: '#D94F3B',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          width: '100%',
                          justifyContent: 'center',
                          marginTop: 8,
                          transition: 'background 0.15s',
                        }}
                        onClick={() => setDeletingDoctor(doctor)}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FBDDD6'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FDF0ED'; }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                          delete
                        </span>
                        Supprimer ce médecin
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add doctor form */}
          <div style={{
            padding: 16,
            background: '#FFFFFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            marginTop: 16,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#0F7B6C' }}>
                person_add
              </span>
              Ajouter un médecin
            </div>

            {/* Name input */}
            <div style={{ marginBottom: 10 }}>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#9E9B90',
                marginBottom: 4,
              }}>
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Ex: Dr. Fatma Trabelsi"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddDoctor(); }}
                style={{
                  width: '100%',
                  height: 40,
                  background: '#F6F5F0',
                  border: '1.5px solid #E8E6DF',
                  borderRadius: 8,
                  padding: '0 12px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: '#1A1A1A',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0F7B6C';
                  e.currentTarget.style.background = '#FFF';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#E8E6DF';
                  e.currentTarget.style.background = '#F6F5F0';
                }}
              />
            </div>

            {/* Specialty select */}
            <div style={{ marginBottom: 10 }}>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#9E9B90',
                marginBottom: 4,
              }}>
                Spécialité
              </label>
              <select
                value={newSpecialty}
                onChange={e => setNewSpecialty(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  background: '#F6F5F0',
                  border: '1.5px solid #E8E6DF',
                  borderRadius: 8,
                  padding: '0 10px',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: newSpecialty ? '#1A1A1A' : '#B8B5AD',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%239E9B90'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                }}
              >
                <option value="" disabled>Choisir une spécialité</option>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Add button */}
            <button
              onClick={handleAddDoctor}
              disabled={addingDoctor || !newName.trim()}
              style={{
                height: 40,
                background: addingDoctor || !newName.trim() ? '#A8D5CE' : '#0F7B6C',
                border: 'none',
                borderRadius: 8,
                color: '#FFF',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: addingDoctor || !newName.trim() ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 12,
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
              {doctors.length === 0 ? 'Ajouter votre premier médecin' : 'Ajouter'}
            </button>
          </div>
        </div>

        {/* Confirmation dialog overlay */}
        {deletingDoctor && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setDeletingDoctor(null)}
          >
            <div
              style={{
                background: '#FFF',
                borderRadius: 16,
                padding: 24,
                maxWidth: 300,
                width: '100%',
                textAlign: 'center',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#FDF0ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#D94F3B' }}>
                  delete
                </span>
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1A1A1A',
                marginBottom: 4,
              }}>
                Supprimer ce médecin ?
              </div>
              <div style={{
                fontSize: 13,
                color: '#6B6960',
                lineHeight: 1.5,
                marginBottom: 16,
              }}>
                {deletingDoctor.name} sera retiré de votre équipe. Cette action est irréversible.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDeletingDoctor(null)}
                  style={{
                    flex: 1,
                    height: 40,
                    background: '#F6F5F0',
                    border: '1px solid #E8E6DF',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6B6960',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    height: 40,
                    background: '#D94F3B',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFF',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    opacity: deleteLoading ? 0.7 : 1,
                  }}
                >
                  {deleteLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
