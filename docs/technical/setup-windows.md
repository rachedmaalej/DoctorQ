# Windows Setup Guide for DoctorQ

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and remember the password you set for the `postgres` user
3. Make sure to install pgAdmin (included in the installer)

**OR** use Docker (easier):

```powershell
# Install Docker Desktop first: https://www.docker.com/products/docker-desktop/

# Then run PostgreSQL in Docker:
docker run --name doctorq-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=doctorq -p 5432:5432 -d postgres:15
```

## Step 2: Update Database Connection

The `.env` file has been created at `apps/api/.env` with default settings:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/doctorq?schema=public"
```

**If your PostgreSQL password is different**, edit `apps/api/.env` and change:
- `postgres:postgres` → `postgres:YOUR_PASSWORD`

## Step 3: Create Database (if not using Docker)

If you installed PostgreSQL directly (not Docker):

1. Open **pgAdmin** or **SQL Shell (psql)**
2. Connect to your PostgreSQL server
3. Run this command:
   ```sql
   CREATE DATABASE doctorq;
   ```

If using Docker, the database is already created!

## Step 4: Initialize Database

Run these commands from the project root:

```powershell
# Push the Prisma schema to create tables
pnpm db:push

# Seed the database with test data
pnpm db:seed
```

## Step 5: Start Development

```powershell
# Start both frontend and backend
pnpm dev

# Or start them separately:
pnpm dev:api   # Backend on http://localhost:3001
pnpm dev:web   # Frontend on http://localhost:5173
```

## Test Login

Navigate to http://localhost:5173 and login with:
- **Email:** dr.ahmed@example.tn
- **Password:** password123

## Troubleshooting

### Error: "pnpm: command not found"
Install pnpm globally:
```powershell
npm install -g pnpm
```

### Error: "connection refused" or "ECONNREFUSED"
PostgreSQL is not running.

**If using Docker:**
```powershell
docker start doctorq-postgres
```

**If using installed PostgreSQL:**
- Open Services (Win + R, type `services.msc`)
- Find "postgresql-x64-15" and start it

### Error: "password authentication failed"
Your PostgreSQL password is different. Update `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/doctorq?schema=public"
```

### Port 5432 already in use
Another PostgreSQL instance is running. Either:
1. Use that instance and create a `doctorq` database in it
2. Stop the other instance
3. Change the port in DATABASE_URL to 5433 or another available port
