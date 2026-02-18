import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EngagementSummary } from '@/types';

export function useEngagementSummary() {
  const [data, setData] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getEngagementSummary();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load engagement summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
