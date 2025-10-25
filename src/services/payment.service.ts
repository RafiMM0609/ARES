// src/services/payment.service.ts
import { apiClient } from './api-client';
import type { Database } from '@/lib/database.types';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export interface PaymentWithRelations extends Payment {
  payer?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  payee?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
    amount: number;
  };
}

export interface PaymentsResponse {
  payments: PaymentWithRelations[];
}

export interface PaymentResponse {
  payment: PaymentWithRelations;
}

export const paymentService = {
  getPayments: async (params?: { status?: string }): Promise<PaymentsResponse> => {
    const query = params?.status ? `?status=${params.status}` : '';
    return apiClient.get<PaymentsResponse>(`/payments${query}`);
  },

  getPayment: async (id: string): Promise<PaymentResponse> => {
    return apiClient.get<PaymentResponse>(`/payments/${id}`);
  },

  createPayment: async (data: PaymentInsert): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>('/payments', data);
  },

  updatePayment: async (id: string, data: PaymentUpdate): Promise<PaymentResponse> => {
    return apiClient.put<PaymentResponse>(`/payments/${id}`, data);
  },
};
