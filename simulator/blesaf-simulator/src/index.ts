#!/usr/bin/env node
/**
 * BleSaf Clinic Simulator — Entry Point
 *
 * Usage:
 *   npm run sim                           # Run all clinics
 *   npm run sim -- --clinic 0             # Run only first clinic
 *   npm run sim -- --url http://staging   # Override API URL
 *   npm run sim -- --compression 16       # Slower sim (16x instead of 32x)
 */

import * as path from 'path';
import { ClinicSimulation } from './engine';
import { MetricsCollector } from './metrics/collector';
import { generateReport, saveReport } from './report/generator';

// Load config
import config from '../config/clinics.json';

// ─── Parse CLI args ──────────────────────────────────────────────────────────

function parseArgs(): { clinicIndex?: number; url?: string; socketUrl?: string; compression?: number } {
  const args = process.argv.slice(2);
  const parsed: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--clinic':
        parsed.clinicIndex = parseInt(args[++i], 10);
        break;
      case '--url':
        parsed.url = args[++i];
        break;
      case '--socket-url':
        parsed.socketUrl = args[++i];
        break;
      case '--compression':
        parsed.compression = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
BleSaf Clinic Simulator

Options:
  --clinic <n>        Run only clinic at index n (0-based)
  --url <url>         API base URL (default: ${config.apiBaseUrl})
  --socket-url <url>  Socket.io URL (default: same as --url)
  --compression <n>   Time compression factor (default: ${config.timeCompression})
  --help              Show this help

Examples:
  npx ts-node src/index.ts
  npx ts-node src/index.ts --url https://staging.blesaf.tn --clinic 0
  npx ts-node src/index.ts --compression 16
        `);
        process.exit(0);
    }
  }

  return parsed;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();
  const apiUrl = args.url || config.apiBaseUrl;
  const socketUrl = args.socketUrl || args.url || config.socketUrl;
  const compression = args.compression || config.timeCompression;

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║          BleSaf Clinic Simulator v1.0                ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  API URL:     ${apiUrl.padEnd(38)} ║`);
  console.log(`║  Socket URL:  ${socketUrl.padEnd(38)} ║`);
  console.log(`║  Compression: ${(compression + 'x').padEnd(38)} ║`);
  console.log(`║  Sim Duration: ~${(Math.round(480 / compression) + ' real minutes').padEnd(36)} ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  // Select clinics to simulate
  let clinicsToRun = config.clinics;
  if (args.clinicIndex !== undefined) {
    if (args.clinicIndex < 0 || args.clinicIndex >= config.clinics.length) {
      console.error(`Error: Clinic index ${args.clinicIndex} out of range (0-${config.clinics.length - 1})`);
      process.exit(1);
    }
    clinicsToRun = [config.clinics[args.clinicIndex]];
  }

  console.log(`Running ${clinicsToRun.length} clinic(s):\n`);
  for (const clinic of clinicsToRun) {
    console.log(`  • ${clinic.name} (${clinic.profile.dailyPatients.min}-${clinic.profile.dailyPatients.max} patients/day)`);
  }
  console.log();

  // Run simulations concurrently
  const startTime = Date.now();
  const collectors: MetricsCollector[] = [];

  const simulations = clinicsToRun.map((clinicConfig) => {
    const sim = new ClinicSimulation(
      clinicConfig as any,
      apiUrl,
      socketUrl,
      compression
    );
    return sim.run().then((metrics) => {
      collectors.push(metrics);
      return metrics;
    });
  });

  // Wait for all simulations to complete
  try {
    await Promise.all(simulations);
  } catch (err: any) {
    console.error(`\nSimulation error: ${err.message}`);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`All simulations completed in ${totalTime} seconds`);
  console.log(`${'═'.repeat(60)}\n`);

  // Generate report
  console.log('Generating report...');
  const reportContent = generateReport(collectors, new Date(), compression);
  const reportsDir = path.join(__dirname, '..', 'reports');
  const reportPath = saveReport(reportContent, reportsDir);

  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log(`\nView with: cat "${reportPath}"\n`);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
