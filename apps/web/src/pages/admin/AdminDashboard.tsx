/**
 * Admin Dashboard — Brand-aware router shell
 * Renders BleSaf "Emerald Cards" or AuSuivant "Warm Beige Editorial"
 * overview based on VITE_BRAND, with existing tabs for non-overview content.
 */

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { AdminTab } from '../../types';
import CreateClinicModal from '../../components/admin/CreateClinicModal';
import { webBrand } from '../../lib/brand';

// Brand-specific top navs (direct import — small components)
import BlesafTopNav from './blesaf/components/BlesafTopNav';
import AusuivantDarkTopBar from './ausuivant/components/AusuivantDarkTopBar';

// Brand-specific overview dashboards (lazy-loaded)
const BlesafAdminDashboard = lazy(() => import('./blesaf/BlesafAdminDashboard'));
const AusuivantAdminDashboard = lazy(() => import('./ausuivant/AusuivantAdminDashboard'));

// Redesigned page components for Financial and Engagement tabs
const FinancialPage = lazy(() => import('./FinancialPage'));
const EngagementPage = lazy(() => import('./EngagementPage'));

// Legacy tab components (used for AuSuivant financial/engagement + clinics/platform)
import ClinicsTab from '../../components/admin/tabs/ClinicsTab';
import FinancialTab from '../../components/admin/tabs/FinancialTab';
import EngagementTab from '../../components/admin/tabs/EngagementTab';
import PlatformHealthTab from '../../components/admin/tabs/PlatformHealthTab';

const VALID_TABS: AdminTab[] = ['overview', 'clinics', 'financial', 'engagement', 'platform'];

const isFrance = webBrand.theme.dashboard.variant === 'schedule';

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
    <div className="h-screen overflow-y-auto no-scrollbar" style={{ background: isFrance ? '#f4f1ec' : '#f7f5f1' }}>
      {/* Brand-specific Top Navigation */}
      {isFrance ? (
        <AusuivantDarkTopBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewClinic={() => setShowCreateModal(true)}
          onLogout={handleLogout}
        />
      ) : (
        <BlesafTopNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewClinic={() => setShowCreateModal(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Tab Content */}
      <main role="main">
        {activeTab === 'overview' && (
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderBottomColor: isFrance ? '#c0392b' : '#2a9d6e' }}
                />
              </div>
            }
          >
            {isFrance ? (
              <AusuivantAdminDashboard key={`overview-${refreshKey}`} />
            ) : (
              <BlesafAdminDashboard key={`overview-${refreshKey}`} />
            )}
          </Suspense>
        )}

        {/* Financial and Engagement use redesigned full-page components (BleSaf only) */}
        {!isFrance && (activeTab === 'financial' || activeTab === 'engagement') && (
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderBottomColor: isFrance ? '#c0392b' : '#2a9d6e' }}
                />
              </div>
            }
          >
            {activeTab === 'financial' && <FinancialPage />}
            {activeTab === 'engagement' && <EngagementPage />}
          </Suspense>
        )}

        {/* AuSuivant: legacy Financial & Engagement tabs */}
        {isFrance && (activeTab === 'financial' || activeTab === 'engagement') && (
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            style={{ background: '#f4f1ec', minHeight: 'calc(100vh - 56px)' }}
          >
            {activeTab === 'financial' && <FinancialTab />}
            {activeTab === 'engagement' && <EngagementTab />}
          </div>
        )}

        {/* Legacy tabs for clinics and platform */}
        {(activeTab === 'clinics' || activeTab === 'platform') && (
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            style={{ background: isFrance ? '#f4f1ec' : '#f7f5f1', minHeight: 'calc(100vh - 56px)' }}
          >
            {activeTab === 'clinics' && <ClinicsTab key={`clinics-${refreshKey}`} />}
            {activeTab === 'platform' && <PlatformHealthTab />}
          </div>
        )}
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleClinicCreated}
      />
    </div>
  );
}
