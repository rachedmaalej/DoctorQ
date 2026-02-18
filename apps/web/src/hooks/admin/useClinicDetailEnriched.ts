import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ClinicDetailEnriched } from '@/types';

export function useClinicDetailEnriched(clinicId: string | undefined) {
  const [data, setData] = useState<ClinicDetailEnriched | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.getAdminClinicDetailEnriched(clinicId);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
