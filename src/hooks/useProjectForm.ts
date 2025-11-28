'use client';

import { useState, useCallback } from 'react';
import { projectService } from '@/services';

interface ProjectFormData {
  title: string;
  description: string;
  budget_amount: string;
  budget_currency: string;
  deadline: string;
}

interface UseProjectFormReturn {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  loading: boolean;
  error: string;
  submitProject: () => Promise<boolean>;
  resetForm: () => void;
}

const initialFormData: ProjectFormData = {
  title: '',
  description: '',
  budget_amount: '',
  budget_currency: 'USD',
  deadline: '',
};

export function useProjectForm(): UseProjectFormReturn {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitProject = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError('');
      
      await projectService.createProject({
        title: formData.title,
        description: formData.description,
        budget_amount: parseFloat(formData.budget_amount),
        budget_currency: formData.budget_currency,
        deadline: formData.deadline ? formData.deadline : undefined,
        status: 'open',
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
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
    submitProject,
    resetForm,
  };
}
