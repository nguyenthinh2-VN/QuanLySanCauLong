import api from '@/lib/api';
import { normalizeUser } from '@/lib/auth';
import type { ApiResponse, RawUser, User } from '@/types/auth';
import type { PageResponse } from '@/types/booking';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
  UserQueryParams,
} from '@/types/user';

/**
 * Định dạng ngày dd/MM/yyyy cho bảng người dùng
 */
export function formatDateVi(isoString?: string | null): string {
  if (!isoString) return '--/--/----';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

export async function getUsers(
  params?: UserQueryParams
): Promise<PageResponse<User>> {
  const query = new URLSearchParams();

  if (params?.search && params.search.trim() !== '') {
    query.append('search', params.search.trim());
  }

  // BE Spring Enum RoleType bắt buộc gửi đúng ROLE_ADMIN / ROLE_STAFF / ROLE_CUSTOMER
  if (params?.role) {
    const roleParam = params.role.startsWith('ROLE_')
      ? params.role
      : `ROLE_${params.role}`;
    query.append('role', roleParam);
  }

  if (params?.active !== undefined) {
    query.append('active', String(params.active));
  }

  query.append('page', String(params?.page ?? 0));
  query.append('size', String(params?.size ?? 10));
  query.append('sort', params?.sort ?? 'createdAt,desc');

  const response = await api.get<ApiResponse<PageResponse<RawUser>>>(
    `/admin/users?${query.toString()}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải danh sách người dùng');
  }

  const rawPage = response.data.data;
  return {
    ...rawPage,
    items: rawPage.items.map((raw) => normalizeUser(raw)),
  };
}

export async function getUserById(id: number): Promise<User> {
  const response = await api.get<ApiResponse<RawUser>>(`/admin/users/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải thông tin người dùng');
  }

  return normalizeUser(response.data.data);
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await api.post<ApiResponse<RawUser>>('/admin/users', {
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    password: data.password,
    roles: data.roles,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Tạo người dùng mới thất bại');
  }

  return normalizeUser(response.data.data);
}

export async function updateUser(
  id: number,
  data: UpdateUserRequest
): Promise<User> {
  const response = await api.put<ApiResponse<RawUser>>(`/admin/users/${id}`, {
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật thông tin người dùng thất bại');
  }

  return normalizeUser(response.data.data);
}

export async function updateUserRoles(
  id: number,
  data: UpdateUserRolesRequest
): Promise<User> {
  const response = await api.patch<ApiResponse<RawUser>>(
    `/admin/users/${id}/roles`,
    {
      roles: data.roles,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật vai trò người dùng thất bại');
  }

  return normalizeUser(response.data.data);
}

export async function updateUserStatus(
  id: number,
  data: UpdateUserStatusRequest
): Promise<User> {
  const response = await api.patch<ApiResponse<RawUser>>(
    `/admin/users/${id}/status`,
    {
      active: data.active,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật trạng thái người dùng thất bại');
  }

  return normalizeUser(response.data.data);
}

export async function deleteUser(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/admin/users/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Xóa người dùng thất bại');
  }
}
