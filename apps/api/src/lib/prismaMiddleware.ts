/**
 * Prisma Tenant Isolation Middleware
 *
 * Defense-in-depth: auto-injects clinicId filter on tenant-scoped models.
 * This is a safety net - services should still explicitly filter by clinicId.
 *
 * Uses AsyncLocalStorage to get the current clinic from the request context.
 * Only applies to read/update/delete operations (not create, which must set clinicId explicitly).
 */

import { Prisma } from '@prisma/client';
import { getCurrentClinicId } from './requestContext.js';

// Models that are scoped to a clinic
const TENANT_SCOPED_MODELS = [
  'QueueEntry',
  'DailyStat',
  'PaymentRecord',
  'SubscriptionEvent',
  'SmsPackagePurchase',
];

// Operations where we inject clinicId filter
const FILTERED_OPERATIONS = [
  'findFirst',
  'findMany',
  'findUnique',
  'findFirstOrThrow',
  'findUniqueOrThrow',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
];

/**
 * Create Prisma query extension that auto-injects clinicId
 */
export function createTenantExtension() {
  return Prisma.defineExtension({
    name: 'tenant-isolation',
    query: {
      $allOperations({ model, operation, args, query }) {
        // Skip if not a tenant-scoped model
        if (!model || !TENANT_SCOPED_MODELS.includes(model)) {
          return query(args);
        }

        // Skip create operations (clinicId must be set explicitly)
        if (!FILTERED_OPERATIONS.includes(operation)) {
          return query(args);
        }

        const clinicId = getCurrentClinicId();

        // If no clinic context (e.g., public routes, admin, scheduler), skip filtering
        if (!clinicId) {
          return query(args);
        }

        // Inject clinicId into the where clause
        if ('where' in args && args.where) {
          args.where = { ...args.where, clinicId };
        } else if ('where' in args) {
          args.where = { clinicId };
        }

        return query(args);
      },
    },
  });
}
