'use client';

import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

interface UseProfileReturn {
  profile: Omit<User, 'password_hash'> | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserUpdate>) => Promise<void>;
  saving: boolean;
  saveError: string;
  saveSuccess: string;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Omit<User, 'password_hash'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const { profile: profileData } = await userService.getProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserUpdate>) => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');
      
      await userService.updateProfile(data);
      setSaveSuccess('Profile updated successfully!');
      
      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    saving,
    saveError,
    saveSuccess,
  };
}
