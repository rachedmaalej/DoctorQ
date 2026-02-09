import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import type { AdminMetricsWithTrends, SubscriptionMetrics, OnboardingFunnel } from '../../../types';
import MetricCardWithTrend from '../MetricCardWithTrend';
import ClinicRankingCard from '../ClinicRankingCard';
import ChurnRiskCard from '../ChurnRiskCard';
import ActivityFeed from '../ActivityFeed';
import OnboardingFunnelChart from '../charts/OnboardingFunnelChart';

type Period = 'today' | '7d' | '30d' | 'all';

export default function OverviewTab() {
  const [metrics, setMetrics] = useState<AdminMetricsWithTrends | null>(null);
  const [subMetrics, setSubMetrics] = useState<SubscriptionMetrics | null>(null);
  const [funnel, setFunnel] = useState<OnboardingFunnel | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Sequential fetches to prevent pgbouncer pool exhaustion
        const metricsData = await api.getAdminMetricsWithTrends(period);
        setMetrics(metricsData);
        const subData = await api.getSubscriptionMetrics();
        setSubMetrics(subData);
        const funnelData = await api.getOnboardingFunnel();
        setFunnel(funnelData);
      } catch {
        // Error handled in parent
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh every 60 seconds (reduced to prevent pgbouncer pool exhaustion)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period]);

  if (loading && !metrics) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Period Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#132E2C] tracking-tight">Business Overview</h2>
        <div className="inline-flex border border-[#E6F2F0] rounded-lg p-0.5">
          {(['today', '7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-[#267B75] text-white'
                  : 'text-[#8AADAA] hover:text-[#4E7572]'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription KPIs — flat on page, no card container */}
      <div className="grid grid-cols-5 gap-0 py-5 border-b border-[#E6F2F0]">
        <MetricCardWithTrend label="Active Trials" value={subMetrics?.activeTrials || 0} subtext="" color="blue" />
        <MetricCardWithTrend label="Paid Subscriptions" value={subMetrics?.paidSubscriptions || 0} subtext="" color="green" />
        <MetricCardWithTrend label="MRR" value={`${subMetrics?.mrrActual || 0} TND`} subtext="" color="purple" />
        <MetricCardWithTrend label="Conversion Rate" value={`${subMetrics?.trialConversionRate || 0}%`} subtext="" color="indigo" />
        <MetricCardWithTrend label="Daily Active" value={subMetrics?.dailyActiveClinics || 0} subtext="" color="yellow" />
      </div>

      {/* Operational Metrics — flat on page, no card container */}
      <div className="grid grid-cols-4 gap-0 py-5 border-b border-[#E6F2F0] mb-7">
        <MetricCardWithTrend label="Patients" value={metrics?.patientsToday || 0} subtext="" color="indigo" trend={metrics?.trends.patients} />
        <MetricCardWithTrend label="QR Rate" value={`${metrics?.qrCheckinRate || 0}%`} subtext="" color="purple" trend={metrics?.trends.qrRate} />
        <MetricCardWithTrend label="At Risk" value={metrics?.atRiskClinics || 0} subtext="" color="gray" trend={metrics?.trends.atRisk} />
        <MetricCardWithTrend label="Collection" value={`${metrics?.totalClinics ? Math.round(((metrics?.paidThisMonth || 0) / metrics.totalClinics) * 100) : 0}%`} subtext="" color="green" trend={metrics?.trends.collection} />
      </div>

      {/* Patient Volume (2/3) + Activity Feed (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-7">
        <div className="lg:col-span-2">
          <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Patient Volume</h3>
          {metrics && metrics.patientsByDay?.length > 0 ? (
            <>
              <div className="h-24 flex items-end gap-2">
                {metrics.patientsByDay?.slice(-14).map((day, i) => {
                  const maxCount = Math.max(...metrics.patientsByDay.map((d) => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-colors"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                        backgroundColor: i % 3 === 2 ? '#459FB8' : '#267B75',
                        opacity: i % 2 === 0 ? 0.18 : 0.4,
                      }}
                      title={`${day.date}: ${day.count} patients`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#8AADAA]">
                <span>{metrics.patientsByDay?.[metrics.patientsByDay.length - 14]?.date?.slice(5) || ''}</span>
                <span>{metrics.patientsByDay?.[metrics.patientsByDay.length - 1]?.date?.slice(5) || ''}</span>
              </div>
            </>
          ) : (
            <div className="h-24 flex items-center justify-center text-sm text-[#8AADAA]">No patient data yet</div>
          )}
        </div>
        <ActivityFeed />
      </div>

      {/* Onboarding Funnel + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-7">
        {funnel && <OnboardingFunnelChart data={funnel} />}

        {metrics && metrics.revenueByMonth?.length > 0 && (
          <div>
            <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Revenue (Last 6 Months)</h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {metrics.revenueByMonth?.map((month, i) => {
                const maxRevenue = Math.max(...metrics.revenueByMonth.map((m) => m.expected), 1);
                const expectedHeight = (month.expected / maxRevenue) * 100;
                const collectedPercent = month.expected > 0 ? (month.collected / month.expected) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full relative" style={{ height: `${expectedHeight}%` }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t"
                        style={{ height: `${collectedPercent}%`, backgroundColor: '#267B75', opacity: 0.4 }}
                        title={`Collected: ${month.collected} TND`}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 border-2 border-dashed rounded-t"
                        style={{ height: '100%', borderColor: '#D0E8E5' }}
                        title={`Expected: ${month.expected} TND`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#8AADAA]">
              {metrics.revenueByMonth?.map((month, i) => (
                <span key={i}>{month.month.slice(5)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance & Risk */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ClinicRankingCard rankings={metrics.clinicRankings || []} />
          <ChurnRiskCard clinics={metrics.churnRiskClinics || []} />
        </div>
      )}
    </div>
  );
}
