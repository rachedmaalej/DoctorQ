import React from 'react';
import { useFinancialSummary } from '@/hooks/admin/useFinancialSummary';
import {
  AlertBanner,
  StatCard,
  Card,
  BadgePill,
  PipelineCard,
  ProgressBar,
} from '@/components/admin/ui';
import type { FinancialSummary, ClinicSummary } from '@/types';

// ─── Helpers ───────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return 'No end date';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nextMonthName(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString('en-US', { month: 'long' });
}

function getPipelineConfig(clinic: ClinicSummary, arpu: number) {
  if (clinic.healthScore === 4) {
    return {
      icon: '\u{1F3C6}',
      iconBg: 'var(--success-pale)',
      accentBorderColor: 'var(--success)',
      intentLabel: 'HIGH intent',
      intentColor: 'var(--success)',
      badge: <BadgePill variant="green">{arpu} TND/mo</BadgePill>,
    };
  }
  if (clinic.healthScore === 3) {
    return {
      icon: '\u{1F4CB}',
      iconBg: 'var(--warning-pale)',
      accentBorderColor: 'var(--warning)',
      intentLabel: 'MEDIUM intent',
      intentColor: 'var(--warning)',
      badge: <BadgePill variant="yellow">{arpu} TND/mo</BadgePill>,
    };
  }
  if (clinic.isInternal) {
    return {
      icon: '\u{1F504}',
      iconBg: 'var(--surface-2)',
      accentBorderColor: '#ccc',
      intentLabel: 'INTERNAL',
      intentColor: 'var(--text-muted)',
      badge: <BadgePill variant="gray">Own demo</BadgePill>,
    };
  }
  if (clinic.churnRisk === 'high') {
    return {
      icon: '\u2744\uFE0F',
      iconBg: 'var(--danger-pale)',
      accentBorderColor: 'var(--danger)',
      intentLabel: 'AT RISK',
      intentColor: 'var(--danger)',
      badge: <BadgePill variant="red">Churn risk</BadgePill>,
    };
  }
  return {
    icon: '\u{1F4CB}',
    iconBg: 'var(--surface-2)',
    accentBorderColor: 'var(--border)',
    intentLabel: 'LOW intent',
    intentColor: 'var(--text-muted)',
    badge: <BadgePill variant="gray">{arpu} TND/mo</BadgePill>,
  };
}

// ─── Sub-sections ──────────────────────────────────────────

function PageHeader({ activeTrials }: { activeTrials: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          Financial Analytics
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}
        >
          Pre-revenue &middot; {activeTrials} trials active &middot; First conversion opportunity
          detected
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select
          style={{
            fontSize: 13,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          defaultValue="30d"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <button
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      </div>
    </div>
  );
}

function OpportunityBanner({ data }: { data: FinancialSummary }) {
  const candidate = data.conversionPipeline.find(
    (c) => !c.isInternal && c.healthScore >= 3 && c.trialEndsAt
  );
  if (!candidate) return null;

  return (
    <AlertBanner
      variant="info"
      icon="\u{1F4A1}"
      title="First conversion opportunity \u2014 act this week"
      body={
        <>
          <strong>{candidate.name}</strong> has strong engagement ({candidate.patientsLast30Days}{' '}
          patients in 30d, {candidate.qrAdoptionRate}% QR adoption) and their trial ends{' '}
          {formatDate(candidate.trialEndsAt)}. A personal outreach now could convert your first
          paying clinic.
        </>
      }
    />
  );
}

function StatsRow({ data }: { data: FinancialSummary }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginBottom: 20,
      }}
    >
      <StatCard
        label="MRR"
        value={data.currentMrr === 0 ? '0' : data.currentMrr}
        subtext="TND \u2014 pre-revenue"
        dotColor="var(--text-muted)"
        valueColor="muted"
      />
      <StatCard
        label="Projected MRR"
        value={data.projectedMrrBestCase}
        subtext="if all trials convert"
        variant="accent"
        dotColor="var(--accent)"
        valueColor="accent-dark"
      />
      <StatCard
        label="Trials Expiring"
        value={data.trialsExpiringSoon}
        subtext="in < 30 days"
        variant="warning"
        dotColor="var(--warning)"
      />
      <StatCard
        label="High-Intent Trials"
        value={data.highIntentTrials}
        subtext="likely to convert"
        dotColor="var(--brand-light)"
      />
      <StatCard
        label="At-Risk Trials"
        value={data.atRiskTrials}
        subtext="inactive 14+ days"
        variant="danger"
        dotColor="var(--danger)"
      />
    </div>
  );
}

