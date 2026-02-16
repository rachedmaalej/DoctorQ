import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetailData } from '../shared/hooks/useClinicDetailData';
import { useIsMobile } from '../useIsMobile';
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
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'patients', label: 'Patients' },
  { key: 'billing', label: 'Facturation' },
  { key: 'settings', label: 'Paramètres' },
];

export default function AusuivantClinicDetail() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
      alert(err.message || 'Échec de la connexion');
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
      alert(err.message || 'Échec de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  }, [clinicId, detail, refetch]);

  const handleResetPassword = useCallback(async () => {
    if (!clinicId) return;
    const pw = prompt('Entrez le nouveau mot de passe (min 6 caractères) :');
    if (!pw || pw.length < 6) return;
    setActionLoading('password');
    try {
      await api.resetClinicPassword(clinicId, pw);
      alert('Mot de passe réinitialisé avec succès');
    } catch (err: any) {
      alert(err.message || 'Échec de la réinitialisation');
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
      alert(err.message || 'Échec de la suppression');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#c0392b' }} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '1rem' }}>{error || 'Cabinet introuvable'}</p>
        <button
          onClick={() => navigate('/admin/clinics')}
          style={{ color: '#c0392b', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Retour aux Cabinets
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
          borderBottom: '1px solid #e5e0d8',
          margin: '0.6rem 0 1.2rem',
          overflowX: isMobile ? 'auto' : undefined,
          ...(isMobile ? { margin: '0.5rem -1rem 1rem', padding: '0 1rem', scrollbarWidth: 'none' as const } : {}),
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
              borderBottom: activeTab === tab.key ? '2px solid #c0392b' : '2px solid transparent',
              color: activeTab === tab.key ? '#1a1a2e' : '#999',
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: activeTab === tab.key ? '#c0392b' : 'transparent',
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

      {activeTab === 'overview' && (
        <div>
          <SubscriptionCard
            clinic={detail.clinic}
            onExtend={() => setShowExtendModal(true)}
            onUpgrade={() => setShowUpgradeModal(true)}
            isMobile={isMobile}
          />
          <ClinicInfoGrid clinic={detail.clinic} />
          <TodayActivityStats stats={detail.todayStats} />
          <WeeklyChart data={weeklyData} />
        </div>
      )}

      {activeTab === 'patients' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e0d8', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Gestion des patients bientôt disponible
        </div>
      )}

      {activeTab === 'billing' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e0d8', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Gestion de la facturation bientôt disponible
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e0d8', padding: '2rem', textAlign: 'center', color: '#999' }}>
          Gestion des paramètres bientôt disponible
        </div>
      )}

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
          title={`Upgrader ${detail.clinic.name}`}
          message="Cela va upgrader le cabinet au plan MENSUEL et mettre le statut d'abonnement à ACTIF."
          confirmText="Upgrader"
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
