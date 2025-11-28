'use client';

import { useState, useCallback } from 'react';
import { invoiceService } from '@/services';
import type { ProjectWithRelations } from '@/services';

interface InvoiceFormData {
  project_id: string;
  amount: string;
  currency: string;
  due_date: string;
  description: string;
  item_description: string;
  item_quantity: string;
  item_unit_price: string;
}

interface UseInvoiceFormReturn {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  loading: boolean;
  error: string;
  submitInvoice: (projects: ProjectWithRelations[]) => Promise<boolean>;
  resetForm: () => void;
}

const initialFormData: InvoiceFormData = {
  project_id: '',
  amount: '',
  currency: 'USD',
  due_date: '',
  description: '',
  item_description: '',
  item_quantity: '1',
  item_unit_price: '',
};

export function useInvoiceForm(): UseInvoiceFormReturn {
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitInvoice = useCallback(async (projects: ProjectWithRelations[]): Promise<boolean> => {
    try {
      setLoading(true);
      setError('');
      
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (!selectedProject) {
        throw new Error('Please select a project');
      }

      await invoiceService.createInvoice({
        project_id: formData.project_id,
        client_id: selectedProject.client_id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        due_date: formData.due_date,
        description: formData.description,
        items: [
          {
            description: formData.item_description,
            quantity: parseFloat(formData.item_quantity),
            unit_price: parseFloat(formData.item_unit_price),
          }
        ]
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setError('');
  }, []);

  return {
    formData,
    setFormData,
    loading,
    error,
    submitInvoice,
    resetForm,
  };
}
