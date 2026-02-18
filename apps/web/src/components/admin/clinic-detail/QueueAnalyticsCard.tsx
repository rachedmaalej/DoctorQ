import { useState } from 'react';
import type { ClinicDetailEnriched } from '@/types';
import { Card } from '@/components/admin/ui';
import WeeklyBarChart from './WeeklyBarChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import CheckInMethodsChart from './CheckInMethodsChart';

interface Props {
  clinic: ClinicDetailEnriched;
}

type AnalyticsView = 'weekly' | 'monthly' | 'methods';

const TABS: Array<{ key: AnalyticsView; label: string }> = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: '30 Days' },
  { key: 'methods', label: 'Check-in Methods' },
];

export default function QueueAnalyticsCard({ clinic }: Props) {
  const [view, setView] = useState<AnalyticsView>('weekly');

  return (
    <Card
      title="Queue Analytics"
      subtitle="Patient volume, wait times, and check-in method over time"
      headerRight={
        <div style={{
          display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 8, padding: 3,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: view === tab.key ? 600 : 500,
                cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif",
                background: view === tab.key ? '#fff' : 'none',
                color: view === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: view === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ padding: view === 'methods' ? 0 : 20 }}>
        {view === 'weekly' && <WeeklyBarChart data={clinic.weeklyChartData} />}
        {view === 'monthly' && <MonthlyTrendChart data={clinic.monthlyChartData} patientsLast30Days={clinic.patientsLast30Days} />}
        {view === 'methods' && <CheckInMethodsChart data={clinic.methodChartData} qrAdoptionRate={clinic.qrAdoptionRate} />}
      </div>
    </Card>
  );
}
