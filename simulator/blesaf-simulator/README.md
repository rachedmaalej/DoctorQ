# BleSaf Clinic Simulator

Automated day-in-the-life testing for BleSaf queue management. Simulates 2–3 clinics with realistic patient traffic patterns, doctor behavior, and generates daily performance reports.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your API URL
#    Edit config/clinics.json → set "apiBaseUrl" and "socketUrl"
#    Or pass via CLI: --url https://your-staging-server.com

# 3. Create test accounts on your BleSaf instance
#    The simulator needs these credentials to exist:
#    - benali@blesaf-test.tn    / test-benali-2026    (Clinic: Dr. Ben Ali)
#    - mansour@blesaf-test.tn   / test-mansour-2026   (Clinic: Dr. Mansour)
#    - trabelsi@blesaf-test.tn  / test-trabelsi-2026  (Clinic: Dr. Trabelsi)
#
#    Create them via your admin panel or seed script.

# 4. Update clinic IDs in config/clinics.json
#    Replace "CLINIC_ID_1", "CLINIC_ID_2", "CLINIC_ID_3" with real IDs

# 5. Run the simulation
npx ts-node src/index.ts --url https://your-staging-url.com
```

## Usage

```bash
# Run all 3 clinics simultaneously (~15 min compressed)
npx ts-node src/index.ts --url https://staging.blesaf.tn

# Run a single clinic (faster for debugging)
npx ts-node src/index.ts --url https://staging.blesaf.tn --clinic 0

# Slower simulation (easier to watch in real-time)
npx ts-node src/index.ts --url https://staging.blesaf.tn --compression 16

# Very fast smoke test
npx ts-node src/index.ts --url https://staging.blesaf.tn --compression 64
```

## What It Simulates

### Clinic Profiles

| Clinic | Specialty | Patients/Day | Pattern |
|--------|-----------|-------------|---------|
| Dr. Ben Ali | Ophthalmology | 40–55 | Heavy morning rush 8–10am |
| Dr. Mansour | Dermatology | 25–35 | Even distribution, longer consults |
| Dr. Trabelsi | Gynecology | 15–20 | Appointment-heavy, fewer walk-ins |

### Realistic Behaviors

**Doctor:**
- Sometimes arrives late (configurable probability)
- Takes lunch breaks
- Calls patients at realistic intervals based on specialty
- Consultation times follow a bell curve distribution

**Patients:**
- Arrive in realistic clusters (morning rush, lunch lull, afternoon steady)
- Periodically check their queue status (like refreshing the status page)
- Some leave the queue when wait is too long (~5–10%)
- Some are no-shows (~5–10%)

### What Gets Measured

- Patient wait times (avg, median, max)
- API response times per endpoint
- Error rates and failure patterns
- Socket.io event delivery (did real-time updates arrive?)
- Queue throughput (patients per hour)
- Patient drop-off rates
- End-of-day queue clearance

## Reports

Reports are saved to `reports/` as timestamped Markdown files:

```
reports/
├── sim-report-2026-02-19_14-30-00.md
├── sim-report-2026-02-20_09-15-00.md
└── ...
```

Each report includes:
- Executive summary across all clinics
- Per-clinic patient flow metrics
- API performance breakdown by endpoint
- Socket.io event tracking
- Queue timeline (snapshots every 15 sim-minutes)
- Automated observations and warnings

## Configuration

Edit `config/clinics.json` to:

- **Change API URLs** — `apiBaseUrl` and `socketUrl`
- **Adjust patient volumes** — `dailyPatients.min/max` per clinic
- **Tune arrival patterns** — `rushHours` weights control distribution
- **Modify doctor behavior** — consultation times, late probability
- **Set drop-off rates** — `patientLeaveRate`, `patientNoShowRate`

## Adapting API Endpoints

The simulator calls these endpoints (defined in `src/api-client.ts`):

| Action | Method | Endpoint |
|--------|--------|----------|
| Doctor login | POST | `/api/auth/login` |
| Set presence | POST | `/api/clinic/doctor-presence` |
| Patient check-in | POST | `/api/queue/check-in` |
| Call next | POST | `/api/queue/next` |
| Complete patient | POST | `/api/queue/complete/:id` |
| Get queue | GET | `/api/queue` |
| Patient status | GET | `/api/queue/patient/:id` |
| Leave queue | POST | `/api/queue/leave/:id` |
| Socket join | emit | `join:clinic` |

**If your API paths differ**, update them in `src/api-client.ts`. The file is organized with clear method names so each endpoint is easy to find and modify.

## Setup Checklist

- [ ] `npm install` completed
- [ ] API base URL configured (config or CLI)
- [ ] 3 test doctor accounts created on your BleSaf instance
- [ ] Clinic IDs updated in `config/clinics.json`
- [ ] Test with single clinic first: `--clinic 0`
- [ ] Run full simulation with all 3 clinics
- [ ] Review generated report in `reports/`

## Architecture

```
src/
├── index.ts              # CLI entry point, parses args, runs sims
├── engine.ts             # Orchestrates one clinic's full day
├── clock.ts              # Compressed time management (32x)
├── api-client.ts         # All HTTP + Socket.io API calls
├── actors/
│   ├── doctor.ts         # Doctor behavior simulation
│   └── patient.ts        # Patient lifecycle simulation
├── patterns/
│   └── arrival.ts        # Weighted arrival distribution generator
├── metrics/
│   └── collector.ts      # Captures all timing/error/journey data
└── report/
    └── generator.ts      # Markdown report builder
```
