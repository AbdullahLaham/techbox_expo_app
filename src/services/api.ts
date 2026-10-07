// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Access Token from SecureStore
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages from NestJS
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      const nestError = error.response.data;
      const formattedMessage = Array.isArray(nestError.message)
        ? nestError.message.join(', ')
        : nestError.message || 'حدث خطأ في الاتصال بالخادم';
      
      return Promise.reject(new Error(formattedMessage));
    }
    return Promise.reject(new Error('تعذر الاتصال بالخادم، يرجى التأكد من الاتصال بالإنترنت'));
  }
);