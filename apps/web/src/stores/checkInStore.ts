import { create } from 'zustand'
import type { CheckInPhase, PublicQueueSnapshot, CheckInResponse } from '../types/checkin'

interface CheckInStore {
  phase: CheckInPhase
  snapshot: PublicQueueSnapshot | null
  result: CheckInResponse | null
  error: string | null
  name: string
  rawPhone: string

  setSnapshot: (s: PublicQueueSnapshot) => void
  updateSnapshot: (partial: Partial<PublicQueueSnapshot>) => void
  setPhase: (p: CheckInPhase) => void
  setResult: (r: CheckInResponse) => void
  setError: (e: string | null) => void
  setName: (n: string) => void
  setRawPhone: (p: string) => void
  reset: () => void
}

const initial = {
  phase: 'loading' as CheckInPhase,
  snapshot: null as PublicQueueSnapshot | null,
  result: null as CheckInResponse | null,
  error: null as string | null,
  name: '',
  rawPhone: '',
}

export const useCheckInStore = create<CheckInStore>((set) => ({
  ...initial,
  setSnapshot: (snapshot) => set({ snapshot, phase: 'ready' }),
  updateSnapshot: (partial) =>
    set((s) => ({ snapshot: s.snapshot ? { ...s.snapshot, ...partial } : s.snapshot })),
  setPhase: (phase) => set({ phase }),
  setResult: (result) => set({ result, phase: 'success' }),
  setError: (error) => set({ error, phase: 'error' }),
  setName: (name) => set({ name }),
  setRawPhone: (rawPhone) => set({ rawPhone }),
  reset: () => set(initial),
}))
