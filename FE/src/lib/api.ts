import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, AuthResponseData } from '@/types/auth';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  normalizeUser,
  setStoredUser,
  setTokens,
} from '@/lib/auth';

const rawEnvUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const normalizedHost = rawEnvUrl.replace(/\/+$/, '');
export const API_BASE_URL = normalizedHost.endsWith('/api/v1')
  ? normalizedHost
  : `${normalizedHost}/api/v1`;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function isPublicAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && !isPublicAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

let refreshPromise: Promise<string> | null = null;

export async function performTokenRefresh(): Promise<string> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('Không tìm thấy refresh token');
  }

  const response = await axios.post<ApiResponse<AuthResponseData>>(
    `${API_BASE_URL}/auth/refresh-token`,
    { refreshToken: currentRefreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const payload = response.data?.data;
  if (!response.data?.success || !payload?.accessToken || !payload?.refreshToken) {
    throw new Error(response.data?.message || 'Làm mới phiên đăng nhập thất bại');
  }

  setTokens(payload.accessToken, payload.refreshToken);
  if (payload.user) {
    const normalized = normalizeUser(payload.user);
    if (!normalized.active) {
      clearAuthStorage();
      throw new Error('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động');
    }
    setStoredUser(normalized);
  }

  return payload.accessToken;
}

/**
 * Quản lý single-flight refresh token: nhiều caller đồng thời
 * (ví dụ 401 interceptor và WebSocket beforeConnect) chỉ gọi performTokenRefresh 1 lần duy nhất.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const responseData = error.response?.data;
    const isLocked =
      error.response?.status === 403 &&
      (responseData?.code === 'USER_LOCKED' ||
        (typeof responseData?.message === 'string' &&
          responseData.message.toLowerCase().includes('khóa')));

    if (isLocked) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=USER_LOCKED';
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError: unknown) {
        clearAuthStorage();
        let isRefreshLocked = false;
        if (axios.isAxiosError<ApiResponse<unknown>>(refreshError)) {
          isRefreshLocked =
            refreshError.response?.status === 403 ||
            refreshError.response?.data?.code === 'USER_LOCKED';
        }
        if (window.location.pathname !== '/login') {
          window.location.href = isRefreshLocked
            ? '/login?error=USER_LOCKED'
            : '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

