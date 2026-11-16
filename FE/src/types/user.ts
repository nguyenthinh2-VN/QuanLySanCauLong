import type { Role, User } from '@/types/auth';

export type { Role, User };

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roles: string[];
}

export interface UpdateUserRequest {
  fullName: string;
  phone: string;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface UserQueryParams {
  search?: string;
  role?: Role;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
