import axios from 'axios';
import type { ApiResponse, RawUser, Role, User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_STORAGE_KEY = 'authUser';

const VALID_ROLES: Role[] = ['ADMIN', 'STAFF', 'CUSTOMER'];

export function normalizeRole(rawRole: string): Role | null {
  const cleaned = rawRole.trim().toUpperCase().replace(/^ROLE_/, '');
  if (VALID_ROLES.includes(cleaned as Role)) {
    return cleaned as Role;
  }
  return null;
}

export function normalizeRoles(rawRoles: string[] | undefined | null): Role[] {
  if (!Array.isArray(rawRoles)) {
    return ['CUSTOMER'];
  }
  const normalized = rawRoles
    .map(normalizeRole)
    .filter((role): role is Role => role !== null);

  return normalized.length > 0 ? normalized : ['CUSTOMER'];
}

export function normalizeUser(raw: RawUser): User {
  return {
    id: raw.id,
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone,
    active: raw.active ?? true,
    roles: normalizeRoles(raw.roles),
    createdAt: raw.createdAt,
  };
}

export function getPrimaryRole(roles: Role[]): Role {
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('STAFF')) return 'STAFF';
  return 'CUSTOMER';
}

export function getAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ??
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getRefreshToken(): string | null {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ??
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

function resolveTargetStorage(rememberMe?: boolean): Storage {
  if (typeof rememberMe === 'boolean') {
    return rememberMe ? localStorage : sessionStorage;
  }
  const hasSessionToken =
    sessionStorage.getItem(REFRESH_TOKEN_KEY) !== null ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  const hasLocalToken =
    localStorage.getItem(REFRESH_TOKEN_KEY) !== null ||
    localStorage.getItem(ACCESS_TOKEN_KEY) !== null;

  if (hasSessionToken && !hasLocalToken) {
    return sessionStorage;
  }
  return localStorage;
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  rememberMe?: boolean
): void {
  const target = resolveTargetStorage(rememberMe);
  const other = target === localStorage ? sessionStorage : localStorage;

  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);

  target.setItem(ACCESS_TOKEN_KEY, accessToken);
  target.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoredUser(): User | null {
  const raw =
    localStorage.getItem(USER_STORAGE_KEY) ??
    sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RawUser;
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User, rememberMe?: boolean): void {
  const target = resolveTargetStorage(rememberMe);
  const other = target === localStorage ? sessionStorage : localStorage;

  other.removeItem(USER_STORAGE_KEY);
  target.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function clearAuthStorage(): void {
  clearTokens();
}

export function getInitials(fullName: string | undefined): string {
  if (!fullName || !fullName.trim()) return 'ND';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function extractErrorMessage(
  error: unknown,
  fallback = 'Đã xảy ra lỗi, vui lòng thử lại sau'
): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const responseData = error.response?.data;
    if (responseData) {
      if (
        responseData.errors &&
        typeof responseData.errors === 'object' &&
        Object.keys(responseData.errors).length > 0
      ) {
        const firstFieldError = Object.values(responseData.errors)[0];
        if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
          return firstFieldError;
        }
      }
      if (responseData.message && responseData.message.trim()) {
        return responseData.message;
      }
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra kết nối mạng.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

