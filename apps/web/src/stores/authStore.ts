import { create } from 'zustand';
import type { Clinic, LoginCredentials } from '@/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

interface AuthState {
  clinic: Clinic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  clinic: null,
  isAuthenticated: false,
  isLoading: true,  // Start as true to show loading until checkAuth completes
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(credentials);
      set({
        clinic: response.clinic,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Still clear local state even if API call fails
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    logger.log('[AuthStore] checkAuth called, token:', token ? 'present' : 'missing');
    if (!token) {
      logger.log('[AuthStore] No token, setting isAuthenticated: false');
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const clinic = await api.getMe();
      logger.log('[AuthStore] getMe succeeded, clinic:', clinic);
      set({
        clinic,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      logger.error('[AuthStore] checkAuth error:', error);
      // Token is invalid, clear it
      api.clearToken();
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
