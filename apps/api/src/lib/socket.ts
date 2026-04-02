import { Server } from 'socket.io';
import { logger } from './logger.js';

// Socket.io instance holder - will be set by index.ts
let io: Server | null = null;

export function setSocketIO(socketIO: Server) {
  io = socketIO;
}

export function getSocketIO(): Server | null {
  return io;
}

// Helper function to emit to a specific room
export function emitToRoom(room: string, event: string, data: any) {
  if (io) {
    // Check how many clients are in the room
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const clientCount = roomSockets ? roomSockets.size : 0;
    logger.debug({ event, room, clientCount }, 'Socket.io emit');
    io.to(room).emit(event, data);
  } else {
    logger.warn({ event }, 'Socket.io not initialized, cannot emit');
  }
}

// Phase 3: Doctor state change events
export function emitDoctorState(clinicId: string, doctorId: string, state: string, eta?: string) {
  emitToRoom(`clinic:${clinicId}`, 'doctor:state', { doctorId, state, eta });
}

export function emitPatientTransferred(clinicId: string, patientId: string, fromDoctorId: string, toDoctorId: string) {
  emitToRoom(`clinic:${clinicId}`, 'patient:transferred', { patientId, fromDoctorId, toDoctorId });
}

export function emitDelayNotified(clinicId: string, doctorId: string, delayMinutes: number) {
  emitToRoom(`clinic:${clinicId}`, 'delay:notified', { doctorId, delayMinutes });
}

// Public queue update — emitted to unauthenticated check-in page viewers
export function emitPublicQueueUpdate(clinicId: string, data: Record<string, unknown>) {
  emitToRoom(`clinic:${clinicId}:public`, 'queue:public:update', data);
}
