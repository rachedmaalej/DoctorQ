import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import type { FinancialAnalytics } from '../../../types';
import { webBrand } from '../../../lib/brand';
import MetricCardWithTrend from '../MetricCardWithTrend';
import MrrLineChart from '../charts/MrrLineChart';
import SubscriptionPieChart from '../charts/SubscriptionPieChart';

export default function FinancialTab() {
  const [data, setData] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getFinancialAnalytics();
        setData(result);
      } catch {
        // Error handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-[#8AADAA] py-8">Failed to load financial data</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-[#132E2C] tracking-tight mb-6">Financial Analytics</h2>

      {/* Financial KPIs — flat on page, no card container */}
      <div className="grid grid-cols-5 gap-0 py-5 border-b border-[#E6F2F0] mb-8">
        <MetricCardWithTrend label="MRR" value={`${data.mrr} ${webBrand.currency.symbol}`} subtext="" color="purple" />
        <MetricCardWithTrend label="MRR Growth" value={`${data.mrrGrowthRate > 0 ? '+' : ''}${data.mrrGrowthRate}%`} subtext="" color={data.mrrGrowthRate >= 0 ? 'green' : 'red'} />
        <MetricCardWithTrend label="ARPU" value={`${data.arpu} ${webBrand.currency.symbol}`} subtext="" color="blue" />
        <MetricCardWithTrend label="CLTV" value={`${data.cltv} ${webBrand.currency.symbol}`} subtext="" color="indigo" />
        <MetricCardWithTrend label="Churn Rate" value={`${data.churnRateRevenue}%`} subtext="" color={data.churnRateRevenue <= 5 ? 'green' : 'red'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MrrLineChart data={data.mrrHistory} />
        <SubscriptionPieChart data={data.subscriptionBreakdown} />
      </div>

      {/* Revenue Breakdown Table */}
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Monthly Revenue History</h3>
      <div className="border border-[#E6F2F0] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-[#E6F2F0]">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Total MRR</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">New MRR</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Churned MRR</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6F2F0]">
            {data.mrrHistory.slice().reverse().map((month) => (
              <tr key={month.month} className="hover:bg-[#F3FAF9] transition-colors">
                <td className="px-6 py-3 text-sm text-[#132E2C]">{month.month}</td>
                <td className="px-6 py-3 text-sm text-[#132E2C]">{month.totalMrr} {webBrand.currency.symbol}</td>
                <td className="px-6 py-3 text-sm text-[#337023]">+{month.newMrr} {webBrand.currency.symbol}</td>
                <td className="px-6 py-3 text-sm text-[#E15720]">-{month.churnedMrr} {webBrand.currency.symbol}</td>
                <td className="px-6 py-3 text-sm font-medium">
                  <span className={month.newMrr - month.churnedMrr >= 0 ? 'text-[#337023]' : 'text-[#E15720]'}>
                    {month.newMrr - month.churnedMrr >= 0 ? '+' : ''}{month.newMrr - month.churnedMrr} {webBrand.currency.symbol}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
