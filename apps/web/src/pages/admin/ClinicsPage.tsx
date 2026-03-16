import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinicsSummary } from '@/hooks/admin/useClinicsSummary';
import { AlertBanner, StatCard, Card, FilterBar, Tag, HealthBars, RiskChip } from '@/components/admin/ui';
import ExtendTrialModal from '@/components/admin/ExtendTrialModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import BulkActionBar from './clinics/shared/components/BulkActionBar';
import { api } from '@/lib/api';
import type { ClinicSummary } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

function formatTrialEnd(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function relativeLastActive(daysAgo: number | null): string {
  if (daysAgo === null) return 'Never';
  if (daysAgo === 0) return 'Today';
  return `${daysAgo}d ago`;
}

function qrDescriptor(rate: number): string {
  if (rate === 0) return 'all manual';
  if (rate < 15) return 'growing';
  return 'self-service';
}

function qrDotColor(rate: number): string {
  if (rate === 0) return 'var(--danger)';
  if (rate < 15) return 'var(--warning)';
  return 'var(--success)';
}

// ─── Filter helpers ───────────────────────────────────────────

type ActivityFilter = 'all' | 'active_today' | 'inactive_7d';
type PlanFilter = 'all' | 'TRIAL' | 'PAID' | 'CHURNED';
type RiskFilter = 'all' | 'high' | 'medium' | 'low';

function applyFilters(
  clinics: ClinicSummary[],
  search: string,
  activity: ActivityFilter,
  plan: PlanFilter,
  risk: RiskFilter,
): ClinicSummary[] {
  return clinics.filter((c) => {
    // Search
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.doctorEmail.toLowerCase().includes(q)) return false;
    }
    // Activity
    if (activity === 'active_today' && c.lastActiveDaysAgo !== 0) return false;
    if (activity === 'inactive_7d' && (c.lastActiveDaysAgo === null || c.lastActiveDaysAgo < 7)) return false;
    // Plan
    if (plan !== 'all' && c.plan !== plan) return false;
    // Risk
    if (risk !== 'all' && c.churnRisk !== risk) return false;
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────

export default function ClinicsPage() {
  const navigate = useNavigate();
  const { data: clinics, loading, refetch } = useClinicsSummary();

  // Filter state
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState<ActivityFilter>('all');
  const [plan, setPlan] = useState<PlanFilter>('all');
  const [risk, setRisk] = useState<RiskFilter>('all');

  // Modal state
  const [trialModal, setTrialModal] = useState<{ clinicId: string; clinicName: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    clinicId: string;
    clinicName: string;
    plan: 'MONTHLY' | 'YEARLY';
  } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ── Derived data ────────────────────────────────────────────

  const filtered = useMemo(
    () => applyFilters(clinics, search, activity, plan, risk),
    [clinics, search, activity, plan, risk],
  );

  const total = clinics.length;

  const nonInternal = useMemo(() => clinics.filter((c) => !c.isInternal), [clinics]);

  const trialsCount = useMemo(
    () => clinics.filter((c) => c.isActive && c.plan === 'TRIAL').length,
    [clinics],
  );

  const expiringLt30d = useMemo(
    () =>
      clinics.filter(
        (c) => c.isActive && c.plan === 'TRIAL' && c.daysUntilTrialExpires !== null && c.daysUntilTrialExpires < 30,
      ).length,
    [clinics],
  );

  const neverUsedQr = useMemo(
    () => nonInternal.filter((c) => c.qrCheckInCount30d === 0).length,
    [nonInternal],
  );

  const neverUsedQrPct = useMemo(
    () => (nonInternal.length > 0 ? Math.round((neverUsedQr / nonInternal.length) * 100) : 0),
    [neverUsedQr, nonInternal],
  );

  const avgPatientsPerDay = useMemo(() => {
    const active = clinics.filter((c) => c.avgPatientsPerDay > 0);
    if (active.length === 0) return 0;
    return active.reduce((sum, c) => sum + c.avgPatientsPerDay, 0) / active.length;
  }, [clinics]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return clinics.filter((c) => {
      const d = new Date(c.joinedAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [clinics]);

  const trialsOnTrial = useMemo(
    () => nonInternal.filter((c) => c.plan === 'TRIAL'),
    [nonInternal],
  );

  const expiringTrials = useMemo(
    () =>
      nonInternal.filter(
        (c) =>
          c.plan === 'TRIAL' &&
          c.daysUntilTrialExpires !== null &&
          c.daysUntilTrialExpires <= 7,
      ),
    [nonInternal],
  );

  const neverQrClinics = useMemo(
    () => nonInternal.filter((c) => c.qrAdoptionRate === 0 && c.totalCheckInCount30d > 0),
    [nonInternal],
  );

  // ── Alert banners ──────────────────────────────────────────

  const expiringCount = expiringTrials.length;
  const neverQrCount = neverQrClinics.length;

  // ── Selection handlers ────────────────────────────────────

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleSelect = useCallback((clinicId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clinicId)) next.delete(clinicId);
      else next.add(clinicId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = filtered.every((c) => prev.has(c.id));
      if (allSelected) return new Set();
      return new Set(filtered.map((c) => c.id));
    });
  }, [filtered]);

  // ── Modal handlers ─────────────────────────────────────────

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal) return;
    setIsUpgrading(true);
    try {
      await api.upgradeClinicSubscription(upgradeModal.clinicId, upgradeModal.plan);
      setUpgradeModal(null);
      refetch();
    } catch {
      // Keep modal open on failure so user can retry
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await api.deleteClinics([...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete clinics');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, refetch]);

  // ── Loading state ──────────────────────────────────────────

  if (loading) {
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

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>

        {/* ── Page Header ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
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
              Clinic Directory
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              {total} clinics &middot; {trialsOnTrial.length} on trial &middot; {expiringCount} expiring soon
            </p>
          </div>
          <button
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 550,
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
        </div>

        {/* ── Alert Banners ────────────────────────────────── */}
        {expiringCount > 0 && (
          <AlertBanner
            variant="warning"
            icon="&#x26A0;"
            title={`${expiringCount} trial(s) expiring in 7 days`}
            body={
              <>
                <strong>{expiringTrials[0].name}</strong> trial ends{' '}
                {formatTrialEnd(expiringTrials[0].trialEndsAt)}
                {expiringCount > 1 && ` and ${expiringCount - 1} more`}.
              </>
            }
            onDismiss={() => {}}
          />
        )}
        {neverQrCount > 0 && (
          <AlertBanner
            variant="danger"
            icon="&#x1F6A8;"
            title={`${neverQrCount} clinics have never used QR check-in`}
            body={
              <>
                {neverQrClinics
                  .slice(0, 2)
                  .map((c) => c.name)
                  .join(', ')}
                {neverQrCount > 2 && ` and ${neverQrCount - 2} more`}.
              </>
            }
            onDismiss={() => {}}
          />
        )}

        {/* ── Stats Row ───────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Total Clinics"
            value={total}
            subtext={`+${newThisMonth} this month`}
            dotColor="var(--brand-light)"
          />
          <StatCard
            label="Trials Active"
            value={trialsCount}
            subtext={`${expiringLt30d} expiring < 30d`}
            variant="warning"
            dotColor="var(--warning)"
          />
          <StatCard
            label="Never Used QR"
            value={neverUsedQr}
            subtext={`${neverUsedQrPct}% of clinics \u2014 at risk`}
            variant="danger"
            dotColor="var(--danger)"
          />
          <StatCard
            label="Avg Patients / Day"
            value={avgPatientsPerDay.toFixed(1)}
            subtext="across all active clinics"
            dotColor="var(--success)"
          />
        </div>

        {/* ── Table Card ──────────────────────────────────── */}
        <Card>
          <FilterBar
            searchPlaceholder="Search by name or email..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={[
              {
                key: 'activity',
                value: activity,
                onChange: (v) => setActivity(v as ActivityFilter),
                options: [
                  { label: 'All Activity', value: 'all' },
                  { label: 'Active today', value: 'active_today' },
                  { label: 'Inactive 7d+', value: 'inactive_7d' },
                ],
              },
              {
                key: 'plan',
                value: plan,
                onChange: (v) => setPlan(v as PlanFilter),
                options: [
                  { label: 'All Plans', value: 'all' },
                  { label: 'Trial', value: 'TRIAL' },
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Churned', value: 'CHURNED' },
                ],
              },
              {
                key: 'risk',
                value: risk,
                onChange: (v) => setRisk(v as RiskFilter),
                options: [
                  { label: 'All Risk', value: 'all' },
                  { label: 'High risk', value: 'high' },
                  { label: 'Medium risk', value: 'medium' },
                  { label: 'Low risk', value: 'low' },
                ],
              },
            ]}
          />

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: 11,
                      fontWeight: 650,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'var(--text-muted)',
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      width: 40,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
                      aria-label="Select all clinics"
                    />
                  </th>
                  {['CLINIC', 'PLAN', 'TRIAL ENDS', 'HEALTH', 'PATIENTS (30D)', 'QR ADOPTION', 'LAST ACTIVE', 'CHURN RISK', 'ACTIONS'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 16px',
                          fontSize: 11,
                          fontWeight: 650,
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          color: 'var(--text-muted)',
                          background: 'var(--surface-2)',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                          textAlign: 'left',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: '40px 16px',
                        textAlign: 'center',
                        fontSize: 14,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {clinics.length === 0 ? 'No clinics yet.' : 'No clinics match filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((clinic) => (
                    <ClinicRow
                      key={clinic.id}
                      clinic={clinic}
                      selected={selectedIds.has(clinic.id)}
                      onToggleSelect={() => toggleSelect(clinic.id)}
                      onNavigate={() => navigate(`/admin/clinics/${clinic.id}`)}
                      onExtend={() => setTrialModal({ clinicId: clinic.id, clinicName: clinic.name })}
                      onUpgrade={() =>
                        setUpgradeModal({ clinicId: clinic.id, clinicName: clinic.name, plan: 'MONTHLY' })
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span>Showing {filtered.length} of {total} clinics</span>
            <span>Last refreshed: just now</span>
          </div>
        </Card>
      </div>

      {/* ── Bulk Action Bar ───────────────────────────────── */}
      <BulkActionBar
        count={selectedIds.size}
        onDelete={() => setShowBulkDeleteConfirm(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* ── Modals ──────────────────────────────────────── */}
      {trialModal && (
        <ExtendTrialModal
          isOpen={true}
          clinicId={trialModal.clinicId}
          clinicName={trialModal.clinicName}
          onClose={() => setTrialModal(null)}
          onExtended={refetch}
        />
      )}

      {upgradeModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setUpgradeModal(null)}
          onConfirm={handleUpgradeConfirm}
          title={`Upgrade ${upgradeModal.clinicName}`}
          message={`This will upgrade the clinic to the ${upgradeModal.plan} plan and set the subscription status to ACTIVE.`}
          confirmText="Upgrade"
          variant="info"
          isLoading={isUpgrading}
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${selectedIds.size} clinic${selectedIds.size > 1 ? 's' : ''}`}
          message={`This will permanently delete ${selectedIds.size} clinic${selectedIds.size > 1 ? 's' : ''} and all their data. This action cannot be undone.`}
          confirmText={isBulkDeleting ? 'Deleting...' : 'Delete All'}
          variant="danger"
          isLoading={isBulkDeleting}
        />
      )}
    </div>
  );
}

// ─── ClinicRow ─────────────────────────────────────────────────

interface ClinicRowProps {
  clinic: ClinicSummary;
  selected: boolean;
  onToggleSelect: () => void;
  onNavigate: () => void;
  onExtend: () => void;
  onUpgrade: () => void;
}

function ClinicRow({ clinic, selected, onToggleSelect, onNavigate, onExtend, onUpgrade }: ClinicRowProps) {
  const [hovered, setHovered] = useState(false);

  const rowStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.12s',
    background: selected ? '#f0faf5' : hovered ? '#FAFAF8' : undefined,
  };

  const cellStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 13.5,
    verticalAlign: 'middle',
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)',
  };

  // Plan tag variant
  const tagVariant =
    clinic.plan === 'TRIAL'
      ? clinic.daysUntilTrialExpires !== null && clinic.daysUntilTrialExpires <= 14
        ? 'expiring'
        : 'trial'
      : clinic.plan === 'PAID'
        ? 'paid'
        : 'churned';

  // Trial ends color
  const trialEndColor =
    clinic.daysUntilTrialExpires !== null && clinic.daysUntilTrialExpires < 14
      ? '#E67E22'
      : undefined;

  // Last active color
  const lastActiveColor =
    clinic.lastActiveDaysAgo !== null && clinic.lastActiveDaysAgo >= 7
      ? 'var(--danger)'
      : 'var(--text-muted)';

  // QR adoption
  const dotColor = qrDotColor(clinic.qrAdoptionRate);

  // Determine action buttons
  const isInternal = clinic.isInternal;
  const isConvertCandidate =
    !isInternal &&
    clinic.plan === 'TRIAL' &&
    clinic.healthScore >= 3 &&
    clinic.daysUntilTrialExpires !== null &&
    clinic.daysUntilTrialExpires <= 21;

  const btnOutline: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border)',
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 550,
    cursor: 'pointer',
  };

  const btnBrandSolid: React.CSSProperties = {
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 550,
    cursor: 'pointer',
  };

  const btnGhost: React.CSSProperties = {
    background: 'none',
    border: '1px solid transparent',
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 550,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  };

  return (
    <tr
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* CHECKBOX */}
      <td style={{ ...cellStyle, width: 40 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
          aria-label={`Select ${clinic.name}`}
        />
      </td>

      {/* CLINIC */}
      <td style={cellStyle}>
        <div
          style={{ cursor: 'pointer' }}
          onClick={onNavigate}
        >
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{clinic.name}</div>
          <div style={{ ...monoStyle, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {clinic.doctorEmail}
          </div>
        </div>
      </td>

      {/* PLAN */}
      <td style={cellStyle}>
        <Tag
          variant={tagVariant}
        >
          {clinic.plan === 'TRIAL'
            ? clinic.daysUntilTrialExpires !== null && clinic.daysUntilTrialExpires <= 14
              ? `Trial \u00b7 ${clinic.daysUntilTrialExpires}d`
              : 'Trial'
            : clinic.plan === 'PAID'
              ? 'Paid'
              : 'Churned'}
        </Tag>
      </td>

      {/* TRIAL ENDS */}
      <td style={{ ...cellStyle, ...monoStyle, color: trialEndColor }}>
        {formatTrialEnd(clinic.trialEndsAt)}
      </td>

      {/* HEALTH */}
      <td style={cellStyle}>
        <HealthBars level={clinic.healthScore} color={clinic.healthColor} label={clinic.healthLabel} />
      </td>

      {/* PATIENTS (30D) */}
      <td style={cellStyle}>
        <span style={{ ...monoStyle, fontWeight: 700 }}>{clinic.patientsLast30Days}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>patients</span>
      </td>

      {/* QR ADOPTION */}
      <td style={cellStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
            }}
          />
          <span style={monoStyle}>{clinic.qrAdoptionRate}%</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {qrDescriptor(clinic.qrAdoptionRate)}
          </span>
        </div>
      </td>

      {/* LAST ACTIVE */}
      <td style={{ ...cellStyle, color: lastActiveColor, fontSize: 13 }}>
        {relativeLastActive(clinic.lastActiveDaysAgo)}
      </td>

      {/* CHURN RISK */}
      <td style={cellStyle}>
        <RiskChip level={isInternal ? 'internal' : clinic.churnRisk} />
      </td>

      {/* ACTIONS */}
      <td style={cellStyle}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isInternal ? (
            <button style={btnGhost} onClick={onNavigate}>
              View &rarr;
            </button>
          ) : isConvertCandidate ? (
            <>
              <button style={btnBrandSolid} onClick={onUpgrade}>
                Convert now
              </button>
              <button style={btnGhost} onClick={onNavigate}>
                View &rarr;
              </button>
            </>
          ) : (
            <>
              <button style={btnOutline} onClick={onExtend}>
                Extend
              </button>
              <button style={btnOutline} onClick={onUpgrade}>
                Upgrade
              </button>
              <button style={btnGhost} onClick={onNavigate}>
                View &rarr;
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
