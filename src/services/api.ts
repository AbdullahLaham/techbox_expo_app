// src/services/api.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshResponse } from '../types/auth';
import { tokenStorage } from './tokenStorage';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000').replace(/\/$/, '');
const BASE_URL = API_BASE_URL;

const clientConfig = {
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
};

export const apiClient = axios.create(clientConfig);

// No interceptors, so a failing refresh can never trigger another refresh.
const refreshClient = axios.create(clientConfig);

// Credential endpoints answer 401 for bad input, not for an expired access token.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let onSessionExpired: (() => void) | null = null;

/** Called once the refresh token is rejected; the auth store uses it to drop the session. */
export function setOnSessionExpired(handler: () => void) {
  onSessionExpired = handler;
}

let refreshInFlight: Promise<string> | null = null;

async function expireSession() {
  await tokenStorage.clear();
  onSessionExpired?.();
}

/**
 * Exchange the refresh token for a new pair. The backend rotates refresh tokens (each one
 * works once), so concurrent 401s must share a single refresh call.
 * If the server rejects the refresh token the session ends; on network or server errors the
 * tokens are kept so a later attempt can still succeed.
 */
function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await expireSession();
      throw new Error('No refresh token');
    }
    try {
      const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401) await expireSession();
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// Request Interceptor: Attach bearer token dynamically
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await tokenStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.error('Error reading token from SecureStore:', error);
  }
  return config;
});

// Response Interceptor: on 401, refresh once and replay the request
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const skip =
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path));
    if (skip) return Promise.reject(error);

    config._retried = true;
    try {
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(config);
    } catch {
      // Surface the original 401 so callers keep NestJS's error body for messages.
      return Promise.reject(error);
    }
  },
);
