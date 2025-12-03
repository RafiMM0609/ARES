// src/services/invoice.service.ts
import { apiClient } from './api-client';
import type { Database } from '@/lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

export interface InvoiceWithRelations extends Invoice {
  client?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  freelancer?: {
    id: string;
    full_name: string | null;
    email: string;
    wallet_address?: string | null;
  };
  project?: {
    id: string;
    title: string;
  };
  items?: InvoiceItem[];
}

export interface InvoicesResponse {
  invoices: InvoiceWithRelations[];
}

export interface InvoiceResponse {
  invoice: InvoiceWithRelations;
}

export interface CreateInvoiceData extends Omit<InvoiceInsert, 'invoice_number' | 'freelancer_id' | 'id' | 'created_at' | 'updated_at'> {
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const invoiceService = {
  getInvoices: async (params?: { status?: string }): Promise<InvoicesResponse> => {
    const query = params?.status ? `?status=${params.status}` : '';
    return apiClient.get<InvoicesResponse>(`/invoices${query}`);
  },

  getInvoice: async (id: string): Promise<InvoiceResponse> => {
    return apiClient.get<InvoiceResponse>(`/invoices/${id}`);
  },

  createInvoice: async (data: CreateInvoiceData): Promise<InvoiceResponse> => {
    return apiClient.post<InvoiceResponse>('/invoices', data);
  },

  updateInvoice: async (id: string, data: InvoiceUpdate): Promise<InvoiceResponse> => {
    return apiClient.put<InvoiceResponse>(`/invoices/${id}`, data);
  },

  deleteInvoice: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/invoices/${id}`);
  },
};
