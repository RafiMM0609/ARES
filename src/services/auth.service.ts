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

export interface WalletNonceResponse {
  message: string;
  nonce: string;
}

export interface WalletLoginData {
  address: string;
  signature: string;
  message: string;
  user_type?: 'client' | 'freelancer' | 'both';
}

export interface WalletAuthResponse {
  message: string;
  isNewUser: boolean;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    user_type: string;
    avatar_url: string | null;
    wallet_address: string | null;
  };
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

  // Wallet SSO methods
  getWalletNonce: async (address: string): Promise<WalletNonceResponse> => {
    return apiClient.get<WalletNonceResponse>(`/auth/wallet?address=${encodeURIComponent(address)}`);
  },

  walletLogin: async (data: WalletLoginData): Promise<WalletAuthResponse> => {
    return apiClient.post<WalletAuthResponse>('/auth/wallet', data);
  },
};
