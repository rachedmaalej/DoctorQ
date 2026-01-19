/**
 * Prometheus Metrics Configuration
 * Exposes API metrics for monitoring and alerting
 */

import client from 'prom-client';

// Enable default metrics (CPU, memory, event loop, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'doctorq_' });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'doctorq_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: 'doctorq_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Active socket connections gauge
export const activeSocketConnections = new client.Gauge({
  name: 'doctorq_socket_connections_active',
  help: 'Number of active Socket.io connections',
});

// Socket rooms gauge (by type)
export const activeSocketRooms = new client.Gauge({
  name: 'doctorq_socket_rooms_active',
  help: 'Number of active Socket.io rooms by type',
  labelNames: ['type'],
});

// Queue entries gauge (by clinic and status)
export const queueEntries = new client.Gauge({
  name: 'doctorq_queue_entries',
  help: 'Number of queue entries by status',
  labelNames: ['status'],
});

// Patients processed today counter
export const patientsProcessedToday = new client.Gauge({
  name: 'doctorq_patients_today',
  help: 'Number of patients processed today',
});

// API errors counter
export const apiErrorsTotal = new client.Counter({
  name: 'doctorq_api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type'],
});

// Database query duration histogram
export const dbQueryDuration = new client.Histogram({
  name: 'doctorq_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

/**
 * Express middleware to track HTTP metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  // Normalize route for metrics (avoid high cardinality)
  const route = normalizeRoute(req.path);

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
  });

  next();
}

/**
 * Normalize route paths to prevent high cardinality
 * e.g., /api/queue/abc123 -> /api/queue/:id
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
    .replace(/\/[0-9]+/g, '/:id') // Numeric IDs
    .replace(/\/patient\/[^/]+/g, '/patient/:id') // Patient entry IDs
    .replace(/\/checkin\/[^/]+/g, '/checkin/:clinicId'); // Clinic IDs in checkin
}

// Export the registry for the metrics endpoint
export const register = client.register;
