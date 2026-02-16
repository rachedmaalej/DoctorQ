import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetailData } from '../shared/hooks/useClinicDetailData';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import ClinicDetailHeader from './components/ClinicDetailHeader';
import SubscriptionCard from './components/SubscriptionCard';
import ClinicInfoGrid from './components/ClinicInfoGrid';
import TodayActivityStats from './components/TodayActivityStats';
import WeeklyChart from './components/WeeklyChart';
import ExtendTrialModal from '@/components/admin/ExtendTrialModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import DeleteClinicModal from '@/components/admin/clinic-detail/DeleteClinicModal';

type DetailTab = 'overview' | 'patients' | 'billing' | 'settings';

const TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'billing', label: 'Billing' },
  { key: 'settings', label: 'Settings' },
];

export default function BlesafClinicDetail() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { startImpersonation } = useAuthStore();
  const { detail, weeklyData, loading, error, refetch } = useClinicDetailData(clinicId);

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleImpersonate = useCallback(async () => {
    if (!clinicId) return;
    setActionLoading('impersonate');
    try {
      const result = await api.impersonateClinic(clinicId);
      startImpersonation(result.token, result.clinic);
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Failed to login as clinic');
    } finally {
      setActionLoading(null);
    }
  }, [clinicId, navigate, startImpersonation]);

  const handlePause = useCallback(async () => {
    if (!detail || !clinicId) return;
    setActionLoading('status');
    try {
      await api.updateClinicStatus(clinicId, !detail.clinic.isActive);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  }, [clinicId, detail, refetch]);

  const handleResetPassword = useCallback(async () => {
    if (!clinicId) return;
    const pw = prompt('Enter new password (min 6 chars):');
    if (!pw || pw.length < 6) return;
    setActionLoading('password');
    try {
      await api.resetClinicPassword(clinicId, pw);
      alert('Password reset successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  }, [clinicId]);

  const handleDelete = useCallback(async () => {
    if (!clinicId) return;
    setActionLoading('delete');
    try {
      await api.deleteClinic(clinicId);
      navigate('/admin/clinics');
    } catch (err: any) {
      alert(err.message || 'Failed to delete clinic');
      setShowDeleteModal(false);
    } finally {
      setActionLoading(null);
    }
  }, [clinicId, navigate]);

  const handleUpgradeConfirm = useCallback(async () => {
    if (!clinicId) return;
    setIsUpgrading(true);
    try {
      await api.upgradeClinicSubscription(clinicId, 'MONTHLY');
      setShowUpgradeModal(false);
      await refetch();
    } catch {
      // keep modal
    } finally {
      setIsUpgrading(false);
    }
  }, [clinicId, refetch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#2a9d6e' }} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{error || 'Clinic not found'}</p>
        <button
          onClick={() => navigate('/admin/clinics')}
          style={{ color: '#2a9d6e', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Back to Clinics
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 300ms ease-out' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <ClinicDetailHeader
        clinic={detail.clinic}
        onLoginAs={handleImpersonate}
        onPause={handlePause}
        onResetPassword={handleResetPassword}
        onDelete={() => setShowDeleteModal(true)}
        actionLoading={actionLoading}
      />

      {/* Sub-tabs */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #e8e5df',
          margin: '0.6rem 0 1.2rem',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 500,
              borderBottom: activeTab === tab.key ? '2px solid #2a9d6e' : '2px solid transparent',
              color: activeTab === tab.key ? '#1a3c34' : '#999',
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: activeTab === tab.key ? '#2a9d6e' : 'transparent',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 150ms, border-color 150ms',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div>
          <SubscriptionCard
            clinic={detail.clinic}
            onExtend={() => setShowExtendModal(true)}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
          <ClinicInfoGrid clinic={detail.clinic} />
          <TodayActivityStats stats={detail.todayStats} />
          <WeeklyChart data={weeklyData} />
        </div>
      )}

      {activeTab === 'patients' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e5df', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Patient management coming soon
        </div>
      )}

      {activeTab === 'billing' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e5df', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Billing management coming soon
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e5df', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Settings management coming soon
        </div>
      )}

      {/* Modals */}
      {showExtendModal && clinicId && (
        <ExtendTrialModal
          isOpen={true}
          clinicId={clinicId}
          clinicName={detail.clinic.name}
          onClose={() => setShowExtendModal(false)}
          onExtended={refetch}
        />
      )}

      {showUpgradeModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={handleUpgradeConfirm}
          title={`Upgrade ${detail.clinic.name}`}
          message="This will upgrade the clinic to the MONTHLY plan and set the subscription status to ACTIVE."
          confirmText="Upgrade"
          variant="info"
          isLoading={isUpgrading}
        />
      )}

      {showDeleteModal && (
        <DeleteClinicModal
          isOpen={true}
          clinicName={detail.clinic.name}
          loading={actionLoading === 'delete'}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
