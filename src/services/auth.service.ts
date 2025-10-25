// src/services/auth.service.ts
import { apiClient } from './api-client';

export interface SignupData {
  email: string;
  password: string;
  full_name?: string;
  user_type?: 'client' | 'freelancer' | 'both';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    email: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
}

export interface SessionResponse {
  session: {
    access_token: string;
    user: {
      id: string;
      email: string;
    };
  } | null;
}

export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/signup', data);
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  getSession: async (): Promise<SessionResponse> => {
    return apiClient.get<SessionResponse>('/auth/session');
  },
};
