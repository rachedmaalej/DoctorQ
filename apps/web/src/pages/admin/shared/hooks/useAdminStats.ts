import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ClinicRanking, ChurnRiskClinic } from '@/types';
import type { AdminStatsVM } from '../types';

type Period = 'today' | '7d' | '30d' | 'all';

export function useAdminStats(initialPeriod: Period = '30d') {
  const [stats, setStats] = useState<AdminStatsVM | null>(null);
  const [clinicRankings, setClinicRankings] = useState<ClinicRanking[]>([]);
  const [churnRiskClinics, setChurnRiskClinics] = useState<ChurnRiskClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const fetchData = useCallback(async () => {
    try {
      // Sequential fetches to prevent pgbouncer pool exhaustion
      const metrics = await api.getAdminMetricsWithTrends(period);
      const sub = await api.getSubscriptionMetrics();

      setClinicRankings(metrics.clinicRankings);
      setChurnRiskClinics(metrics.churnRiskClinics);

      setStats({
        activeClinics: metrics.activeClinics,
        activeTrials: sub.activeTrials,
        paidSubscriptions: sub.paidSubscriptions,
        mrr: sub.mrrActual,
        conversionRate: sub.trialConversionRate,
        weeklyPatients: metrics.patientsToday,
        dailyActive: sub.dailyActiveClinics,
        deltas: {
          activeClinics: metrics.trends.patients,
          paidSubscriptions: null,
          mrr: metrics.trends.collection,
          conversionRate: null,
          weeklyPatients: metrics.trends.patients,
        },
      });
    } catch {
      // Silently fail — loading state handles empty
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { stats, loading, period, setPeriod, clinicRankings, churnRiskClinics };
}
