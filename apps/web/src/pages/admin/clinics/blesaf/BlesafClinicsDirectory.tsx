import { useState } from 'react';
import { useIsMobile } from '../useIsMobile';
import { useClinicDirectoryData } from '../shared/hooks/useClinicDirectoryData';
import ClinicTable from './components/ClinicTable';
import ClinicMobileList from './components/ClinicMobileList';
import ExtendTrialModal from '@/components/admin/ExtendTrialModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { api } from '@/lib/api';

export default function BlesafClinicsDirectory() {
  const isMobile = useIsMobile();
  const {
    clinics,
    totalCount,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sort,
    toggleSort,
    refetch,
  } = useClinicDirectoryData();

  const [trialModal, setTrialModal] = useState<{ clinicId: string; clinicName: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ clinicId: string; clinicName: string } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal) return;
    setIsUpgrading(true);
    try {
      await api.upgradeClinicSubscription(upgradeModal.clinicId, 'MONTHLY');
      setUpgradeModal(null);
      refetch();
    } catch {
      // keep modal open
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderBottomColor: '#2a9d6e' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={refetch}
          style={{ color: '#2a9d6e', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? '1rem' : '0',
        opacity: 1,
        animation: 'fadeInUp 300ms ease-out',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toolbar */}
      {isMobile ? (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
          <input
            type="text"
            placeholder="Search clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search clinics"
            style={{
              flex: 1,
              padding: '0.45rem 0.85rem',
              border: '1px solid #e8e5df',
              borderRadius: 7,
              background: '#fff',
              fontSize: '0.78rem',
              color: '#1a1a2e',
              fontFamily: "'DM Sans', sans-serif",
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShowFilterSheet(!showFilterSheet)}
            aria-haspopup="true"
            aria-expanded={showFilterSheet}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: 7,
              fontSize: '0.75rem',
              border: '1px solid #e8e5df',
              background: '#fff',
              color: '#666',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: '1.15rem',
              color: '#1a1a2e',
              margin: 0,
            }}
          >
            Clinic Directory
          </h1>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search name, doctor, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search clinics"
              style={{
                width: 200,
                padding: '0.45rem 0.85rem',
                border: '1px solid #e8e5df',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.78rem',
                color: '#1a1a2e',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
              }}
            />
            <select
              value={filters.activity}
              onChange={(e) => setFilters({ ...filters, activity: e.target.value as any })}
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid #e8e5df',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">All Activity</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="never">Never</option>
            </select>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value as any })}
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid #e8e5df',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">All Plans</option>
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filters.payment}
              onChange={(e) => setFilters({ ...filters, payment: e.target.value as any })}
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid #e8e5df',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      )}

      {/* Mobile filter sheet */}
      {isMobile && showFilterSheet && (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e8e5df',
          padding: '0.8rem',
          marginBottom: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}>
          <select
            value={filters.activity}
            onChange={(e) => setFilters({ ...filters, activity: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e8e5df', borderRadius: 7, fontSize: '0.75rem', color: '#666' }}
          >
            <option value="all">All Activity</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="never">Never</option>
          </select>
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e8e5df', borderRadius: 7, fontSize: '0.75rem', color: '#666' }}
          >
            <option value="all">All Plans</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.payment}
            onChange={(e) => setFilters({ ...filters, payment: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e8e5df', borderRadius: 7, fontSize: '0.75rem', color: '#666' }}
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="none">None</option>
          </select>
        </div>
      )}

      {/* Table (desktop) or Card List (mobile) */}
      {isMobile ? (
        <ClinicMobileList clinics={clinics} totalCount={totalCount} />
      ) : (
        <ClinicTable
          clinics={clinics}
          totalCount={totalCount}
          sort={sort}
          onToggleSort={toggleSort}
          onExtend={(id, name) => setTrialModal({ clinicId: id, clinicName: name })}
          onUpgrade={(id, name) => setUpgradeModal({ clinicId: id, clinicName: name })}
        />
      )}

      {/* Modals */}
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
          message="This will upgrade the clinic to the MONTHLY plan and set the subscription status to ACTIVE."
          confirmText="Upgrade"
          variant="info"
          isLoading={isUpgrading}
        />
      )}
    </div>
  );
}
