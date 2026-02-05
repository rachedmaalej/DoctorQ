/**
 * Request Context using AsyncLocalStorage
 * Stores the current clinicId per request for tenant isolation
 */

import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  clinicId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCurrentClinicId(): string | undefined {
  return requestContext.getStore()?.clinicId;
}