function ConversionPipeline({ data }: { data: FinancialSummary }) {
  return (
    <Card title="Trial Conversion Pipeline" subtitle="Ranked by likelihood to convert">
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.conversionPipeline.map((clinic) => {
          const config = getPipelineConfig(clinic, data.arpu);
          const meta = `${clinic.patientsLast30Days} patients \u00B7 ${clinic.qrAdoptionRate}% QR \u00B7 ${
            clinic.trialEndsAt ? 'Trial ends ' + formatDate(clinic.trialEndsAt) : 'No end date'
          }`;
          return (
            <PipelineCard
              key={clinic.id}
              icon={config.icon}
              iconBg={config.iconBg}
              title={clinic.name}
              meta={meta}
              intentLabel={config.intentLabel}
              intentColor={config.intentColor}
              badge={config.badge}
              accentBorderColor={config.accentBorderColor}
            />
          );
        })}
      </div>
    </Card>
  );
}

function RevenueScenarios({ data }: { data: FinancialSummary }) {
  const bestCasePct = 100;
  const likelyPct =
    data.activeTrials > 0 ? Math.round((data.highIntentTrials / data.activeTrials) * 100) : 0;
  const conservativePct = data.activeTrials > 0 ? Math.round((1 / data.activeTrials) * 100) : 0;

  return (
    <Card title="Revenue Scenarios" subtitle="Based on current trial status">
      <div style={{ padding: 20 }}>
        {/* Top large numbers */}
        <div style={{ display: 'flex', gap: 40 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Current MRR
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'var(--mono)',
                letterSpacing: -1.5,
                color: 'var(--text-muted)',
                lineHeight: 1,
              }}
            >
              0 TND
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Best Case MRR
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'var(--mono)',
                letterSpacing: -1.5,
                color: 'var(--brand)',
                lineHeight: 1,
              }}
            >
              {data.projectedMrrBestCase} TND
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ProgressBar
            label={`Best case (all ${data.activeTrials} trials)`}
            value={bestCasePct}
            color="var(--brand-light)"
            height={10}
            displayValue={`${data.projectedMrrBestCase} TND`}
          />
          <ProgressBar
            label={`Likely (${data.highIntentTrials} high-intent)`}
            value={likelyPct}
            color="var(--accent)"
            height={10}
            displayValue={`${data.projectedMrrLikely} TND`}
          />
          <ProgressBar
            label="Conservative (1 conversion)"
            value={conservativePct}
            color="var(--text-muted)"
            height={10}
            displayValue={`${data.arpu} TND`}
          />
        </div>

        {/* Metrics list */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            marginTop: 20,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {[
            { label: 'Target ARPU', value: `${data.arpu} TND` },
            { label: 'Break-even clinics (est.)', value: '~10' },
            { label: 'Target MRR (6mo)', value: '600 TND' },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RevenueHistory({ data }: { data: FinancialSummary }) {
  const firstConversionTarget = data.conversionPipeline.find(
    (c) => !c.isInternal && c.healthScore >= 3
  );

  const thStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: 'var(--text-muted)',
    padding: '10px 14px',
    textAlign: 'left',
  };

  const tdStyle: React.CSSProperties = {
    fontSize: 13,
    fontFamily: 'var(--mono)',
    padding: '10px 14px',
    color: data.currentMrr === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
  };

  return (
    <Card
      title="Monthly Revenue History"
      subtitle="This section will activate once your first clinic converts"
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={thStyle}>Month</th>
              <th style={thStyle}>Total MRR</th>
              <th style={thStyle}>New MRR</th>
              <th style={thStyle}>Churned</th>
              <th style={thStyle}>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueHistory.map((row) => (
              <tr key={row.month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ ...tdStyle, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  {row.month}
                </td>
                <td style={tdStyle}>{row.totalMrr} TND</td>
                <td style={tdStyle}>+{row.newMrr} TND</td>
                <td style={tdStyle}>-{row.churnedMrr} TND</td>
                <td style={tdStyle}>
                  {row.net >= 0 ? '+' : ''}
                  {row.net} TND
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.currentMrr === 0 && (
        <div
          style={{
            background: 'var(--brand-pale)',
            borderTop: '1px solid var(--brand-pale-2)',
            padding: '16px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {'\u{1F3AF}'} Your first conversion could happen as soon as {nextMonthName()}
          </div>
          {firstConversionTarget && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              First conversion target: {firstConversionTarget.name}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SubscriptionBreakdown({ data }: { data: FinancialSummary }) {
  const trialCount = data.activeTrials;
  const paidCount = data.conversionPipeline.filter((c) => c.plan === 'PAID').length;
  const churnedCount = data.conversionPipeline.filter((c) => c.plan === 'CHURNED').length;
  const total = trialCount + paidCount + churnedCount;

  // Donut segments
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const segments: Array<{ count: number; color: string; label: string; legendColor: string }> = [
    { count: trialCount, color: 'var(--accent)', label: 'Trial', legendColor: 'var(--accent)' },
    { count: paidCount, color: 'var(--success)', label: 'Paid', legendColor: 'var(--success)' },
    { count: churnedCount, color: 'var(--danger)', label: 'Churned', legendColor: 'var(--danger)' },
  ];

  let cumulativeOffset = 0;
  const svgSegments = segments
    .filter((s) => s.count > 0)
    .map((seg) => {
      const pct = total > 0 ? seg.count / total : 0;
      const dashLength = pct * circumference;
      const dashGap = circumference - dashLength;
      const offset = -cumulativeOffset;
      cumulativeOffset += dashLength;
      return (
        <circle
          key={seg.label}
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth="18"
          strokeDasharray={`${dashLength} ${dashGap}`}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      );
    });

  return (
    <Card title="Subscription Breakdown" subtitle="Current distribution across plans">
      <div style={{ padding: 20 }}>
        {/* Donut + Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="18"
            />
            {svgSegments}
            <text
              x="60"
              y="56"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill="var(--text-primary)"
            >
              {total}
            </text>
            <text x="60" y="72" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
              clinics
            </text>
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {segments.map((seg) => (
              <div
                key={seg.label}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: seg.legendColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{seg.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{seg.count}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {total > 0 ? Math.round((seg.count / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics list */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            marginTop: 20,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {[
            {
              label: 'Trial \u2192 Paid conversion rate',
              value: paidCount > 0 ? `${Math.round((paidCount / (paidCount + trialCount)) * 100)}%` : '\u2014 (no data yet)',
            },
            {
              label: 'Avg trial length before conversion',
              value: '\u2014 (no data yet)',
            },
            {
              label: 'Churn rate',
              value: data.currentMrr === 0 ? '0% (no paid yet)' : `${total > 0 ? Math.round((churnedCount / total) * 100) : 0}%`,
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function FinancialPage() {
  const { data, loading } = useFinancialSummary();

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--brand)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        <PageHeader activeTrials={data.activeTrials} />

        <OpportunityBanner data={data} />

        <StatsRow data={data} />

        {/* Top two-column grid: Conversion Pipeline + Revenue Scenarios */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 20,
          }}
        >
          <ConversionPipeline data={data} />
          <RevenueScenarios data={data} />
        </div>

        {/* Bottom two-column grid: Revenue History + Subscription Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 20,
          }}
        >
          <RevenueHistory data={data} />
          <SubscriptionBreakdown data={data} />
        </div>
      </div>
    </div>
  );
}
