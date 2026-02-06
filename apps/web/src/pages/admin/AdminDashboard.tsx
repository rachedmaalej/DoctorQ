/**
 * Admin Dashboard v2 - BléSaf SaaS Command Center
 * Linear Monochrome design with Teal Clinical palette
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { AdminTab } from '../../types';
import AdminTabBar from '../../components/admin/AdminTabBar';
import CreateClinicModal from '../../components/admin/CreateClinicModal';
import OverviewTab from '../../components/admin/tabs/OverviewTab';
import ClinicsTab from '../../components/admin/tabs/ClinicsTab';
import FinancialTab from '../../components/admin/tabs/FinancialTab';
import EngagementTab from '../../components/admin/tabs/EngagementTab';
import PlatformHealthTab from '../../components/admin/tabs/PlatformHealthTab';

const VALID_TABS: AdminTab[] = ['overview', 'clinics', 'financial', 'engagement', 'platform'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const rawTab = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'overview';

  // Prevent all native scrollbars while admin dashboard is mounted
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.classList.add('no-scrollbar');
    body.classList.add('no-scrollbar');
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      html.classList.remove('no-scrollbar');
      body.classList.remove('no-scrollbar');
    };
  }, []);

  const handleTabChange = useCallback((tab: AdminTab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClinicCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="h-screen overflow-y-auto no-scrollbar bg-[#FDFFFF]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header — clean white */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center pt-6 pb-2">
          <h1 className="text-xl font-bold text-[#132E2C] tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 text-sm bg-[#267B75] text-white rounded hover:bg-[#1F6560] font-medium transition-colors"
            >
              + New Clinic
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-[#E15720] hover:text-[#ff7040] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <AdminTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab key={`overview-${refreshKey}`} />}
        {activeTab === 'clinics' && <ClinicsTab key={`clinics-${refreshKey}`} />}
        {activeTab === 'financial' && <FinancialTab />}
        {activeTab === 'engagement' && <EngagementTab />}
        {activeTab === 'platform' && <PlatformHealthTab />}
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleClinicCreated}
      />
    </div>
  );
}
