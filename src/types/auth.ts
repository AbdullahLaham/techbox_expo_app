// src/types/auth.ts
import type { GlobalRole } from './api.contract';

// Mirrors the Prisma enums the NestJS guards check (`globalRole` on the JWT and `req.user`).
export type { GlobalRole };
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export const ROLE_LABELS_AR: Record<GlobalRole, string> = {
  SUPER_ADMIN: 'مدير النظام',
  INCUBATOR_MANAGER: 'مدير الحاضنة',
  INSTRUCTOR: 'مدرّب',
  MENTOR: 'موجّه',
  STUDENT: 'رائد أعمال / طالب',
  GUEST: 'ضيف',
};

// Registered user in response
export interface AuthUser {
  id: string;
  email: string;
  globalRole: GlobalRole;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  status?: UserStatus;
}

// 1. Register DTO & Response
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

// 2. Login DTO & Response
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// 3. POST /auth/refresh - the refresh token is rotated on every call
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// 4. Get Current User Response
export type UserProfileResponse = AuthUser;

// 5. Standard NestJS Error Format
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
