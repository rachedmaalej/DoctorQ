/**
 * Prisma Client Configuration
 * - Singleton pattern to prevent multiple instances in development
 * - Connection pool configuration for optimal performance
 * - Logging configuration based on environment
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma client with optimized configuration
 *
 * Note: When using Supabase with pgbouncer (pooler URL), connection pooling
 * is managed externally. The DATABASE_URL should point to the pooler for production.
 */
function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production';

  return new PrismaClient({
    log: isProduction ? ['error'] : ['error', 'warn'],
  });
}

// Use singleton in development, new instance in production (for serverless)
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed when the app shuts down
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// Handle process termination gracefully
process.on('beforeExit', async () => {
  await disconnectPrisma();
});
