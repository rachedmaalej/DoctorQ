/**
 * Prometheus Metrics Endpoint
 * Exposes metrics for Prometheus scraping
 */

import { Router, Request, Response } from 'express';
import { register } from '../lib/metrics.js';

const router = Router();

/**
 * GET /metrics
 * Prometheus scrape endpoint
 *
 * Note: In production, this should be protected or only exposed
 * to internal networks / Prometheus server
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

export default router;
