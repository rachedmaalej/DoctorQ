import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { ActivityItem } from '../../types';

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString('fr-FR');
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await api.getActivityFeed(20);
      setItems(data);
    } catch {
      // Silently fail for activity feed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  if (loading) {
    return (
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Activity</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#267B75]"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Activity</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[#8AADAA] text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-0">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b border-[#E6F2F0] last:border-b-0 text-[13px]">
              <span className="text-[#8AADAA]">&mdash;</span>
              <span className="text-[#4E7572] flex-1 min-w-0 truncate">{item.description}</span>
              <span className="text-xs text-[#8AADAA] whitespace-nowrap ml-auto">{formatTimeAgo(item.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
