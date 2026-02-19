/**
 * ReportGenerator — Produces a daily simulation report in Markdown format.
 */

import * as fs from 'fs';
import * as path from 'path';
import { MetricsCollector } from '../metrics/collector';

export function generateReport(
  collectors: MetricsCollector[],
  simulationDate: Date,
  compressionFactor: number
): string {
  const dateStr = simulationDate.toISOString().split('T')[0];
  const lines: string[] = [];

  const ln = (s: string = '') => lines.push(s);

  // ─── Header ────────────────────────────────────────────────────────────

  ln(`# BleSaf Daily Simulation Report`);
  ln(`**Date:** ${dateStr}  `);
  ln(`**Generated:** ${new Date().toISOString()}  `);
  ln(`**Mode:** Compressed (${compressionFactor}x speed)`);
  ln();
  ln(`---`);
  ln();

  // ─── Executive Summary ─────────────────────────────────────────────────

  ln(`## Executive Summary`);
  ln();

  const totalPatients = collectors.reduce((s, c) => s + c.getPatientMetrics().total, 0);
  const totalCompleted = collectors.reduce((s, c) => s + c.getPatientMetrics().completed, 0);
  const totalErrors = collectors.reduce((s, c) => s + c.getTotalErrors(), 0);
  const totalApiCalls = collectors.reduce((s, c) => s + c.getTotalApiCalls(), 0);

  ln(`| Metric | Value |`);
  ln(`|--------|-------|`);
  ln(`| Clinics Simulated | ${collectors.length} |`);
  ln(`| Total Patients | ${totalPatients} |`);
  ln(`| Total Completed | ${totalCompleted} (${pct(totalCompleted, totalPatients)}) |`);
  ln(`| Total API Calls | ${totalApiCalls} |`);
  ln(`| Total Errors | ${totalErrors} |`);
  ln(`| Error Rate | ${pct(totalErrors, totalApiCalls)} |`);
  ln();

  // ─── Per-Clinic Reports ────────────────────────────────────────────────

  for (const collector of collectors) {
    ln(`---`);
    ln();
    ln(`## ${collector.getClinicName()}`);
    ln();

    // Patient Metrics
    const pm = collector.getPatientMetrics();
    ln(`### Patient Flow`);
    ln();
    ln(`| Metric | Value |`);
    ln(`|--------|-------|`);
    ln(`| Total Patients | ${pm.total} |`);
    ln(`| Completed | ${pm.completed} (${pct(pm.completed, pm.total)}) |`);
    ln(`| Left Queue | ${pm.left} (${pct(pm.left, pm.total)}) |`);
    ln(`| Still Waiting (EOD) | ${pm.stillWaiting} |`);
    ln(`| Avg Wait Time | ${pm.avgWaitMinutes} real-min |`);
    ln(`| Median Wait Time | ${pm.medianWaitMinutes} real-min |`);
    ln(`| Max Wait Time | ${pm.maxWaitMinutes} real-min |`);
    ln(`| Avg Status Checks/Patient | ${pm.avgStatusChecks} |`);
    ln();

    // API Performance
    const apiStats = collector.getApiCallsByEndpoint();
    ln(`### API Performance`);
    ln();
    ln(`| Endpoint | Calls | Avg (ms) | Max (ms) | Errors |`);
    ln(`|----------|-------|----------|----------|--------|`);
    for (const [endpoint, stats] of apiStats) {
      const errorFlag = stats.errors > 0 ? ' ⚠️' : '';
      ln(`| ${endpoint} | ${stats.count} | ${stats.avgMs} | ${stats.maxMs} | ${stats.errors}${errorFlag} |`);
    }
    ln();

    // Socket.io Events
    const socketStats = collector.getSocketMetrics();
    ln(`### Socket.io Events`);
    ln();
    ln(`| Event | Count |`);
    ln(`|-------|-------|`);
    for (const [event, count] of socketStats.byEvent) {
      ln(`| ${event} | ${count} |`);
    }
    ln(`| **Total** | **${socketStats.total}** |`);
    ln();

    // Queue Snapshots (timeline)
    const snapshots = collector.getQueueSnapshots();
    if (snapshots.length > 0) {
      ln(`### Queue Timeline`);
      ln();
      ln(`| Sim Time | Waiting | In Consultation | Completed | Total |`);
      ln(`|----------|---------|-----------------|-----------|-------|`);
      // Show every 5th snapshot to keep report manageable
      const step = Math.max(1, Math.floor(snapshots.length / 15));
      for (let i = 0; i < snapshots.length; i += step) {
        const s = snapshots[i];
        ln(`| ${s.simTime} | ${s.waiting} | ${s.inConsultation} | ${s.completed} | ${s.totalInQueue} |`);
      }
      ln();
    }

    // Errors
    const errors = collector.getErrors();
    if (errors.length > 0) {
      ln(`### Errors`);
      ln();
      ln(`| Time | Method | Endpoint | Status | Message |`);
      ln(`|------|--------|----------|--------|---------|`);
      for (const err of errors.slice(0, 20)) {
        ln(`| ${err.timestamp.toISOString().split('T')[1].split('.')[0]} | ${err.method} | ${err.endpoint} | ${err.statusCode} | ${truncate(err.message, 60)} |`);
      }
      if (errors.length > 20) {
        ln(`| ... | ... | ... | ... | *(${errors.length - 20} more)* |`);
      }
      ln();
    }

    // Simulation Duration
    const dur = collector.getSimulationDuration();
    ln(`*Simulation completed in ${dur.realSeconds} real seconds.*`);
    ln();
  }

  // ─── Recommendations ──────────────────────────────────────────────────

  ln(`---`);
  ln();
  ln(`## Automated Observations`);
  ln();

  const observations: string[] = [];

  for (const collector of collectors) {
    const pm = collector.getPatientMetrics();
    const name = collector.getClinicName();

    if (pm.maxWaitMinutes > 5) {
      observations.push(`**${name}:** Max real wait time of ${pm.maxWaitMinutes} min detected (in compressed time). Investigate queue throughput.`);
    }

    if (pm.left > 0) {
      observations.push(`**${name}:** ${pm.left} patients left the queue (${pct(pm.left, pm.total)} drop-off rate).`);
    }

    if (pm.stillWaiting > 0) {
      observations.push(`**${name}:** ${pm.stillWaiting} patients still in queue at end of day. Queue not clearing fully.`);
    }

    const errors = collector.getErrors();
    if (errors.length > 0) {
      const uniqueEndpoints = new Set(errors.map((e: { endpoint: string }) => e.endpoint));
      observations.push(`**${name}:** ${errors.length} API errors across ${uniqueEndpoints.size} endpoints.`);
    }

    const socketStats = collector.getSocketMetrics();
    if (!socketStats.byEvent.has('queue:updated')) {
      observations.push(`**${name}:** ⚠️ No 'queue:updated' socket events received. Real-time updates may be broken.`);
    }
  }

  if (observations.length === 0) {
    ln(`All clinics performed within expected parameters. No issues detected.`);
  } else {
    for (const obs of observations) {
      ln(`- ${obs}`);
    }
  }

  ln();
  ln(`---`);
  ln(`*Report generated by BleSaf Simulator v1.0*`);

  return lines.join('\n');
}

export function saveReport(content: string, reportsDir: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const filename = `sim-report-${dateStr}_${timeStr}.md`;
  const filepath = path.join(reportsDir, filename);

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.substring(0, max - 3) + '...' : s;
}
