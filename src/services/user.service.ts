// src/services/user.service.ts
import { apiClient } from './api-client';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
type Skill = Database['public']['Tables']['skills']['Row'];

export interface ProfileResponse {
  profile: Omit<User, 'password_hash'>;
}

export interface SkillsResponse {
  skills: Skill[];
}

export const userService = {
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/users/profile');
  },

  updateProfile: async (data: Partial<UserUpdate>): Promise<ProfileResponse> => {
    return apiClient.put<ProfileResponse>('/users/profile', data);
  },

  getSkills: async (): Promise<SkillsResponse> => {
    return apiClient.get<SkillsResponse>('/users/skills');
  },

  createSkill: async (data: { name: string; category?: string }): Promise<{ skill: Skill }> => {
    return apiClient.post<{ skill: Skill }>('/users/skills', data);
  },
};
