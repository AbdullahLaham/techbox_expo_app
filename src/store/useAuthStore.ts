// // src/store/useAuthStore.ts
// import { create } from 'zustand';
// import * as SecureStore from 'expo-secure-store';
// import { authApi } from '../api/auth';
// import { AuthUser, LoginDto, RegisterDto } from '../types/auth';

// interface AuthState {
//   user: AuthUser | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;

//   // Actions
//   login: (data: LoginDto) => Promise<any>;
//   register: (data: RegisterDto) => Promise<void>;
//   fetchProfile: () => Promise<void>;
//   logout: () => Promise<void>;
//   clearError: () => void;
//   loadStoredAuth: () => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set, get) => ({
//   user: null,
//   token: null,
//   isAuthenticated: false,
//   isLoading: false,
//   error: null,

//   clearError: () => set({ error: null }),

//   // Load auth state from SecureStore when app starts
//   loadStoredAuth: async () => {
//     try {
//       set({ isLoading: true });
//       const token = await SecureStore.getItemAsync('accessToken');
//       if (token) {
//         set({ token, isAuthenticated: true });
//         // Hydrate user profile from backend
//         await get().fetchProfile();
//       }
//     } catch (e) {
//       await SecureStore.deleteItemAsync('accessToken');
//       set({ token: null, user: null, isAuthenticated: false });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   // Login Action
//   login: async (credentials: LoginDto) => {
//     set({ isLoading: true, error: null });
//     try {
//       const response = await authApi.login(credentials);
//       await SecureStore.setItemAsync('accessToken', response.accessToken);
      
//       set({
//         token: response.accessToken,
//         user: response.user,
//         isAuthenticated: true,
//         isLoading: false,
//       });

//       return response;


//     } catch (err: any) {
//       set({ error: err.message, isLoading: false });
//       throw err;
//     }
//   },

//   // Register Action
//   register: async (data: RegisterDto) => {
//     set({ isLoading: true, error: null });
//     try {
//       await authApi.register(data);
//       // Automatically log in user after successful registration
//       await get().login({ email: data.email, password: data.password });
//     } catch (err: any) {
//       set({ error: err.message, isLoading: false });
//       throw err;
//     }
//   },

//   // Get Current User Profile (/auth/me)
//   fetchProfile: async () => {
//     try {
//       const userProfile = await authApi.getProfile();
//       set({ user: userProfile });
//     } catch (err: any) {
//       // If fetching profile fails (e.g., 401 token expired), log out
//       await get().logout();
//     }
//   },

//   // Logout Action
//   logout: async () => {
//     await SecureStore.deleteItemAsync('accessToken');
//     set({
//       user: null,
//       token: null,
//       isAuthenticated: false,
//       error: null,
//     });
//   },
// }));


// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { AuthUser, LoginDto, RegisterDto } from '../types/auth';

// 1. إنشاء محول SecureStore متوافق مع Zustand StateStorage
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginDto) => Promise<any>;
  register: (data: RegisterDto) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // Login Action
      login: async (credentials: LoginDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);

          set({
            token: response.accessToken,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return response;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // Register Action
      register: async (data: RegisterDto) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          // التسجيل الدخول التلقائي بعد إنشاء الحساب
          await get().login({ email: data.email, password: data.password });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // Get Current User Profile (/auth/me)
      fetchProfile: async () => {
        try {
          const userProfile = await authApi.getProfile();
          set({ user: userProfile });
        } catch (err: any) {
          // إذا فشل جلب الحساب (مثلاً انقضاء فترة الـ Token)، يتم تسجيل الخروج
          await get().logout();
        }
      },

      // Logout Action
      logout: async () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage', // اسم المفتاح الذي سيتم الحفظ تحته في SecureStore
      storage: createJSONStorage(() => secureStorage),
      // تحديـد الحقول المُراد حفظها فقط (نستثني حالات التحميل والأخطاء)
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);