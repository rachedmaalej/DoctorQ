import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface MrrLineChartProps {
  data: Array<{
    month: string;
    totalMrr: number;
    newMrr: number;
    churnedMrr: number;
  }>;
}

export default function MrrLineChart({ data }: MrrLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.month.slice(2), // "2026-01" -> "26-01"
  }));

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">
        MRR Trend (12 Months)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6F2F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8AADAA' }} />
            <YAxis tick={{ fontSize: 12, fill: '#8AADAA' }} tickFormatter={(v) => `${v}`} />
            <Tooltip
              formatter={(value, name) => [
                `${value ?? 0} TND`,
                name === 'totalMrr' ? 'Total MRR' : name === 'newMrr' ? 'New MRR' : 'Churned MRR',
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend
              formatter={(value) =>
                value === 'totalMrr' ? 'Total MRR' : value === 'newMrr' ? 'New MRR' : 'Churned MRR'
              }
            />
            <Line type="monotone" dataKey="totalMrr" stroke="#267B75" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="newMrr" stroke="#459FB8" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="churnedMrr" stroke="#E15720" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
