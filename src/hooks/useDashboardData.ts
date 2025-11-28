'use client';

import { useState, useEffect, useCallback } from 'react';
import { projectService, invoiceService, paymentService } from '@/services';
import type { ProjectWithRelations, InvoiceWithRelations, PaymentWithRelations } from '@/services';

interface DashboardData {
  projects: ProjectWithRelations[];
  invoices: InvoiceWithRelations[];
  payments: PaymentWithRelations[];
}

interface UseDashboardDataReturn {
  data: DashboardData;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData>({
    projects: [],
    invoices: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [projectsData, invoicesData, paymentsData] = await Promise.all([
        projectService.getProjects({ type: 'my_projects' }),
        invoiceService.getInvoices(),
        paymentService.getPayments(),
      ]);
      
      setData({
        projects: projectsData.projects,
        invoices: invoicesData.invoices,
        payments: paymentsData.payments,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
