import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ClinicDetail, ClinicDetailTab } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import RecordPaymentModal from '@/components/admin/RecordPaymentModal';
import ClinicDetailHeader from '@/components/admin/clinic-detail/ClinicDetailHeader';
import ClinicDetailTabBar from '@/components/admin/clinic-detail/ClinicDetailTabBar';
import DeleteClinicModal from '@/components/admin/clinic-detail/DeleteClinicModal';
import ClinicOverviewTab from '@/components/admin/clinic-detail/tabs/ClinicOverviewTab';
import ClinicPatientsTab from '@/components/admin/clinic-detail/tabs/ClinicPatientsTab';
import ClinicBillingTab from '@/components/admin/clinic-detail/tabs/ClinicBillingTab';
import ClinicSettingsTab from '@/components/admin/clinic-detail/tabs/ClinicSettingsTab';

const VALID_TABS: ClinicDetailTab[] = ['overview', 'patients', 'billing', 'settings'];

export default function ClinicDetailPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { startImpersonation } = useAuthStore();

  const [detail, setDetail] = useState<ClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const rawTab = searchParams.get('tab') as ClinicDetailTab | null;
  const activeTab: ClinicDetailTab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'overview';

  const handleTabChange = useCallback((tab: ClinicDetailTab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const fetchDetail = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const data = await api.getAdminClinicDetail(clinicId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleToggleStatus = async () => {
    if (!detail || !clinicId) return;
    setActionLoading('status');
    try {
      await api.updateClinicStatus(clinicId, !detail.clinic.isActive);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
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
  };

  const handleKonnectPayment = async () => {
    if (!clinicId) return;
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    setActionLoading('konnect');
    try {
      const result = await api.initKonnectPayment(clinicId, month);
      window.open(result.payUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to initiate payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClinic = async () => {
    if (!clinicId || !detail) return;
    setActionLoading('delete');
    try {
      await api.deleteClinic(clinicId);
      navigate('/admin');
    } catch (err: any) {
      alert(err.message || 'Failed to delete clinic');
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async () => {
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
  };

  const handleUpgrade = async (plan: 'MONTHLY' | 'YEARLY') => {
    if (!clinicId) return;
    setActionLoading('upgrade');
    try {
      await api.upgradeClinicSubscription(clinicId, plan);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to upgrade subscription');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFFFF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFFFF]">
        <div className="text-center">
          <p className="text-[#E15720] mb-4 text-sm">{error || 'Clinic not found'}</p>
          <button onClick={() => navigate('/admin?tab=clinics')} className="text-sm text-[#267B75] hover:underline font-medium">
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#FDFFFF] no-scrollbar" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClinicDetailHeader
        clinic={detail.clinic}
        actionLoading={actionLoading}
        onImpersonate={handleImpersonate}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <ClinicDetailTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <ClinicOverviewTab
            detail={detail}
            onRefresh={fetchDetail}
            onUpgrade={handleUpgrade}
            upgradeLoading={actionLoading === 'upgrade'}
          />
        )}
        {activeTab === 'patients' && <ClinicPatientsTab detail={detail} />}
        {activeTab === 'billing' && (
          <ClinicBillingTab
            detail={detail}
            actionLoading={actionLoading}
            onRecordPayment={() => setShowPaymentModal(true)}
            onKonnectPayment={handleKonnectPayment}
          />
        )}
        {activeTab === 'settings' && (
          <ClinicSettingsTab
            detail={detail}
            onRefresh={fetchDetail}
            onResetPassword={handleResetPassword}
          />
        )}
      </main>

      <RecordPaymentModal
        isOpen={showPaymentModal}
        clinicId={clinicId!}
        clinicName={detail.clinic.name}
        onClose={() => setShowPaymentModal(false)}
        onRecorded={fetchDetail}
      />

      <DeleteClinicModal
        isOpen={showDeleteConfirm}
        clinicName={detail.clinic.name}
        loading={actionLoading === 'delete'}
        onConfirm={handleDeleteClinic}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
