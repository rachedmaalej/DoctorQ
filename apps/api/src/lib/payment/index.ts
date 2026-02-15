/**
 * Payment Gateway Factory
 * Returns the correct payment gateway based on brand configuration.
 */

import { brand } from '../brand.js';
import { KonnectGateway } from './konnect.js';
import { StripeGateway } from './stripe.js';
import type { PaymentGateway } from './types.js';

export type { PaymentGateway, InitPaymentParams, InitPaymentResponse, PaymentDetails } from './types.js';

let gateway: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!gateway) {
    gateway = brand.payment.provider === 'stripe'
      ? new StripeGateway()
      : new KonnectGateway();
  }
  return gateway;
}

// Convenience re-exports matching the old konnect.ts API
export async function initPayment(params: import('./types.js').InitPaymentParams) {
  return getPaymentGateway().initPayment(params);
}

export async function getPaymentDetails(paymentRef: string) {
  return getPaymentGateway().getPaymentDetails(paymentRef);
}
