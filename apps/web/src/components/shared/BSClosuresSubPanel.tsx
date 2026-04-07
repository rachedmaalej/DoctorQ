import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSClosuresSubPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Closure {
  id: string;
  date: string;
  reason: string | null;
}

const FRENCH_HOLIDAYS_2026: { date: string; reason: string }[] = [
  { date: '2026-01-01', reason: "Jour de l'An" },
  { date: '2026-04-06', reason: 'Lundi de Pâques' },
  { date: '2026-05-01', reason: 'Fête du Travail' },
  { date: '2026-05-08', reason: 'Victoire 1945' },
  { date: '2026-05-14', reason: 'Ascension' },
  { date: '2026-05-25', reason: 'Lundi de Pentecôte' },
  { date: '2026-07-14', reason: 'Fête nationale' },
  { date: '2026-08-15', reason: 'Assomption' },
  { date: '2026-11-01', reason: 'Toussaint' },
  { date: '2026-11-11', reason: 'Armistice 1918' },
  { date: '2026-12-25', reason: 'Noël' },
];

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function isInPast(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export default function BSClosuresSubPanel({ isOpen, onClose }: BSClosuresSubPanelProps) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  // Fetch closures on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getClosures()
        .then(setClosures)
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

  const handleAdd = useCallback(async () => {
    if (!newDate) return;
    setAdding(true);
    setError('');
    try {
      const closure = await api.addClosure(newDate, newReason || undefined);
      setClosures(prev => [...prev, closure].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDate('');
      setNewReason('');
    } catch (err: any) {
      if (err?.code === 'CLOSURE_EXISTS') {
        setError('Cette date est déjà marquée comme fermée');
      } else {
        setError("Erreur lors de l'ajout");
      }
    } finally {
      setAdding(false);
    }
  }, [newDate, newReason]);

  const handleDelete = useCallback(async (id: string) => {
    setClosures(prev => prev.filter(c => c.id !== id));
    try {
      await api.deleteClosure(id);
    } catch {
      // Re-fetch on error
      const fresh = await api.getClosures();
      setClosures(fresh);
    }
  }, []);

  const handleSeedHolidays = useCallback(async () => {
    setAdding(true);
    const existingDates = new Set(closures.map(c => c.date.slice(0, 10)));
    const toAdd = FRENCH_HOLIDAYS_2026.filter(h => !existingDates.has(h.date));
    try {
      const added: Closure[] = [];
      for (const h of toAdd) {
        try {
          const c = await api.addClosure(h.date, h.reason);
          added.push(c);
        } catch {
          // skip duplicates
        }
      }
      setClosures(prev => [...prev, ...added].sort((a, b) => a.date.localeCompare(b.date)));
    } finally {
      setAdding(false);
    }
  }, [closures]);

  // Split into upcoming / past
  const upcoming = closures.filter(c => !isInPast(c.date.slice(0, 10)));
  const past = closures.filter(c => isInPast(c.date.slice(0, 10)));

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} style={{ zIndex: 229 }} />}

      <div
        className={`bs-right-panel ${isOpen ? 'open' : ''}`}
        style={{ zIndex: 230 }}
      >
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Jours fériés & congés</span>
        </div>

        <div className="bs-panel-body">
          {/* Add closure form */}
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
              Ajouter une fermeture
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                style={{
                  flex: 1, height: 40, border: '1.5px solid #E8E6DF', borderRadius: 8,
                  padding: '0 10px', fontFamily: 'inherit', fontSize: 13, color: '#1A1A1A',
                  outline: 'none', background: '#F6F5F0',
                }}
              />
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="Motif (optionnel)"
                maxLength={200}
                style={{
                  flex: 1, height: 40, border: '1.5px solid #E8E6DF', borderRadius: 8,
                  padding: '0 10px', fontFamily: 'inherit', fontSize: 13, color: '#1A1A1A',
                  outline: 'none', background: '#F6F5F0',
                }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newDate || adding}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: 'none',
                background: !newDate ? '#E8E6DF' : '#0F7B6C', color: !newDate ? '#9E9B90' : 'white',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: !newDate ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
              Ajouter
            </button>
            {error && (
              <div style={{ fontSize: 12, color: '#D94F3B', marginTop: 6 }}>{error}</div>
            )}
          </div>

          {/* Quick-seed French holidays */}
          <button
            onClick={handleSeedHolidays}
            disabled={adding}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1.5px solid #E8E6DF', background: '#FFF',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              color: '#6B6960', cursor: 'pointer', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>flag</span>
            Ajouter les jours fériés 2026
          </button>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#9E9B90', fontSize: 13 }}>
              Chargement...
            </div>
          )}

          {/* Upcoming closures */}
          {!loading && upcoming.length > 0 && (
            <>
              <div className="bs-settings-label">À venir</div>
              <div style={{
                background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
                overflow: 'hidden', marginBottom: 20,
              }}>
                {upcoming.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: idx < upcoming.length - 1 ? '1px solid #F0EFEA' : 'none',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#D94F3B' }}>
                      event_busy
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                        {formatDateFr(c.date.slice(0, 10))}
                      </div>
                      {c.reason && (
                        <div style={{ fontSize: 11, color: '#6B6960', marginTop: 1 }}>
                          {c.reason}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: '#FDF0ED', color: '#D94F3B', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Past closures (collapsed, muted) */}
          {!loading && past.length > 0 && (
            <>
              <div className="bs-settings-label" style={{ color: '#B8B5AD' }}>Passées</div>
              <div style={{
                background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
                overflow: 'hidden', opacity: 0.6,
              }}>
                {past.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px',
                      borderBottom: idx < past.length - 1 ? '1px solid #F0EFEA' : 'none',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>
                      event_available
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#6B6960' }}>
                        {formatDateFr(c.date.slice(0, 10))}
                        {c.reason && ` — ${c.reason}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && closures.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9E9B90' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
                calendar_today
              </span>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Aucune fermeture planifiée
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                Ajoutez les jours fériés et congés pour empêcher les check-ins ces jours-là
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
