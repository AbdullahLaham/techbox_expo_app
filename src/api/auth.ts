// src/api/auth.ts
import { apiClient } from '../services/api';
import {
  RegisterDto,
  RegisterResponse,
  LoginDto,
  LoginResponse,
  UserProfileResponse,
} from '../types/auth';

export const authApi = {
  // POST /auth/register
  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  // POST /auth/login
  login: async (data: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  // GET /auth/me
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/auth/me');
    return response.data;
  },
};