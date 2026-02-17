import { useNavigate } from 'react-router-dom';
import type { ClinicHealth } from '@/types';
import type { DirectorySort } from '../../shared/types';

const STATUS_PILLS: Record<string, { bg: string; color: string; label: string }> = {
  TRIAL: { bg: '#fef3c7', color: '#92400e', label: 'ESSAI' },
  ACTIVE: { bg: '#dcfce7', color: '#166534', label: 'Actif' },
  EXPIRED: { bg: '#f3f4f6', color: '#6b7280', label: 'Résilié' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: 'Résilié' },
  PAST_DUE: { bg: '#fee2e2', color: '#991b1b', label: 'À Risque' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

interface ClinicTableProps {
  clinics: ClinicHealth[];
  totalCount: number;
  sort: DirectorySort;
  onToggleSort: (field: DirectorySort['field']) => void;
  onExtend: (clinicId: string, clinicName: string) => void;
  onUpgrade: (clinicId: string, clinicName: string) => void;
}

export default function ClinicTable({ clinics, totalCount, sort, onToggleSort, onExtend, onUpgrade }: ClinicTableProps) {
  const navigate = useNavigate();

  const getSortIcon = (field: string) => {
    if (sort.field !== field) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  const thStyle: React.CSSProperties = {
    padding: '0.65rem 1.2rem',
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#999',
    fontWeight: 500,
    borderBottom: '1px solid #e5e0d8',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1.2rem',
    fontSize: '0.82rem',
    fontFamily: "'DM Sans', sans-serif",
    color: '#1a1a2e',
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e0d8',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => onToggleSort('name')}>
              Cabinet {getSortIcon('name')}
            </th>
            <th style={thStyle}>Abonnement</th>
            <th style={thStyle}>Fin d'essai</th>
            <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => onToggleSort('lastActive')}>
              Dernière activité {getSortIcon('lastActive')}
            </th>
            <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => onToggleSort('patients')}>
              Patients {getSortIcon('patients')}
            </th>
            <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => onToggleSort('joined')}>
              Inscrit {getSortIcon('joined')}
            </th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clinics.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#999', padding: '2rem' }}>
                {totalCount === 0 ? 'Aucun cabinet.' : 'Aucun cabinet ne correspond aux filtres.'}
              </td>
            </tr>
          ) : (
            clinics.map((clinic, i) => {
              const pill = STATUS_PILLS[clinic.subscriptionStatus] || STATUS_PILLS.TRIAL;
              return (
                <tr
                  key={clinic.id}
                  style={{
                    borderBottom: i < clinics.length - 1 ? '1px solid #f0ebe4' : 'none',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9f6f2'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>{clinic.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#999' }}>{clinic.email}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.55rem',
                        borderRadius: 100,
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        background: pill.bg,
                        color: pill.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {pill.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>{formatDate(clinic.trialEndsAt)}</td>
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>{formatRelativeDate(clinic.lastLoginAt)}</td>
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>{clinic.patientsToday}</td>
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>{formatDate(clinic.createdAt)}</td>
                  <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {clinic.subscriptionStatus === 'TRIAL' && (
                        <button
                          onClick={() => onExtend(clinic.id, clinic.name)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 5,
                            fontSize: '0.7rem',
                            border: '1px solid #c0392b',
                            background: '#fff',
                            color: '#c0392b',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Prolonger
                        </button>
                      )}
                      {(clinic.subscriptionStatus === 'TRIAL' || clinic.subscriptionStatus === 'EXPIRED') && (
                        <button
                          onClick={() => onUpgrade(clinic.id, clinic.name)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 5,
                            fontSize: '0.7rem',
                            border: '1px solid #e5e0d8',
                            background: '#fff',
                            color: '#1a1a2e',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Upgrader
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 5,
                          fontSize: '0.7rem',
                          border: '1px solid #e5e0d8',
                          background: '#fff',
                          color: '#1a1a2e',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Voir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div
        style={{
          padding: '0.7rem 1.2rem',
          fontSize: '0.75rem',
          color: '#999',
          borderTop: '1px solid #e5e0d8',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {clinics.length} cabinets sur {totalCount}
      </div>
    </div>
  );
}
