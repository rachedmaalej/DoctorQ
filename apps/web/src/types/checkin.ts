// Public queue snapshot — returned by GET /api/queue/:clinicId/public
export interface PublicQueueSnapshot {
  clinicId: string
  clinicName: string
  specialty: string
  isDoctorPresent: boolean
  waitingCount: number
  totalToday: number
  avgConsultMinutes: number
  entries: PublicQueueEntry[]
}

export interface PublicQueueEntry {
  position: number
  initials: string
  status: 'IN_CONSULTATION' | 'NOTIFIED' | 'WAITING'
  waitMinutes: number
}

// POST /api/queue/:clinicId/checkin — request body
export interface CheckInPayload {
  name: string
  phone?: string
}

// POST response
export interface CheckInResponse {
  entryId: string
  position: number
  estimatedWaitMinutes: number
  minWaitMins?: number
  maxWaitMins?: number
  totalInQueue: number
}

// Page-level state machine
export type CheckInPhase =
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'error'
