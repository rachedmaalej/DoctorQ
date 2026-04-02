import 'dotenv/config'; // Must be first — loads .env before other modules evaluate
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import * as Sentry from '@sentry/node';

// Initialize Sentry before other imports
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { setSocketIO } from './lib/socket.js';
import { initScheduledTasks } from './lib/scheduler.js';
import { prisma } from './lib/prisma.js';
import { verifyToken } from './lib/auth.js';
import authRoutes from './routes/auth.js';
import signupRoutes from './routes/signup.js';
import subscriptionRoutes from './routes/subscription.js';
import queueRoutes from './routes/queue.js';
import clinicRoutes from './routes/clinic.js';
import adminRoutes from './routes/admin.js';
import doctorRoutes from './routes/doctor.js';
import metricsRoutes from './routes/metrics.js';
import leadsRoutes from './routes/leads.js';
import pushRoutes from './routes/push.js';
import patientRoutes from './routes/patients.js';
import scheduleRoutes from './routes/schedule.js';
import { metricsMiddleware, activeSocketConnections } from './lib/metrics.js';
import { logger } from './lib/logger.js';
import { brand } from './lib/brand.js';

const app = express();
const httpServer = createServer(app);

// Parse CORS origins: merge env-configured origins with always-allowed origins
const alwaysAllowed = [
  'https://web-zeta-five-39.vercel.app',
  'https://ausuivant-production.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5190',
  'http://localhost:5200',
];
const envOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...alwaysAllowed, ...envOrigins])];

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
app.use(express.json({
  verify: (req, _res, buf) => {
    // Preserve raw body for Stripe webhook signature verification
    (req as any).rawBody = buf;
  },
}));

// HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...corsOrigins, 'wss:', 'ws:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Metrics middleware (track HTTP request duration and count)
app.use(metricsMiddleware);

// Rate limiting for public endpoints (prevents abuse)
const isDevEnv = process.env.NODE_ENV !== 'production';
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevEnv ? 300 : 30, // Relaxed in dev for simulator/testing
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for authenticated endpoints (more generous)
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevEnv ? 600 : 100, // Relaxed in dev for simulator/testing
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Health check with DB and Socket.io status
app.get('/health', async (req, res) => {
  const checks: Record<string, string> = { api: 'ok' };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Socket.io check
  const { getSocketIO } = await import('./lib/socket.js');
  const io = getSocketIO();
  checks.socketio = io ? 'ok' : 'not_initialized';

  const allOk = Object.values(checks).every(v => v === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Brand identity endpoint (used by frontend to detect brand mismatches in dev)
app.get('/api/brand', (_req, res) => {
  res.json({ brand: brand.id, country: brand.country });
});

// Prometheus metrics endpoint
app.use('/metrics', metricsRoutes);

// Apply rate limiting to public endpoints (before routes)
app.use('/api/queue/checkin', publicRateLimiter);
app.use('/api/queue/patient', publicRateLimiter);
// Public queue snapshot for check-in page (rate limited to 60/min)
app.use(/\/api\/queue\/[^/]+\/public/, rateLimit({
  windowMs: 60 * 1000,
  max: isDevEnv ? 300 : 60,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/signup', publicRateLimiter);
app.use('/api/leads', publicRateLimiter);
app.use('/api/push', publicRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/clinic/doctors', doctorRoutes);
app.use('/api/clinic/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/patients', patientRoutes);

// Apply rate limiting to authenticated endpoints
app.use('/api/queue', authRateLimiter);
app.use('/api/clinic', authRateLimiter);
app.use('/api/subscription', authRateLimiter);
app.use('/api/admin', authRateLimiter);

// Socket.io connection handling
const isDev = process.env.NODE_ENV === 'development';

io.on('connection', (socket) => {
  if (isDev) logger.debug({ socketId: socket.id }, 'Socket.io client connected');
  activeSocketConnections.inc();

  // Debug: Log all incoming events (development only)
  if (isDev) {
    socket.onAny((eventName, ...args) => {
      logger.debug({ event: eventName, socketId: socket.id }, 'Socket.io event');
    });
  }

  // Join clinic room (for doctor/receptionist) - SECURED with token verification
  socket.on('join:clinic', ({ clinicId, token }) => {
    try {
      // Verify the JWT token
      if (!token) {
        logger.warn({ socketId: socket.id }, 'Socket.io join without token');
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const payload = verifyToken(token);

      // Verify the token belongs to the requested clinic
      if (payload.clinicId !== clinicId) {
        logger.warn({ socketId: socket.id, tokenClinicId: payload.clinicId, requestedClinicId: clinicId }, 'Socket.io clinicId mismatch');
        socket.emit('error', { message: 'Unauthorized access to clinic' });
        return;
      }

      const roomName = `clinic:${clinicId}`;
      socket.join(roomName);
      if (isDev) {
        const roomSockets = io.sockets.adapter.rooms.get(roomName);
        const clientCount = roomSockets ? roomSockets.size : 0;
        logger.debug({ socketId: socket.id, room: roomName, clientCount }, 'Socket.io joined clinic room');
      }
      // Confirm to client that they joined successfully
      socket.emit('joined:clinic', { clinicId, success: true });
    } catch (error) {
      logger.error({ err: error }, 'Socket.io join clinic auth error');
      socket.emit('error', { message: 'Invalid or expired token' });
    }
  });

  // Join patient room (for patient status page)
  socket.on('join:patient', async ({ entryId }) => {
    try {
      const roomName = `patient:${entryId}`;
      socket.join(roomName);
      if (isDev) logger.debug({ socketId: socket.id, room: roomName }, 'Socket.io joined patient room');

      // Also join the clinic's patients room to receive doctor presence updates
      const entry = await prisma.queueEntry.findUnique({
        where: { id: entryId },
        select: { clinicId: true },
      });

      if (entry?.clinicId) {
        const clinicPatientsRoom = `clinic:${entry.clinicId}:patients`;
        socket.join(clinicPatientsRoom);
        if (isDev) logger.debug({ socketId: socket.id, room: clinicPatientsRoom }, 'Socket.io joined clinic patients room');
      }

      socket.emit('joined:patient', { entryId, success: true });
    } catch (error) {
      logger.error({ err: error }, 'Socket.io join patient error');
      socket.emit('error', { message: 'Failed to join patient room' });
    }
  });

  // Join public queue room (for check-in page — no auth required)
  socket.on('join:public', ({ clinicId }: { clinicId: string }) => {
    if (!clinicId) return;
    const roomName = `clinic:${clinicId}:public`;
    socket.join(roomName);
    if (isDev) logger.debug({ socketId: socket.id, room: roomName }, 'Socket.io joined public queue room');
    socket.emit('joined:public', { clinicId, success: true });
  });

  socket.on('leave:public', ({ clinicId }: { clinicId: string }) => {
    if (!clinicId) return;
    const roomName = `clinic:${clinicId}:public`;
    socket.leave(roomName);
    if (isDev) logger.debug({ socketId: socket.id, room: roomName }, 'Socket.io left public queue room');
  });

  socket.on('disconnect', () => {
    if (isDev) logger.debug({ socketId: socket.id }, 'Socket.io client disconnected');
    activeSocketConnections.dec();
  });
});

// Socket.io instance is available via lib/socket.ts

// Sentry error handler (must be before custom error handler)
Sentry.setupExpressErrorHandler(app);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
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
  logger.info({ port: PORT }, 'DoctorQ API Server running');
  logger.info({ url: `http://localhost:${PORT}/health` }, 'Health check endpoint');
  logger.info('Socket.io ready for connections');

  // Initialize scheduled tasks
  initScheduledTasks();
});
