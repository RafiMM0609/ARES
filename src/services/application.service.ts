// src/services/application.service.ts
import { apiClient } from './api-client';

export interface ApplicationWithRelations {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    description: string | null;
    budget_amount: number | null;
    budget_currency: string;
    status: string;
    deadline: string | null;
    client?: {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  };
  freelancer?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export interface ApplicationsResponse {
  applications: ApplicationWithRelations[];
}

export interface ApplicationResponse {
  application: ApplicationWithRelations;
  message?: string;
}

export interface CreateApplicationData {
  project_id: string;
  cover_letter?: string;
  proposed_rate?: number;
}

export interface UpdateApplicationData {
  status?: 'accepted' | 'rejected' | 'withdrawn';
  cover_letter?: string;
  proposed_rate?: number;
}

export const applicationService = {
  getApplications: async (params?: { 
    project_id?: string; 
    status?: string;
    view_type?: 'client' | 'freelancer';
  }): Promise<ApplicationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.project_id) queryParams.append('project_id', params.project_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.view_type) queryParams.append('view_type', params.view_type);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<ApplicationsResponse>(`/applications${query}`);
  },

  getApplication: async (id: string): Promise<ApplicationResponse> => {
    return apiClient.get<ApplicationResponse>(`/applications/${id}`);
  },

  createApplication: async (data: CreateApplicationData): Promise<ApplicationResponse> => {
    return apiClient.post<ApplicationResponse>('/applications', data);
  },

  updateApplication: async (id: string, data: UpdateApplicationData): Promise<ApplicationResponse> => {
    return apiClient.put<ApplicationResponse>(`/applications/${id}`, data);
  },

  deleteApplication: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/applications/${id}`);
  },
};
