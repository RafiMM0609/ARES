'use client';

import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services';
import type { ProjectWithRelations } from '@/services';

interface UseAvailableProjectsReturn {
  projects: ProjectWithRelations[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function useAvailableProjects(): UseAvailableProjectsReturn {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const { projects } = await projectService.getProjects({ 
        type: 'available', 
        status: 'open' 
      });
      
      setProjects(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}
