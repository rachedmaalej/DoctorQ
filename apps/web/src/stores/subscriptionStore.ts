import { create } from 'zustand';
import { api } from '@/lib/api';

export interface SubscriptionInfo {
  status: string;
  plan: string | null;
  tier: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  canUseApp: boolean;
  limits: { dailyPatients: number; maxDoctors: number; historyDays: number };
  usage: { dailyPatientCount: number };
}

interface SubscriptionState {
  data: SubscriptionInfo | null;
  isLoading: boolean;
  lastFetchedAt: number;
  fetch: () => Promise<SubscriptionInfo | null>;
}

const STALE_MS = 60_000; // Consider data stale after 60s

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  data: null,
  isLoading: false,
  lastFetchedAt: 0,

  fetch: async () => {
    const { data, isLoading, lastFetchedAt } = get();

    // Return cached data if fresh
    if (data && Date.now() - lastFetchedAt < STALE_MS && !isLoading) {
      return data;
    }

    // Deduplicate concurrent fetches
    if (isLoading && data) return data;

    set({ isLoading: true });
    try {
      const result = await api.getSubscription();
      set({ data: result, isLoading: false, lastFetchedAt: Date.now() });
      return result;
    } catch {
      set({ isLoading: false });
      return get().data;
    }
  },
}));
