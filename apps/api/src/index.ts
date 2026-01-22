import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { setSocketIO } from './lib/socket.js';
import { prisma } from './lib/prisma.js';
import { verifyToken } from './lib/auth.js';
import authRoutes from './routes/auth.js';
import queueRoutes from './routes/queue.js';
import clinicRoutes from './routes/clinic.js';
import adminRoutes from './routes/admin.js';
import metricsRoutes from './routes/metrics.js';
import { metricsMiddleware, activeSocketConnections } from './lib/metrics.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse CORS origins (supports comma-separated list)
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

// Make io available to other modules via socket utility
setSocketIO(io);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Metrics middleware (track HTTP request duration and count)
app.use(metricsMiddleware);

// Rate limiting for public endpoints (prevents abuse)
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Flexible seed endpoint for production (protected by secret)
app.post('/api/seed', async (req, res) => {
  const { secret, clinic: clinicData } = req.body;

  // Verify secret matches JWT_SECRET (only admin knows this)
  if (secret !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // If clinic data provided, create that clinic
    if (clinicData) {
      const { name, email, password, phone, address, language, avgConsultationMins, notifyAtPosition } = clinicData;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email, and password are required' });
      }

      // Check if clinic already exists
      const existing = await prisma.clinic.findUnique({ where: { email } });
      if (existing) {
        return res.json({ message: 'Clinic already exists', clinicId: existing.id });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const clinic = await prisma.clinic.create({
        data: {
          name,
          email,
          passwordHash,
          phone: phone || null,
          address: address || null,
          language: language || 'fr',
          avgConsultationMins: avgConsultationMins || 10,
          notifyAtPosition: notifyAtPosition || 2,
          enableWhatsApp: false,
        },
      });

      return res.json({
        message: 'Clinic created successfully',
        clinicId: clinic.id,
        credentials: { email, password }
      });
    }

    // Fallback: Create Dr. Kamoun's clinic (original behavior)
    const existingClinic = await prisma.clinic.findUnique({
      where: { email: 'dr.kamoun@doctorq.tn' }
    });

    if (existingClinic) {
      return res.json({ message: 'Clinic already exists', clinicId: existingClinic.id });
    }

    const passwordHash = await bcrypt.hash('DoctorQ2024!', 10);
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Cabinet Dr Skander Kamoun',
        doctorName: 'Dr. Skander Kamoun',
        email: 'dr.kamoun@doctorq.tn',
        passwordHash,
        phone: '+21671234567',
        address: 'Tunis, Tunisia',
        language: 'fr',
        avgConsultationMins: 10,
        notifyAtPosition: 2,
        enableWhatsApp: false,
      },
    });

    res.json({
      message: 'Clinic created successfully',
      clinicId: clinic.id,
      credentials: { email: 'dr.kamoun@doctorq.tn', password: 'DoctorQ2024!' }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

// Prometheus metrics endpoint
app.use('/metrics', metricsRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/admin', adminRoutes);

// Apply rate limiting to public queue endpoints
app.use('/api/queue/checkin', publicRateLimiter);
app.use('/api/queue/patient', publicRateLimiter);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);
  activeSocketConnections.inc();

  // Debug: Log all incoming events
  socket.onAny((eventName, ...args) => {
    console.log(`[Socket.io] Event '${eventName}' from ${socket.id}:`, JSON.stringify(args).slice(0, 200));
  });

  // Join clinic room (for doctor/receptionist) - SECURED with token verification
  socket.on('join:clinic', ({ clinicId, token }) => {
    try {
      // Verify the JWT token
      if (!token) {
        console.warn(`[Socket.io] Client ${socket.id} attempted to join clinic room without token`);
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const payload = verifyToken(token);

      // Verify the token belongs to the requested clinic
      if (payload.clinicId !== clinicId) {
        console.warn(`[Socket.io] Client ${socket.id} token clinicId mismatch: ${payload.clinicId} vs ${clinicId}`);
        socket.emit('error', { message: 'Unauthorized access to clinic' });
        return;
      }

      const roomName = `clinic:${clinicId}`;
      socket.join(roomName);
      // Get room size after joining
      const roomSockets = io.sockets.adapter.rooms.get(roomName);
      const clientCount = roomSockets ? roomSockets.size : 0;
      console.log(`[Socket.io] Client ${socket.id} joined room '${roomName}' (total: ${clientCount} clients)`);
      // Confirm to client that they joined successfully
      socket.emit('joined:clinic', { clinicId, success: true });
    } catch (error) {
      console.error('[Socket.io] Join clinic auth error:', error);
      socket.emit('error', { message: 'Invalid or expired token' });
    }
  });

  // Join patient room (for patient status page)
  socket.on('join:patient', async ({ entryId }) => {
    try {
      const roomName = `patient:${entryId}`;
      socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined room '${roomName}'`);

      // Also join the clinic's patients room to receive doctor presence updates
      const entry = await prisma.queueEntry.findUnique({
        where: { id: entryId },
        select: { clinicId: true },
      });

      if (entry?.clinicId) {
        const clinicPatientsRoom = `clinic:${entry.clinicId}:patients`;
        socket.join(clinicPatientsRoom);
        console.log(`[Socket.io] Client ${socket.id} also joined room '${clinicPatientsRoom}'`);
      }

      socket.emit('joined:patient', { entryId, success: true });
    } catch (error) {
      console.error('[Socket.io] Join patient error:', error);
      socket.emit('error', { message: 'Failed to join patient room' });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Client disconnected:', socket.id);
    activeSocketConnections.dec();
  });
});

// Socket.io instance is available via lib/socket.ts

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server - bind to 0.0.0.0 for Railway deployment
const HOST = '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`\n🚀 DoctorQ API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io ready for connections\n`);
});
