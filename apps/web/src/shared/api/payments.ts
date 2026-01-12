import { apiFetch } from './http';

export interface PaymentInitResponse {
  payment_url: string;
  order_id: string;
}

/**
 * Инициализировать платеж в Т-Банке
 */
export async function initiatePayment(period: 'month' | 'quarter' | 'year'): Promise<PaymentInitResponse> {
  return apiFetch<PaymentInitResponse>('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
}

