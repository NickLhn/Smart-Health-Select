import request from './request';

export interface CreateStripeCheckoutSessionDTO {
  orderIds: string[];
}

export interface StripeCheckoutSession {
  batchNo: string;
  sessionId: string;
  url: string;
}

export interface StripeSessionStatus {
  sessionId: string;
  batchNo: string;
  status: number;
  providerStatus?: string;
  paymentStatus: 'pending' | 'paid' | 'canceled' | 'expired' | 'failed';
  amount: number;
  currency: string;
  orderIds: string[];
}

export const createStripeCheckoutSession = (data: CreateStripeCheckoutSessionDTO) => {
  return request.post<StripeCheckoutSession>('/payments/stripe/checkout-session', data);
};

export const getStripeSessionStatus = (sessionId: string) => {
  return request.get<StripeSessionStatus>(`/payments/stripe/session/${sessionId}`);
};
