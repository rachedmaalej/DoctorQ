import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { webBrand } from './lib/brand';

// Lazy load pages for code splitting - reduces initial bundle by ~40%
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OnboardingFlow = lazy(() => import('./features/onboarding/OnboardingFlow'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PatientStatusPage = lazy(() => import('./pages/PatientStatusPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClinicsDirectoryPage = lazy(() => import('./pages/admin/clinics/ClinicsDirectoryPage'));
const ClinicsClinicDetailPage = lazy(() => import('./pages/admin/clinics/ClinicDetailPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LandingPageFr = lazy(() => import('./pages/LandingPageFr'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TeaserPage = lazy(() => import('./pages/TeaserPage'));
const ReceptionistPreview = lazy(() => import('./components/receptionist/ReceptionistPreview'));
const DemoSimulation = lazy(() => import('./components/demo/DemoSimulation'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

// Lightweight loading spinner for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

function LegacyClinicRedirect() {
  const { clinicId } = useParams();
  return <Navigate to={`/admin/clinics/${clinicId}`} replace />;
}

function App() {
  const { isAuthenticated, isLoading, checkAuth, clinic, isImpersonating } = useAuthStore();
  const needsOnboarding = isAuthenticated && !clinic?.isAdmin && !isImpersonating && !clinic?.onboardingCompleted && webBrand.id !== 'france';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root redirects to dashboard (if logged in) or landing */}
        <Route path="/" element={isAuthenticated ? <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} /> : (webBrand.theme.dashboard.variant === 'schedule' ? <LandingPageFr /> : <LandingPage />)} />

        {/* Onboarding flow (Turbo Wizard) — accessible without auth (signup happens at step 3) */}
        <Route path="/onboarding" element={
          isAuthenticated && clinic?.onboardingCompleted
            ? <Navigate to="/dashboard" replace />
            : <OnboardingFlow />
        } />

        {/* Legacy signup routes → redirect to new onboarding */}
        <Route path="/signup" element={<Navigate to="/onboarding" replace />} />
        <Route path="/signup/setup" element={<Navigate to="/onboarding" replace />} />
        <Route path="/welcome" element={<Navigate to="/onboarding" replace />} />

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Public auth routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/patient/:entryId" element={<PatientStatusPage />} />
        <Route path="/checkin/:clinicId" element={<CheckInPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/teaser" element={<TeaserPage />} />
        <Route path="/receptionist" element={<ReceptionistPreview />} />
        <Route path="/demo" element={<div className="min-h-screen flex items-center justify-center bg-gray-100"><DemoSimulation /></div>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated
              ? (needsOnboarding ? <Navigate to="/onboarding" /> : <DashboardPage />)
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/subscription"
          element={isAuthenticated ? <SubscriptionPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/clinics"
          element={isAuthenticated ? <ClinicsDirectoryPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/clinics/:clinicId"
          element={isAuthenticated ? <ClinicsClinicDetailPage /> : <Navigate to="/login" />}
        />
        {/* Legacy route → redirect to new path */}
        <Route
          path="/admin/clinic/:clinicId"
          element={<LegacyClinicRedirect />}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
