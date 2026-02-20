import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Doctor } from '@/types';
import '@/components/receptionist/receptionist.css';

interface BSTeamAccessPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BSTeamAccessPanel({ isOpen, onClose }: BSTeamAccessPanelProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleAddDoctor = useCallback(async () => {
    if (!newDoctorName.trim()) return;
    setAddingDoctor(true);
    try {
      const doctor = await api.createDoctor({
        name: newDoctorName.trim(),
        specialty: newDoctorSpecialty.trim() || undefined,
      });
      setDoctors(prev => [...prev, doctor]);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
    } catch {
      // silently fail
    } finally {
      setAddingDoctor(false);
    }
  }, [newDoctorName, newDoctorSpecialty]);

  const handleDeleteDoctor = useCallback(async (doctorId: string) => {
    if (!confirm('Supprimer ce médecin ?')) return;
    try {
      await api.deleteDoctor(doctorId);
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
    } catch {
      // silently fail
    }
  }, []);

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
          <div className="bs-settings-label">Médecins</div>
          <div className="bs-settings-group" style={{ padding: '12px 14px' }}>
            {loading ? (
              <div style={{ fontSize: 13, color: '#9E9B90', padding: '8px 0', textAlign: 'center' }}>
                Chargement...
              </div>
            ) : doctors.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9E9B90', padding: '8px 0', textAlign: 'center' }}>
                Aucun médecin ajouté
              </div>
            ) : (
              doctors.map(doctor => (
                <div className="bs-doctor-row" key={doctor.id}>
                  <div
                    className="bs-settings-ico"
                    style={{ background: '#EDF3FC', color: '#3B7DD9', width: 28, height: 28 }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>person</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{doctor.name}</div>
                    {doctor.specialty && (
                      <div style={{ fontSize: 11, color: '#9E9B90' }}>{doctor.specialty}</div>
                    )}
                  </div>
                  <button className="bs-delete-btn" onClick={() => handleDeleteDoctor(doctor.id)}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span>
                  </button>
                </div>
              ))
            )}

            {/* Add doctor row */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input
                className="bs-profile-input"
                type="text"
                placeholder="Nom"
                value={newDoctorName}
                onChange={e => setNewDoctorName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddDoctor(); }}
                style={{ flex: 1, height: 36, fontSize: 12 }}
              />
              <input
                className="bs-profile-input"
                type="text"
                placeholder="Spéc."
                value={newDoctorSpecialty}
                onChange={e => setNewDoctorSpecialty(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddDoctor(); }}
                style={{ flex: 1, height: 36, fontSize: 12 }}
              />
              <button
                className="bs-add-doctor-btn"
                onClick={handleAddDoctor}
                disabled={addingDoctor || !newDoctorName.trim()}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
