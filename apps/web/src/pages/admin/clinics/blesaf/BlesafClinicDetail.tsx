import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetailEnriched } from '@/hooks/admin/useClinicDetailEnriched';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { AlertBanner } from '@/components/admin/ui';
import PageHeaderBar from '@/components/admin/clinic-detail/PageHeaderBar';
import ClinicHealthCard from '@/components/admin/clinic-detail/ClinicHealthCard';
import OverviewTab from '@/components/admin/clinic-detail/OverviewTab';
import PatientsTab from '@/components/admin/clinic-detail/PatientsTab';
import BillingTab from '@/components/admin/clinic-detail/BillingTab';
import SettingsTab from '@/components/admin/clinic-detail/SettingsTab';
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
  const { data: clinic, loading, error, refetch } = useClinicDetailEnriched(clinicId);

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
    if (!clinic || !clinicId) return;
    setActionLoading('status');
    try {
      await api.updateClinicStatus(clinicId, !clinic.isActive);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  }, [clinicId, clinic, refetch]);

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
      // keep modal open
    } finally {
      setIsUpgrading(false);
    }
  }, [clinicId, refetch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: 'var(--brand)' }} />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error || 'Clinic not found'}</p>
        <button
          onClick={() => navigate('/admin/clinics')}
          style={{ color: 'var(--brand)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
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

      {/* Page Header: back + title + tags + action buttons */}
      <PageHeaderBar
        clinic={clinic}
        onBack={() => navigate('/admin/clinics')}
        onLoginAs={handleImpersonate}
        onPause={handlePause}
        onResetPassword={handleResetPassword}
        onDelete={() => setShowDeleteModal(true)}
        actionLoading={actionLoading}
      />

      {/* Health Card — always visible above tabs */}
      <ClinicHealthCard clinic={clinic} />

      {/* Onboarding Banner — between health card and tabs, if incomplete */}
      {!clinic.onboardingComplete && (
        <AlertBanner
          variant="warning"
          icon="⚠️"
          title={`Onboarding incomplete — stuck at step ${clinic.onboardingStep}/${clinic.onboardingTotalSteps}: ${clinic.onboardingStepLabel}`}
          body="This clinic hasn't finished setting up. They may need help completing their profile and configuration."
          ctaLabel="Send setup guide →"
          onCtaClick={() => {}}
        />
      )}

      {/* Tab Navigation */}
      <div
        role="tablist"
        style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--brand)' : 'transparent'}`,
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          clinic={clinic}
          onExtendTrial={() => setShowExtendModal(true)}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {activeTab === 'patients' && (
        <PatientsTab clinic={clinic} />
      )}

      {activeTab === 'billing' && (
        <BillingTab
          clinic={clinic}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          clinic={clinic}
          onLoginAs={handleImpersonate}
          onResetPassword={handleResetPassword}
          onExtendTrial={() => setShowExtendModal(true)}
          onPause={handlePause}
          onDelete={() => setShowDeleteModal(true)}
          actionLoading={actionLoading}
        />
      )}

      {/* Modals */}
      {showExtendModal && clinicId && (
        <ExtendTrialModal
          isOpen={true}
          clinicId={clinicId}
          clinicName={clinic.name}
          onClose={() => setShowExtendModal(false)}
          onExtended={refetch}
        />
      )}

      {showUpgradeModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={handleUpgradeConfirm}
          title={`Upgrade ${clinic.name}`}
          message="This will upgrade the clinic to the MONTHLY plan and set the subscription status to ACTIVE."
          confirmText="Upgrade"
          variant="info"
          isLoading={isUpgrading}
        />
      )}

      {showDeleteModal && (
        <DeleteClinicModal
          isOpen={true}
          clinicName={clinic.name}
          loading={actionLoading === 'delete'}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
