import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from this app's .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Import routes
import doctorsRouter from './routes/doctors.js';
import patientsRouter from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import calendarRouter from './routes/calendar.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5175',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5175',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medibook-api', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/calendar', calendarRouter);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join:clinic', ({ clinicId }: { clinicId: string }) => {
    socket.join(`clinic:${clinicId}`);
    console.log(`[Socket] ${socket.id} joined clinic:${clinicId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`MediBook API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export { io };
