import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TourState =
  | 'IDLE'
  | 'WELCOME'
  | 'SPOTLIGHT_ADD'
  | 'MODAL_GHOST'
  | 'FILLING'
  | 'SPOTLIGHT_PRESENCE'
  | 'DEMO_PRESENCE'
  | 'SPOTLIGHT_SHARE'
  | 'CTX_MENU'
  | 'DONE';

interface TourStore {
  state: TourState;
  hasCompletedTour: boolean;
  setState: (s: TourState) => void;
  completeTour: () => void;
  resetTour: () => void;
  // Fix 1 — click intercept actions (guard current state before transitioning)
  onAddClick: () => void;
  onPresenceClick: () => void;
  onKebabClick: (idx: number) => void;
}

export const useTourStore = create<TourStore>()(
  persist(
    // Fix 1 — (set, get) so actions can read current state
    (set, get) => ({
      state: 'IDLE',
      hasCompletedTour: false,
      setState: (state) => set({ state }),
      completeTour: () => set({ hasCompletedTour: true, state: 'DONE' }),
      resetTour: () => set({ hasCompletedTour: false, state: 'WELCOME' }),
      // Only transition if the tour is in the expected state
      onAddClick:      () => { if (get().state === 'SPOTLIGHT_ADD')      set({ state: 'MODAL_GHOST' }); },
      onPresenceClick: () => { if (get().state === 'SPOTLIGHT_PRESENCE') set({ state: 'DEMO_PRESENCE' }); },
      onKebabClick:    (_idx: number) => { if (get().state === 'SPOTLIGHT_SHARE') set({ state: 'CTX_MENU' }); },
    }),
    {
      name: 'blesaf-tour',
      // Fix 2 — only persist the completion flag; transient states (SPOTLIGHT_ADD, etc.)
      // must NOT survive a page reload or the user returns to a broken mid-tour state.
      partialize: (s) => ({ hasCompletedTour: s.hasCompletedTour }),
    },
  ),
);
