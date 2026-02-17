import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { ClinicRanking, ChurnRiskClinic } from '@/types';
import type { AdminClinicVM } from '../types';
import { getInitials } from '../utils';

interface UseClinicListOptions {
  clinicRankings?: ClinicRanking[];
  churnRiskClinics?: ChurnRiskClinic[];
}

export function useClinicList(options: UseClinicListOptions = {}) {
  const [clinics, setClinics] = useState<AdminClinicVM[]>([]);
  const [loading, setLoading] = useState(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    try {
      const clinicList = await api.getAdminClinics();
      const { clinicRankings = [], churnRiskClinics = [] } = optionsRef.current;

      const rankingMap = new Map(
        clinicRankings.map((r) => [r.id, r])
      );
      const churnMap = new Map(
        churnRiskClinics.map((c) => [c.id, c.riskLevel])
      );

      const merged: AdminClinicVM[] = clinicList.map((c) => {
        const ranking = rankingMap.get(c.id);
        return {
          id: c.id,
          name: c.name,
          doctorName: c.doctorName,
          email: c.email,
          subscriptionStatus: c.subscriptionStatus || 'TRIAL',
          patientsToday: c.patientsToday,
          patientsThisMonth: ranking?.patientsThisMonth ?? 0,
          trend: ranking?.trend ?? null,
          lastActiveAt: c.lastLoginAt,
          initials: getInitials(c.name),
          churnRisk: churnMap.get(c.id) ?? null,
        };
      });

      merged.sort((a, b) => b.patientsThisMonth - a.patientsThisMonth);
      setClinics(merged);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { clinics, loading, refetch: fetchData };
}
