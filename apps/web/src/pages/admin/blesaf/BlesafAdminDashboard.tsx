import { useAdminStats } from '../shared/hooks/useAdminStats';
import { useClinicList } from '../shared/hooks/useClinicList';
import { useActivityFeed } from '../shared/hooks/useActivityFeed';
import { formatCurrency } from '../shared/utils';
import HeroStatCard from './components/HeroStatCard';
import StatCard from './components/StatCard';
import ClinicTablePanel from './components/ClinicTablePanel';
import ActivityAlertPanel from './components/ActivityAlertPanel';

export default function BlesafAdminDashboard() {
  const { stats, loading: statsLoading, clinicRankings, churnRiskClinics } = useAdminStats();
  const { clinics, loading: clinicsLoading } = useClinicList({ clinicRankings, churnRiskClinics });
  const { activities, loading: activityLoading } = useActivityFeed();

  if (statsLoading && !stats) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a9d6e]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:py-6 lg:px-8" style={{ background: '#f7f5f1', minHeight: 'calc(100vh - 56px)' }}>
      {/* KPI Cards Row */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: '1rem', marginBottom: '1.5rem' }}
      >
        <HeroStatCard
          label="Active Clinics"
          value={stats?.activeClinics ?? 0}
          delta={stats?.deltas.activeClinics}
          animationDelay={0}
        />
        <StatCard
          label="Paid Subscriptions"
          value={stats?.paidSubscriptions ?? 0}
          delta={stats?.deltas.paidSubscriptions}
          animationDelay={50}
        />
        <StatCard
          label="MRR"
          value={formatCurrency(stats?.mrr ?? 0, 'TND')}
          delta={stats?.deltas.mrr}
          animationDelay={100}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats?.conversionRate ?? 0}%`}
          delta={stats?.deltas.conversionRate}
          animationDelay={150}
        />
      </div>

      {/* Dual Column Layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_340px] animate-fade-in-up"
        style={{ gap: '1.5rem', animationDelay: '200ms' }}
      >
        <ClinicTablePanel clinics={clinics} loading={clinicsLoading} />
        <ActivityAlertPanel activities={activities} loading={activityLoading} />
      </div>
    </div>
  );
}
