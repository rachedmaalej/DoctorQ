import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface TierUsageData {
  tier: string;
  limits: { dailyPatients: number; maxDoctors: number };
  usage: { dailyPatientCount: number };
}

export default function TierUsageBanner() {
  const [data, setData] = useState<TierUsageData | null>(null);

  useEffect(() => {
    api.getSubscription()
      .then((sub) => {
        setData({
          tier: sub.tier,
          limits: sub.limits,
          usage: sub.usage,
        });
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Don't show for CLINIQUE (unlimited) or if limits are infinite
  if (data.tier === 'CLINIQUE' || data.limits.dailyPatients === Infinity) return null;

  const used = data.usage.dailyPatientCount;
  const limit = data.limits.dailyPatients;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;
  const isAtLimit = used >= limit;

  // Only show when usage is noteworthy (>60% or at limit)
  if (pct < 60) return null;

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm ${
      isAtLimit
        ? 'bg-red-50 border border-red-200'
        : isNearLimit
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${
            isAtLimit ? 'text-red-800' : isNearLimit ? 'text-amber-800' : 'text-blue-800'
          }`}>
            {isAtLimit
              ? `Limite atteinte — ${used}/${limit} patients aujourd'hui`
              : `${used}/${limit} patients aujourd'hui`}
          </p>
          <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden w-full max-w-[200px]">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {(isNearLimit || isAtLimit) && data.tier !== 'CLINIQUE' && (
        <Link
          to="/subscription"
          className={`shrink-0 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
            isAtLimit
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          Passer au niveau supérieur
        </Link>
      )}
    </div>
  );
}
