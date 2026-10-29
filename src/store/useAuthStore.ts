// src/store/useAuthStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../api/errors';
import { setOnSessionExpired } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
import { AuthUser, LoginDto, LoginResponse, RegisterDto } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginDto) => Promise<LoginResponse>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<boolean>;
}

const signedOut = { user: null, isAuthenticated: false, isLoading: false, error: null };

export const useAuthStore = create<AuthState>((set, get) => ({
  ...signedOut,

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getRefreshToken(),
      ]);
      if (!accessToken && !refreshToken) {
        set(signedOut);
        return false;
      }

      // Verifies the session; an expired access token is refreshed by the interceptor.
      const user = await authApi.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      // A 401 here means the refresh was rejected too, so the session is gone.
      // Network errors keep the tokens so the next launch can restore the session.
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await tokenStorage.clear();
        set(signedOut);
      } else {
        // Shown on the login screen so the user knows why they were not signed in automatically.
        set({ ...signedOut, error: getApiErrorMessage(error, 'تعذّر التحقق من الجلسة، يرجى تسجيل الدخول.') });
      }
      return false;
    }
  },

  login: async (credentials: LoginDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      return response;
    } catch (err) {
      const message = getApiErrorMessage(err, 'تعذّر تسجيل الدخول');
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (data: RegisterDto) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
    } catch (err) {
      const message = getApiErrorMessage(err, 'تعذّر إنشاء الحساب');
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
    await get().login({ email: data.email, password: data.password });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Failed to clear session tokens:', e);
    }
    set(signedOut);
  },
}));

// Refresh token rejected mid-session: tokens are already cleared, drop the in-memory session
// so the root layout redirects to login.
setOnSessionExpired(() => useAuthStore.setState(signedOut));
