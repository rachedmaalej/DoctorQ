import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface SubscriptionPieChartProps {
  data: {
    trial: number;
    monthlyActive: number;
    yearlyActive: number;
    pastDue: number;
    expired: number;
    cancelled: number;
  };
}

const ENTRIES = [
  { key: 'trial', label: 'Trial', color: '#459FB8' },
  { key: 'monthlyActive', label: 'Monthly', color: '#267B75' },
  { key: 'yearlyActive', label: 'Yearly', color: '#1F6560' },
  { key: 'pastDue', label: 'Past Due', color: '#E15720' },
  { key: 'expired', label: 'Expired', color: '#8AADAA' },
  { key: 'cancelled', label: 'Cancelled', color: '#D0E8E5' },
] as const;

export default function SubscriptionPieChart({ data }: SubscriptionPieChartProps) {
  const chartData = ENTRIES
    .map((entry) => ({ name: entry.label, value: data[entry.key], color: entry.color }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">
          Subscription Breakdown
        </h3>
        <p className="text-sm text-[#8AADAA] text-center py-8">No subscription data yet</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">
        Subscription Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value ?? 0} clinics`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
