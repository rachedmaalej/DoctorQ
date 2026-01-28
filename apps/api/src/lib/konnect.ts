/**
 * Konnect Payment Gateway Integration
 * https://docs.konnect.network
 *
 * Konnect is a Tunisian payment gateway supporting bank cards, e-DINAR, and wallet payments.
 * Amount is always in millimes (1 TND = 1000 millimes).
 */

const KONNECT_API_URL = 'https://api.konnect.network/api/v2';

interface InitPaymentParams {
  amount: number; // in millimes
  orderId: string;
  description: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  webhookUrl: string;
  successUrl: string;
  failUrl: string;
}

interface InitPaymentResponse {
  payUrl: string;
  paymentRef: string;
}

interface PaymentDetails {
  payment: {
    id: string;
    amount: number;
    status: string; // "completed", "pending", "failed"
    createdAt: string;
    completedAt?: string;
    failedAt?: string;
  };
}

export async function initPayment(params: InitPaymentParams): Promise<InitPaymentResponse> {
  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_WALLET_ID;

  if (!apiKey || !walletId) {
    throw new Error('KONNECT_API_KEY and KONNECT_WALLET_ID must be set');
  }

  const response = await fetch(`${KONNECT_API_URL}/payments/init-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      receiverWalletId: walletId,
      token: 'TND',
      amount: params.amount,
      type: 'immediate',
      description: params.description,
      acceptedPaymentMethods: ['bank_card', 'e-DINAR', 'wallet'],
      lifespan: 60, // 60 minutes to complete payment
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phoneNumber: params.phone,
      orderId: params.orderId,
      webhook: params.webhookUrl,
      silentWebhook: true,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Konnect] Init payment failed:', error);
    throw new Error(`Konnect payment init failed: ${response.status}`);
  }

  return response.json() as Promise<InitPaymentResponse>;
}

export async function getPaymentDetails(paymentRef: string): Promise<PaymentDetails> {
  const apiKey = process.env.KONNECT_API_KEY;
  if (!apiKey) {
    throw new Error('KONNECT_API_KEY must be set');
  }

  const response = await fetch(`${KONNECT_API_URL}/payments/${paymentRef}`, {
    headers: {
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Konnect get payment failed: ${response.status}`);
  }

  return response.json() as Promise<PaymentDetails>;
}
