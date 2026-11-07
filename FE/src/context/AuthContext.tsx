import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/lib/api';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  normalizeUser,
  setStoredUser,
  setTokens,
} from '@/lib/auth';
import type {
  ApiResponse,
  AuthResponseData,
  RawUser,
  User,
} from '@/types/auth';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAccessToken()));

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get<ApiResponse<RawUser>>('/auth/me');
      if (response.data.success && response.data.data) {
        const normalized = normalizeUser(response.data.data);
        setStoredUser(normalized);
        setUser(normalized);
        return normalized;
      }
      throw new Error(response.data.message || 'Không lấy được thông tin tài khoản');
    } catch {
      const fallbackUser = getStoredUser();
      if (fallbackUser && getAccessToken()) {
        setUser(fallbackUser);
        return fallbackUser;
      }
      clearAuthStorage();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      void refreshUser();
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const response = await api.post<ApiResponse<AuthResponseData>>(
        '/auth/login',
        {
          email: email.trim(),
          password,
        }
      );

      const result = response.data;
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Đăng nhập thất bại');
      }

      const { accessToken, refreshToken, user: rawUser } = result.data;
      setTokens(accessToken, refreshToken);

      if (rawUser) {
        const normalized = normalizeUser(rawUser);
        setStoredUser(normalized);
        setUser(normalized);
        return normalized;
      }

      const fetched = await refreshUser();
      if (!fetched) {
        throw new Error('Không thể tải thông tin người dùng sau khi đăng nhập');
      }
      return fetched;
    },
    [refreshUser]
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Bỏ qua lỗi mạng khi logout, vẫn xóa sạch trạng thái phía client
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

