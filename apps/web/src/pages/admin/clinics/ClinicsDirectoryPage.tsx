import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import CreateClinicModal from '@/components/admin/CreateClinicModal';
import BlesafTopNav from '../blesaf/components/BlesafTopNav';
import AusuivantDarkTopBar from '../ausuivant/components/AusuivantDarkTopBar';

// BleSaf uses new redesigned ClinicsPage, AuSuivant keeps existing directory
const ClinicsPage = lazy(() => import('../ClinicsPage'));
const AusuivantClinicsDirectory = lazy(() => import('./ausuivant/AusuivantClinicsDirectory'));

const isFrance = webBrand.id === 'france';

export default function ClinicsDirectoryPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Prevent scrollbars while mounted
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

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/admin?tab=${tab}`);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen overflow-y-auto no-scrollbar" style={{ background: isFrance ? '#f4f1ec' : 'var(--bg)' }}>
      {/* Brand-specific Top Navigation */}
      {isFrance ? (
        <AusuivantDarkTopBar
          activeTab="clinics"
          onTabChange={handleTabChange}
          onNewClinic={() => setShowCreateModal(true)}
          onLogout={handleLogout}
        />
      ) : (
        <BlesafTopNav
          activeTab="clinics"
          onTabChange={handleTabChange}
          onNewClinic={() => setShowCreateModal(true)}
          onLogout={handleLogout}
        />
      )}

      <main role="main">
        <Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderBottomColor: isFrance ? '#c0392b' : 'var(--brand)' }}
              />
            </div>
          }
        >
          {isFrance ? (
            <AusuivantClinicsDirectory key={`dir-${refreshKey}`} />
          ) : (
            <ClinicsPage key={`dir-${refreshKey}`} />
          )}
        </Suspense>
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
