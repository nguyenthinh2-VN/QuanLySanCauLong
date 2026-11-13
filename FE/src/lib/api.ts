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
    // Chống nhân đôi tiền tố '/api/v1' nếu caller truyền URL có sẵn tiền tố này
    if (config.url) {
      if (config.url.startsWith('/api/v1/')) {
        config.url = config.url.replace(/^\/api\/v1/, '');
      } else if (config.url.startsWith('api/v1/')) {
        config.url = config.url.replace(/^api\/v1/, '');
      }
    }

    const token = getAccessToken();
    if (token && !isPublicAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh(): Promise<string> {
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
    setStoredUser(normalizeUser(payload.user));
  }

  return payload.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = performTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

