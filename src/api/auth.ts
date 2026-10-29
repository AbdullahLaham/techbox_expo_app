// src/api/auth.ts
import { apiClient } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
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

  // POST /auth/login - persists both tokens before resolving
  login: async (data: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  // GET /auth/me - token attached (and refreshed if expired) by the Axios interceptors
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/auth/me');
    return response.data;
  },

  // POST /auth/logout - local tokens are cleared first so logout never waits on the network
  logout: async (): Promise<void> => {
    const refreshToken = await tokenStorage.getRefreshToken();
    await tokenStorage.clear();
    if (refreshToken) {
      apiClient.post('/auth/logout', { refreshToken }).catch(() => {
        // Best effort: the server session expires on its own if revocation fails.
      });
    }
  },
};
