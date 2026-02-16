import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import CreateClinicModal from '@/components/admin/CreateClinicModal';
import BlesafTopNav from '../blesaf/components/BlesafTopNav';
import AusuivantDarkTopBar from '../ausuivant/components/AusuivantDarkTopBar';

const BlesafClinicsDirectory = lazy(() => import('./blesaf/BlesafClinicsDirectory'));
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
    <div className="h-screen overflow-y-auto no-scrollbar" style={{ background: isFrance ? '#f4f1ec' : '#f7f5f1' }}>
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
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          style={{ minHeight: 'calc(100vh - 56px)' }}
        >
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderBottomColor: isFrance ? '#c0392b' : '#2a9d6e' }}
                />
              </div>
            }
          >
            {isFrance ? (
              <AusuivantClinicsDirectory key={`dir-${refreshKey}`} />
            ) : (
              <BlesafClinicsDirectory key={`dir-${refreshKey}`} />
            )}
          </Suspense>
        </div>
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
