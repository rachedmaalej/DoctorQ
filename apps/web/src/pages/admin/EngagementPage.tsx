import React from 'react';
import { useEngagementSummary } from '@/hooks/admin/useEngagementSummary';
import {
  AlertBanner,
  StatCard,
  Card,
  BadgePill,
  ProgressBar,
  Sparkline,
  RiskChip,
  Timeline,
} from '@/components/admin/ui';
import type { ClinicSummary } from '@/types';

/* ────────────────────────────────────────────────────────────── */
/*  Inline MiniStat                                              */
/* ────────────────────────────────────────────────────────────── */
function MiniStat({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div style={{ minWidth: 80 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Color helpers                                                */
/* ────────────────────────────────────────────────────────────── */
function patientsColor(count: number): string {
  if (count >= 20) return 'var(--success)';
  if (count >= 5) return 'var(--warning)';
  return 'var(--danger)';
}

function avgDayColor(avg: number): string {
  if (avg >= 1) return 'var(--success)';
  if (avg >= 0.5) return 'var(--warning)';
  return 'var(--danger)';
}

function qrRateColor(rate: number): string {
  if (rate >= 20) return 'var(--success)';
  if (rate >= 1) return 'var(--warning)';
  return 'var(--danger)';
}

/* ────────────────────────────────────────────────────────────── */
/*  Per-Clinic Row                                               */
/* ────────────────────────────────────────────────────────────── */
function ClinicRow({ clinic }: { clinic: ClinicSummary }) {
  const [hovered, setHovered] = React.useState(false);

  const daysAgo = clinic.lastActiveDaysAgo ?? null;
  const daysAgoText = daysAgo !== null ? `Active ${daysAgo}d ago` : 'Never active';
  const daysAgoColor = daysAgo !== null && daysAgo >= 7 ? 'var(--danger)' : 'var(--text-muted)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.12s',
        background: hovered ? '#FAFAF8' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 1. Clinic name + email */}
      <div style={{ minWidth: 200 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{clinic.name}</div>
        <div
          style={{
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {clinic.doctorEmail}
        </div>
      </div>

      {/* 2. Patients (30d) */}
      <MiniStat
        value={clinic.patientsLast30Days}
        label="Patients (30d)"
        color={patientsColor(clinic.patientsLast30Days)}
      />

      {/* 3. Avg/Day */}
      <MiniStat
        value={clinic.avgPatientsPerDay}
        label="Avg/Day"
        color={avgDayColor(clinic.avgPatientsPerDay)}
      />

      {/* 4. QR Rate */}
      <MiniStat
        value={`${clinic.qrAdoptionRate}%`}
        label="QR Rate"
        color={qrRateColor(clinic.qrAdoptionRate)}
      />

      {/* 5. Sparkline */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          Activity ({clinic.sessionHistory.length} sessions)
        </div>
        <Sparkline data={clinic.sessionHistory} />
      </div>

      {/* 6. Risk + last active */}
      <div style={{ minWidth: 120, textAlign: 'right' }}>
        <RiskChip level={clinic.isInternal ? 'internal' : clinic.churnRisk} />
        <div
          style={{
            fontSize: 11.5,
            color: daysAgoColor,
            marginTop: 4,
          }}
        >
          {daysAgoText}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Main Page                                                    */
/* ────────────────────────────────────────────────────────────── */
export default function EngagementPage() {
  const { data, loading } = useEngagementSummary();

  /* Loading state */
  if (loading || !data) {
    return (
      <div
        style={{
          background: 'var(--bg)',
          minHeight: '100vh',
          fontFamily: "'DM Sans', sans-serif",
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const {
    totalCheckIns30d,
    qrCheckIns30d,
    manualCheckIns30d,
    whatsappCheckIns30d,
    qrAdoptionRate,
    avgPatientsPerClinicPerDay,
    multiDoctorClinicsCount,
    onboardingFunnel: funnel,
    clinicBreakdown,
    recommendedActions,
    peakCheckinHour,
  } = data;

  const activeClinicsCount = clinicBreakdown.filter(
    (c) => c.patientsLast30Days > 0
  ).length;

  const completionRate =
    funnel.signedUp > 0
      ? Math.round((funnel.firstPatientCheckedIn / funnel.signedUp) * 100)
      : 0;

  const clinicSetupDropPct =
    funnel.signedUp > 0
      ? Math.round((1 - funnel.clinicSetup / funnel.signedUp) * 100)
      : 0;

  const manualPct =
    totalCheckIns30d > 0
      ? Math.round((manualCheckIns30d / totalCheckIns30d) * 100)
      : 0;

  const sortedClinics = [...clinicBreakdown].sort(
    (a, b) => b.patientsLast30Days - a.patientsLast30Days
  );

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        {/* ─── Page Header ──────────────────────────────── */}
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
              User Engagement
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              Platform usage &middot; Last 30 days &middot; {activeClinicsCount}{' '}
              active clinics
            </p>
          </div>
          <select
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        {/* ─── Alert Banner ────────────────────────────── */}
        {qrAdoptionRate < 10 && (
          <AlertBanner
            variant="danger"
            icon="📱"
            title={`QR check-in adoption is critically low — ${qrAdoptionRate}% of all check-ins`}
            body={`${100 - qrAdoptionRate}% of check-ins are still manual (receptionist-entered). QR self-service is your core value differentiator — if patients aren't scanning, clinics aren't experiencing the full product. This is your most important activation problem.`}
          />
        )}

        {/* ─── Stats Row ───────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <StatCard
            label="Total Check-ins (30d)"
            value={totalCheckIns30d}
            subtext="across all clinics"
            dotColor="var(--brand-light)"
          />
          <StatCard
            label="QR Adoption Rate"
            value={`${qrAdoptionRate}%`}
            subtext="Target: 40%+ to demonstrate value"
            variant={
              qrAdoptionRate < 20
                ? 'danger'
                : qrAdoptionRate <= 40
                  ? 'warning'
                  : 'highlight'
            }
            dotColor={
              qrAdoptionRate < 20
                ? 'var(--danger)'
                : qrAdoptionRate <= 40
                  ? 'var(--warning)'
                  : 'var(--brand)'
            }
          />
          <StatCard
            label="Avg Patients / Clinic / Day"
            value={avgPatientsPerClinicPerDay}
            subtext="Low vs. typical clinic (20–40/day)"
            dotColor="var(--text-secondary)"
          />
          <StatCard
            label="Onboarding Completion"
            value={`${completionRate}%`}
            subtext={`${funnel.firstPatientCheckedIn} of ${funnel.signedUp} fully onboarded`}
            variant="highlight"
            dotColor="var(--brand)"
          />
        </div>

        {/* ─── Two-Column Grid ─────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 20,
          }}
        >
          {/* ─── Onboarding Funnel ──────────────────────── */}
          <Card
            title="Onboarding Funnel"
            subtitle="Where clinics drop off during setup"
            headerRight={
              <BadgePill variant="green">{completionRate}% completion</BadgePill>
            }
          >
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <ProgressBar
                label="1. Signed Up"
                value={100}
                color="var(--brand-light)"
                displayValue={`${funnel.signedUp} clinics`}
              />
              <ProgressBar
                label="2. Clinic Setup"
                value={
                  funnel.signedUp > 0
                    ? (funnel.clinicSetup / funnel.signedUp) * 100
                    : 0
                }
                color="var(--warning)"
                displayValue={`${funnel.clinicSetup} clinics`}
                rightBadge={
                  clinicSetupDropPct > 0 ? (
                    <BadgePill variant="red">-{clinicSetupDropPct}% drop</BadgePill>
                  ) : undefined
                }
              />
              <ProgressBar
                label="3. QR Code Generated"
                value={
                  funnel.signedUp > 0
                    ? (funnel.qrCodeGenerated / funnel.signedUp) * 100
                    : 0
                }
                color="rgba(61, 138, 110, 0.6)"
                displayValue={`${funnel.qrCodeGenerated} clinics`}
              />
              <ProgressBar
                label="4. First Patient Checked In"
                value={
                  funnel.signedUp > 0
                    ? (funnel.firstPatientCheckedIn / funnel.signedUp) * 100
                    : 0
                }
                color="var(--success)"
                displayValue={`${funnel.firstPatientCheckedIn} clinics`}
              />
              <ProgressBar
                label="5. First QR Scan by Patient"
                value={
                  funnel.signedUp > 0
                    ? (funnel.firstQrScan / funnel.signedUp) * 100
                    : 0
                }
                color="var(--danger)"
                displayValue={`${funnel.firstQrScan} clinics`}
                rightBadge={<BadgePill variant="red">activation gap</BadgePill>}
                note={`🔴 Only ${funnel.firstQrScan} of ${funnel.signedUp} clinics has experienced self-service check-in — this is your true 'Aha Moment'`}
              />
            </div>
          </Card>

          {/* ─── Check-in Methods ──────────────────────── */}
          <Card
            title="Check-in Method Breakdown"
            subtitle={`Last 30 days · ${totalCheckIns30d} total check-ins`}
          >
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <ProgressBar
                label="👩‍💼 Manual (Receptionist)"
                value={
                  totalCheckIns30d > 0
                    ? (manualCheckIns30d / totalCheckIns30d) * 100
                    : 0
                }
                height={12}
                color="rgba(192, 57, 43, 0.7)"
                displayValue={`${manualCheckIns30d} (${totalCheckIns30d > 0 ? Math.round((manualCheckIns30d / totalCheckIns30d) * 100) : 0}%)`}
              />
              <ProgressBar
                label="📱 QR Code (Self-service)"
                value={
                  totalCheckIns30d > 0
                    ? (qrCheckIns30d / totalCheckIns30d) * 100
                    : 0
                }
                height={12}
                color="var(--success)"
                displayValue={`${qrCheckIns30d} (${totalCheckIns30d > 0 ? Math.round((qrCheckIns30d / totalCheckIns30d) * 100) : 0}%)`}
              />
              <ProgressBar
                label="💬 WhatsApp"
                value={
                  totalCheckIns30d > 0
                    ? (whatsappCheckIns30d / totalCheckIns30d) * 100
                    : 0
                }
                height={12}
                color="var(--info)"
                displayValue={`${whatsappCheckIns30d} (${totalCheckIns30d > 0 ? Math.round((whatsappCheckIns30d / totalCheckIns30d) * 100) : 0}%)`}
              />

              {/* Red explanation box */}
              {manualPct > 90 && (
                <div
                  style={{
                    background: 'var(--danger-pale)',
                    border: '1px solid #E8AAAA',
                    borderRadius: 8,
                    padding: 14,
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--danger)',
                    }}
                  >
                    Why this matters
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#B91C1C',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    Manual check-in means the receptionist is still doing all the
                    work. The core promise of BleSaf — reducing reception workload
                    — is not being experienced. Until QR adoption reaches 40%+,
                    clinics won't feel the value and won't pay.
                  </div>
                </div>
              )}

              {/* Platform usage section */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: 16,
                  paddingTop: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: 0.7,
                    marginBottom: 10,
                  }}
                >
                  Platform Usage
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Multi-doctor clinics
                    </span>
                    <span style={{ fontWeight: 600 }}>{multiDoctorClinicsCount}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Avg patients / clinic / day
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {avgPatientsPerClinicPerDay}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Peak check-in hour
                    </span>
                    <span style={{ fontWeight: 600 }}>{peakCheckinHour}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Per-Clinic Breakdown ────────────────────── */}
        <div style={{ marginTop: 20 }}>
          <Card
            title="Per-Clinic Engagement Breakdown"
            subtitle="Individual health, usage, and QR adoption per clinic"
            headerRight="Sorted by engagement ↓"
          >
            <div>
              {sortedClinics.map((clinic) => (
                <ClinicRow key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </Card>
        </div>

        {/* ─── Recommended Actions ─────────────────────── */}
        <div style={{ marginTop: 20 }}>
          <Card
            title="Recommended Actions"
            subtitle="Based on engagement data — in priority order"
          >
            <Timeline
              items={recommendedActions.map((a) => ({
                number: a.priority,
                color: a.color,
                title: a.title,
                meta: a.meta,
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
