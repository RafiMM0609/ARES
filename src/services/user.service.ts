// src/services/user.service.ts
import { apiClient } from './api-client';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Skill = Database['public']['Tables']['skills']['Row'];

export interface ProfileResponse {
  profile: Profile;
}

export interface SkillsResponse {
  skills: Skill[];
}

export const userService = {
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/users/profile');
  },

  updateProfile: async (data: ProfileUpdate): Promise<ProfileResponse> => {
    return apiClient.put<ProfileResponse>('/users/profile', data);
  },

  getSkills: async (): Promise<SkillsResponse> => {
    return apiClient.get<SkillsResponse>('/users/skills');
  },

  createSkill: async (data: { name: string; category?: string }): Promise<{ skill: Skill }> => {
    return apiClient.post<{ skill: Skill }>('/users/skills', data);
  },
};
