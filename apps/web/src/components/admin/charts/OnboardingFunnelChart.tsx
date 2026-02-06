import type { OnboardingFunnel } from '../../../types';

interface OnboardingFunnelChartProps {
  data: OnboardingFunnel;
}

const STEP_COLORS = ['bg-[#267B75]', 'bg-[#459FB8]', 'bg-[#8AADAA]', 'bg-[#337023]'];

export default function OnboardingFunnelChart({ data }: OnboardingFunnelChartProps) {
  const maxCount = Math.max(data.totalSignups, 1);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Onboarding Funnel</h3>
        <span className="text-xs text-[#8AADAA]">
          {data.completionRate}% completion rate
        </span>
      </div>
      <div className="space-y-3">
        {data.steps.map((step, i) => {
          const widthPct = (step.count / maxCount) * 100;
          return (
            <div key={step.step}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-[#4E7572]">
                  {step.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-[#132E2C]">{step.count}</span>
                  {step.dropOffRate > 0 && (
                    <span className="text-xs text-[#E15720]">-{step.dropOffRate}%</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-[#E6F2F0] rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${STEP_COLORS[i] || 'bg-[#8AADAA]'} transition-all duration-500`}
                  style={{ width: `${Math.max(widthPct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
