'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

export interface TopCategory {
  name: string;
  count: number;
}

interface UseTopCategoriesReturn {
  categories: TopCategory[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

interface TopCategoriesResponse {
  categories: TopCategory[];
}

export function useTopCategories(): UseTopCategoriesReturn {
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiClient.get<TopCategoriesResponse>('/categories/top');
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
