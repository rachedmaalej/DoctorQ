import { useState, useCallback } from 'react';
import { useIsMobile } from '../useIsMobile';
import { useClinicDirectoryData } from '../shared/hooks/useClinicDirectoryData';
import ClinicTable from './components/ClinicTable';
import ClinicMobileList from './components/ClinicMobileList';
import ExtendTrialModal from '@/components/admin/ExtendTrialModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import BulkActionBar from '../shared/components/BulkActionBar';
import { api } from '@/lib/api';

export default function AusuivantClinicsDirectory() {
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

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
      const allSelected = clinics.every((c) => prev.has(c.id));
      if (allSelected) return new Set();
      return new Set(clinics.map((c) => c.id));
    });
  }, [clinics]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await api.deleteClinics([...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Échec de la suppression');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, refetch]);

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
          style={{ borderBottomColor: '#c0392b' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={refetch}
          style={{ color: '#c0392b', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Réessayer
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
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher des cabinets"
            style={{
              flex: 1,
              padding: '0.45rem 0.85rem',
              border: '1px solid #e5e0d8',
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
              border: '1px solid #e5e0d8',
              background: '#fff',
              color: '#777',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            Filtres
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: '1.2rem',
              color: '#1a1a2e',
              margin: 0,
            }}
          >
            Répertoire des Cabinets
          </h1>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Rechercher nom, médecin, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher des cabinets"
              style={{
                width: 220,
                padding: '0.45rem 0.85rem',
                border: '1px solid #e5e0d8',
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
                border: '1px solid #e5e0d8',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#777',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">Toute activité</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="never">Jamais</option>
            </select>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value as any })}
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid #e5e0d8',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#777',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">Tous les plans</option>
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="EXPIRED">Expiré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
            <select
              value={filters.payment}
              onChange={(e) => setFilters({ ...filters, payment: e.target.value as any })}
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid #e5e0d8',
                borderRadius: 7,
                background: '#fff',
                fontSize: '0.75rem',
                color: '#777',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              <option value="all">Tous paiements</option>
              <option value="paid">Payé</option>
              <option value="overdue">En retard</option>
              <option value="none">Aucun</option>
            </select>
          </div>
        </div>
      )}

      {/* Mobile filter sheet */}
      {isMobile && showFilterSheet && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e0d8',
          padding: '0.8rem',
          marginBottom: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}>
          <select
            value={filters.activity}
            onChange={(e) => setFilters({ ...filters, activity: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e0d8', borderRadius: 7, fontSize: '0.75rem', color: '#777' }}
          >
            <option value="all">Toute activité</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="never">Jamais</option>
          </select>
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e0d8', borderRadius: 7, fontSize: '0.75rem', color: '#777' }}
          >
            <option value="all">Tous les plans</option>
            <option value="TRIAL">Essai</option>
            <option value="ACTIVE">Actif</option>
            <option value="EXPIRED">Expiré</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          <select
            value={filters.payment}
            onChange={(e) => setFilters({ ...filters, payment: e.target.value as any })}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e0d8', borderRadius: 7, fontSize: '0.75rem', color: '#777' }}
          >
            <option value="all">Tous paiements</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
            <option value="none">Aucun</option>
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
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        onDelete={() => setShowBulkDeleteConfirm(true)}
        onClear={() => setSelectedIds(new Set())}
      />

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
          title={`Upgrader ${upgradeModal.clinicName}`}
          message="Cela va upgrader le cabinet au plan MENSUEL et mettre le statut d'abonnement à ACTIF."
          confirmText="Upgrader"
          variant="info"
          isLoading={isUpgrading}
        />
      )}
      {showBulkDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Supprimer ${selectedIds.size} cabinet${selectedIds.size > 1 ? 's' : ''}`}
          message={`Cela supprimera définitivement ${selectedIds.size} cabinet${selectedIds.size > 1 ? 's' : ''} et toutes leurs données. Cette action est irréversible.`}
          confirmText={isBulkDeleting ? 'Suppression...' : 'Tout supprimer'}
          variant="danger"
          isLoading={isBulkDeleting}
        />
      )}
    </div>
  );
}
