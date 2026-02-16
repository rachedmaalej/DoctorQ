import type { ActivityEventVM } from '../../shared/types';
import { formatRelativeTime } from '../../shared/utils';

interface ActivityAlertPanelProps {
  activities: ActivityEventVM[];
  loading: boolean;
}

const DOT_COLORS: Record<string, string> = {
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8a8a9a',
};

export default function ActivityAlertPanel({ activities, loading }: ActivityAlertPanelProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5df', padding: '3rem' }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2a9d6e]" />
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-label="Activity and alerts"
      style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5df', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '1rem 1.3rem', borderBottom: '1px solid #e8e5df' }}>
        <h2 className="font-outfit font-semibold" style={{ fontSize: '0.95rem', color: '#1a1a2e' }}>
          Activity & Alerts
        </h2>
      </div>

      {/* Items */}
      {activities.length === 0 ? (
        <div className="text-center font-dm" style={{ padding: '2rem', color: '#8a8a9a', fontSize: '0.82rem' }}>
          No recent activity
        </div>
      ) : (
        <div>
          {activities.map((item, i) => (
            <div
              key={item.id}
              className="flex gap-[0.7rem] items-start"
              style={{
                padding: '0.8rem 1.3rem',
                borderBottom: i < activities.length - 1 ? '1px solid #f3f0ec' : 'none',
              }}
            >
              {/* Dot */}
              <div
                aria-hidden="true"
                className="flex-shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  marginTop: '0.35rem',
                  background: DOT_COLORS[item.severity] || DOT_COLORS.info,
                }}
              />
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="font-dm" style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>
                  {item.message}
                </div>
                <div className="font-dm" style={{ fontSize: '0.68rem', color: '#999999', marginTop: '0.15rem' }}>
                  {formatRelativeTime(item.createdAt, 'en')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
