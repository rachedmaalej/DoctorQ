import { Request } from 'express';

// Extend Express Request to include authenticated clinic
export interface AuthRequest extends Request {
  clinic?: {
    id: string;
    email: string;
    name: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Queue statistics
export interface QueueStats {
  waiting: number;
  seen: number;
  avgWait: number | null;
  lastConsultationMins: number | null;
}
