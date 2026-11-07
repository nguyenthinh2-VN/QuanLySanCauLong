export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  data: T;
  errors?: Record<string, string> | null;
  timestamp?: string;
}

export interface RawUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  active?: boolean;
  roles: string[];
  createdAt?: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  roles: Role[];
  createdAt?: string;
}

export interface AuthResponseData {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: RawUser;
}

export interface RegisterRequestPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

