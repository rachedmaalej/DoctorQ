import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ActivityEventVM } from '../types';
import { getSeverityFromType } from '../utils';

export function useActivityFeed(limit = 20) {
  const [activities, setActivities] = useState<ActivityEventVM[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const items = await api.getActivityFeed(limit);
      setActivities(
        items.map((item) => ({
          id: item.id,
          type: item.type,
          clinicId: item.clinicId,
          clinicName: item.clinicName,
          message: item.description,
          severity: getSeverityFromType(item.type),
          createdAt: item.timestamp,
        }))
      );
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { activities, loading };
}
