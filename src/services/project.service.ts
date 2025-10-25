// src/services/project.service.ts
import { apiClient } from './api-client';
import type { Database } from '@/lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export interface ProjectWithRelations extends Project {
  client?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  freelancer?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface ProjectsResponse {
  projects: ProjectWithRelations[];
}

export interface ProjectResponse {
  project: ProjectWithRelations;
}

export const projectService = {
  getProjects: async (params?: { status?: string; type?: string }): Promise<ProjectsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<ProjectsResponse>(`/projects${query}`);
  },

  getProject: async (id: string): Promise<ProjectResponse> => {
    return apiClient.get<ProjectResponse>(`/projects/${id}`);
  },

  createProject: async (data: ProjectInsert): Promise<ProjectResponse> => {
    return apiClient.post<ProjectResponse>('/projects', data);
  },

  updateProject: async (id: string, data: ProjectUpdate): Promise<ProjectResponse> => {
    return apiClient.put<ProjectResponse>(`/projects/${id}`, data);
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/projects/${id}`);
  },
};
