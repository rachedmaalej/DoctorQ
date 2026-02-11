import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import type { ClinicHealth } from '../../../types';
import ExtendTrialModal from '../ExtendTrialModal';
import ConfirmModal from '../../ui/ConfirmModal';

type SubStatusFilter = 'all' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export default function ClinicsTab() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<ClinicHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at_risk' | 'paused'>('all');
  const [subStatusFilter, setSubStatusFilter] = useState<SubStatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'patients' | 'lastActive' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [trialModal, setTrialModal] = useState<{ clinicId: string; clinicName: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ clinicId: string; clinicName: string; plan: 'MONTHLY' | 'YEARLY' } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminClinics();
      setClinics(data);
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchClinics, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredClinics = clinics
    .filter((clinic) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!clinic.name.toLowerCase().includes(q) &&
            !clinic.doctorName?.toLowerCase().includes(q) &&
            !clinic.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'paused' && clinic.isActive !== false) return false;
      if (statusFilter !== 'all' && statusFilter !== 'paused' && clinic.status !== statusFilter) return false;
      if (subStatusFilter !== 'all' && clinic.subscriptionStatus !== subStatusFilter) return false;
      if (paymentFilter !== 'all' && clinic.paymentStatus !== paymentFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'patients': cmp = a.patientsToday - b.patientsToday; break;
        case 'lastActive':
          cmp = (a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0) -
                (b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0); break;
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDirection('asc'); }
  };

  const getSortIcon = (col: string) => sortBy !== col ? '↕' : sortDirection === 'asc' ? '↑' : '↓';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return date.toLocaleDateString('fr-FR');
  };

  const getSubStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      TRIAL: 'text-[#459FB8]',
      ACTIVE: 'text-[#337023]',
      PAST_DUE: 'text-[#E15720]',
      EXPIRED: 'text-[#8AADAA]',
      CANCELLED: 'text-[#E15720]',
    };
    return (
      <span className={`text-xs font-bold uppercase ${styles[status] || 'text-[#8AADAA]'}`}>
        {status}
      </span>
    );
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal) return;
    setIsUpgrading(true);
    try {
      await api.upgradeClinicSubscription(upgradeModal.clinicId, upgradeModal.plan);
      setUpgradeModal(null);
      fetchClinics();
    } catch {
      // Keep modal open on failure so user can retry
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-[#132E2C] tracking-tight">Clinic Directory</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search name, doctor, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[#E6F2F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#267B75] focus:border-transparent w-56 text-[#132E2C] placeholder:text-[#8AADAA]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-[#E6F2F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#267B75] text-[#132E2C]"
          >
            <option value="all">All Activity</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value as SubStatusFilter)}
            className="px-3 py-1.5 text-sm border border-[#E6F2F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#267B75] text-[#132E2C]"
          >
            <option value="all">All Plans</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-[#E6F2F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#267B75] text-[#132E2C]"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#E6F2F0] rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E6F2F0]">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase cursor-pointer hover:bg-[#F3FAF9]"
                  onClick={() => handleSort('name')}>
                Clinic {getSortIcon('name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Subscription</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Trial Ends</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase cursor-pointer hover:bg-[#F3FAF9]"
                  onClick={() => handleSort('lastActive')}>
                Last Active {getSortIcon('lastActive')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase cursor-pointer hover:bg-[#F3FAF9]"
                  onClick={() => handleSort('patients')}>
                Patients {getSortIcon('patients')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">SMS</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase cursor-pointer hover:bg-[#F3FAF9]"
                  onClick={() => handleSort('created')}>
                Joined {getSortIcon('created')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6F2F0]">
            {filteredClinics.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#8AADAA]">
                  {clinics.length === 0 ? 'No clinics yet.' : 'No clinics match filters.'}
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-[#F3FAF9] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium hover:underline ${clinic.isActive ? 'text-[#267B75]' : 'text-[#8AADAA]'}`}>{clinic.name}</span>
                        {!clinic.isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#FEF3EE] text-[#E15720]">Paused</span>
                        )}
                      </div>
                      <div className="text-xs text-[#8AADAA]">{clinic.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getSubStatusBadge(clinic.subscriptionStatus)}
                    {clinic.subscriptionPlan && (
                      <span className="ml-1 text-xs text-[#8AADAA]">{clinic.subscriptionPlan}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4E7572]">
                    {clinic.trialEndsAt
                      ? new Date(clinic.trialEndsAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4E7572]">
                    {formatDate(clinic.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#132E2C] font-medium">
                    {clinic.patientsToday}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4E7572]">
                    {clinic.smsCredits}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4E7572]">
                    {new Date(clinic.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {clinic.subscriptionStatus === 'TRIAL' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setTrialModal({ clinicId: clinic.id, clinicName: clinic.name }); }}
                          className="px-2 py-1 text-xs text-[#459FB8] border border-[#459FB8] rounded hover:bg-[#459FB8] hover:text-white transition-colors"
                          title="Extend trial"
                        >
                          Extend
                        </button>
                      )}
                      {(clinic.subscriptionStatus === 'TRIAL' || clinic.subscriptionStatus === 'EXPIRED') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setUpgradeModal({ clinicId: clinic.id, clinicName: clinic.name, plan: 'MONTHLY' }); }}
                          className="px-2 py-1 text-xs text-[#337023] border border-[#337023] rounded hover:bg-[#337023] hover:text-white transition-colors"
                          title="Upgrade to paid"
                        >
                          Upgrade
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
                        className="px-2 py-1 text-xs text-[#4E7572] border border-[#E6F2F0] rounded hover:bg-[#F3FAF9] transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-[#E6F2F0] text-sm text-[#8AADAA]">
          Showing {filteredClinics.length} of {clinics.length} clinics
        </div>
      </div>

      {trialModal && (
        <ExtendTrialModal
          isOpen={true}
          clinicId={trialModal.clinicId}
          clinicName={trialModal.clinicName}
          onClose={() => setTrialModal(null)}
          onExtended={fetchClinics}
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
    </div>
  );
}
