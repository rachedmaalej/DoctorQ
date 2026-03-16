import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    async function handleCallback() {
      if (calledRef.current) return;
      calledRef.current = true;
      try {
        if (!supabase) {
          setError('Social login is not configured.');
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          setError('Failed to complete sign-in. Please try again.');
          return;
        }

        // Read saved context from sessionStorage
        const provider = (sessionStorage.getItem('oauth_provider') || 'google') as 'google' | 'apple' | 'facebook';
        const clinicName = sessionStorage.getItem('oauth_clinic_name') || undefined;
        const language = (sessionStorage.getItem('oauth_language') || undefined) as 'fr' | 'ar' | undefined;
        const source = sessionStorage.getItem('oauth_source') || 'signup';

        // Exchange Supabase token for app JWT
        const result = await api.oauthLogin({
          supabaseToken: session.access_token,
          provider,
          clinicName,
          language,
        });

        // Clean up sessionStorage
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('oauth_clinic_name');
        sessionStorage.removeItem('oauth_language');
        sessionStorage.removeItem('oauth_source');

        if (result.isNewUser) {
          // New user — set clinic info and skip to QR reveal
          useOnboardingStore.getState().setClinicInfo(result.clinicId!, result.clinicName!);
          navigate('/onboarding?step=qr', { replace: true });
        } else if (source === 'login') {
          // Existing user from login page
          await checkAuth();
          navigate('/dashboard', { replace: true });
        } else {
          // Existing user from signup → still go to dashboard
          await checkAuth();
          navigate('/dashboard', { replace: true });
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        if (err.code === 'CLINIC_NAME_REQUIRED') {
          // Lost sessionStorage — redirect to onboarding to re-enter
          navigate('/onboarding', { replace: true });
        } else {
          setError(err.message || 'Sign-in failed. Please try again.');
        }
      }
    }

    handleCallback();
  }, [navigate, checkAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-primary-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
