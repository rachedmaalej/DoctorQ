/**
 * Payment Gateway Interface
 * Abstracts over Konnect (Tunisia) and Stripe (France).
 */

export interface InitPaymentParams {
  amount: number; // in minor currency units (millimes for TND, cents for EUR)
  orderId: string;
  description: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  webhookUrl: string;
  successUrl: string;
  failUrl: string;
  recurring?: {
    interval: 'month' | 'year';
  };
}

export interface InitPaymentResponse {
  payUrl: string;
  paymentRef: string;
}

export interface PaymentDetails {
  payment: {
    id: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
    completedAt?: string;
    failedAt?: string;
  };
}

export interface PaymentGateway {
  initPayment(params: InitPaymentParams): Promise<InitPaymentResponse>;
  getPaymentDetails(paymentRef: string): Promise<PaymentDetails>;
}
