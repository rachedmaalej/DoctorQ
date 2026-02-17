import { useAdminStats } from '../shared/hooks/useAdminStats';
import { useClinicList } from '../shared/hooks/useClinicList';
import { useActivityFeed } from '../shared/hooks/useActivityFeed';
import { formatCurrency, formatNumber } from '../shared/utils';
import KpiCard from './components/KpiCard';
import ClinicPerformancePanel from './components/ClinicPerformancePanel';
import ActivityFeedPanel from './components/ActivityFeedPanel';

export default function AusuivantAdminDashboard() {
  const { stats, loading: statsLoading, clinicRankings, churnRiskClinics } = useAdminStats();
  const { clinics, loading: clinicsLoading } = useClinicList({ clinicRankings, churnRiskClinics });
  const { activities, loading: activityLoading } = useActivityFeed();

  if (statsLoading && !stats) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c0392b]" />
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 lg:py-8 lg:px-10"
      style={{
        background: '#f4f1ec',
        minHeight: 'calc(100vh - 56px)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section Title */}
        <h1
          className="font-playfair font-semibold text-lg md:text-xl"
          style={{ color: '#1a1a2e', marginBottom: '1.2rem' }}
        >
          Vue d'ensemble
        </h1>

        {/* KPI Cards Row */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: '1rem', marginBottom: '2rem' }}
        >
          <KpiCard
            label="Cabinets Actifs"
            value={stats?.activeClinics ?? 0}
            delta={stats?.deltas.activeClinics}
            animationDelay={0}
          />
          <KpiCard
            label="MRR"
            value={formatCurrency(stats?.mrr ?? 0, 'EUR')}
            delta={stats?.deltas.mrr}
            animationDelay={50}
          />
          <KpiCard
            label="Patients / Sem"
            value={formatNumber(stats?.weeklyPatients ?? 0, 'fr')}
            delta={stats?.deltas.weeklyPatients}
            animationDelay={100}
          />
          <KpiCard
            label="Conversion"
            value={`${stats?.conversionRate ?? 0}%`}
            delta={stats?.deltas.conversionRate}
            animationDelay={150}
          />
        </div>

        {/* Dual Panel Layout — equal 50/50 */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 animate-fade-in-up"
          style={{ gap: '1.5rem', animationDelay: '200ms' }}
        >
          <ClinicPerformancePanel clinics={clinics} loading={clinicsLoading} />
          <ActivityFeedPanel activities={activities} loading={activityLoading} />
        </div>
      </div>
    </div>
  );
}
