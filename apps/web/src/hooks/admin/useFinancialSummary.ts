import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { FinancialSummary } from '@/types';

export function useFinancialSummary() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getFinancialSummary();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
