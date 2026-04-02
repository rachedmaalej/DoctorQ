/**
 * Stripe Payment Gateway Adapter (France)
 * Uses Stripe Checkout Sessions.
 * Amounts in cents (1 EUR = 100 cents).
 */

import { logger } from '../logger.js';
import type { PaymentGateway, InitPaymentParams, InitPaymentResponse, PaymentDetails } from './types.js';

export class StripeGateway implements PaymentGateway {
  private async getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY must be set');
    }
    // Dynamic import to avoid requiring stripe in Tunisia deployments
    const { default: Stripe } = await import('stripe');
    return new Stripe(key);
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResponse> {
    const stripe = await this.getStripe();

    const isRecurring = !!params.recurring;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
            ...(isRecurring && {
              recurring: {
                interval: params.recurring!.interval,
              },
            }),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: params.orderId,
      },
      customer_email: params.email,
      success_url: params.successUrl,
      cancel_url: params.failUrl,
    });

    if (!session.url) {
      throw new Error('Stripe session created without URL');
    }

    return {
      payUrl: session.url,
      paymentRef: session.id,
    };
  }

  async getPaymentDetails(paymentRef: string): Promise<PaymentDetails> {
    const stripe = await this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(paymentRef);

    const statusMap: Record<string, 'completed' | 'pending' | 'failed'> = {
      complete: 'completed',
      open: 'pending',
      expired: 'failed',
    };

    return {
      payment: {
        id: session.id,
        amount: session.amount_total || 0,
        status: statusMap[session.status || 'open'] || 'pending',
        createdAt: new Date((session.created || 0) * 1000).toISOString(),
        completedAt: session.status === 'complete'
          ? new Date().toISOString()
          : undefined,
      },
    };
  }
}
