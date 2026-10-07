// src/types/auth.ts

export type GlobalRole = 'CLIENT' | 'ADMIN' | 'OWNER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

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
  user: AuthUser;
}

// 3. Get Current User Response
export type UserProfileResponse = AuthUser;

// 4. Standard NestJS Error Format
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}