'use client';

import { useState, useEffect, useCallback } from 'react';
import { applicationService } from '@/services';
import type { ApplicationWithRelations } from '@/services';

interface UseApplicationsParams {
  projectId?: string;
  status?: string;
  viewType?: 'client' | 'freelancer';
}

interface UseApplicationsReturn {
  applications: ApplicationWithRelations[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function useApplications(params?: UseApplicationsParams): UseApplicationsReturn {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const { applications } = await applicationService.getApplications({
        project_id: params?.projectId,
        status: params?.status,
        view_type: params?.viewType,
      });
      
      setApplications(applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [params?.projectId, params?.status, params?.viewType]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}
