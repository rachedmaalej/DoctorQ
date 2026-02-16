import type { ActivityEventVM } from '../../shared/types';
import { formatRelativeTime } from '../../shared/utils';

interface ActivityFeedPanelProps {
  activities: ActivityEventVM[];
  loading: boolean;
}

export default function ActivityFeedPanel({ activities, loading }: ActivityFeedPanelProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e0d8', padding: '3rem' }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c0392b]" />
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-label="Fil d'activite"
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e0d8', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '1rem 1.3rem', borderBottom: '1px solid #e5e0d8' }}>
        <h2 className="font-playfair font-semibold" style={{ fontSize: '0.92rem', color: '#1a1a2e' }}>
          Fil d'Activite
        </h2>
      </div>

      {/* Items — text only, no dots */}
      {activities.length === 0 ? (
        <div className="text-center font-dm" style={{ padding: '2rem', color: '#999999', fontSize: '0.8rem' }}>
          Aucune activite recente
        </div>
      ) : (
        <div>
          {activities.map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: '0.65rem 1.3rem',
                borderBottom: i < activities.length - 1 ? '1px solid #f0ebe4' : 'none',
              }}
            >
              <div className="font-dm" style={{ fontSize: '0.8rem', color: '#1a1a2e' }}>
                {item.message}
              </div>
              <div className="font-dm" style={{ fontSize: '0.68rem', color: '#999999', marginTop: '0.1rem' }}>
                {formatRelativeTime(item.createdAt, 'fr')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
