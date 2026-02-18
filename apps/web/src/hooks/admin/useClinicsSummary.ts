import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ClinicSummary } from '@/types';

export function useClinicsSummary() {
  const [data, setData] = useState<ClinicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getClinicsSummary();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinics summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
