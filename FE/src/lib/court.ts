import api from '@/lib/api';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/types/booking';
import type {
  Complex,
  ComplexDetail,
  ComplexQueryParams,
  Court,
  CourtQueryParams,
  CreateComplexRequest,
  CreateCourtRequest,
  CreateTimeSlotRequest,
  TimeSlot,
  UpdateComplexRequest,
  UpdateCourtRequest,
  UpdateTimeSlotRequest,
} from '@/types/court';
import { formatDateTimeVi, formatVnd } from '@/lib/voucher';

export { formatVnd, formatDateTimeVi };

export const VN_PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export function isValidVnPhone(phone?: string | null): boolean {
  if (!phone || phone.trim() === '') return true; // Tùy chọn nên để trống thì hợp lệ
  return VN_PHONE_REGEX.test(phone.trim());
}

/**
 * Cắt chuỗi giờ trả về dạng HH:mm
 * (Ví dụ: "08:00:00" -> "08:00", "08:00" -> "08:00")
 */
export function formatTimeShort(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
  const trimmed = timeStr.trim();
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
}

// ==========================================
// CỤM SÂN (COMPLEXES)
// ==========================================

export async function getComplexes(
  params?: ComplexQueryParams
): Promise<PageResponse<Complex>> {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q.trim());
  if (params?.status) query.append('status', params.status);
  query.append('page', String(params?.page ?? 0));
  query.append('size', String(params?.size ?? 10));
  query.append('sort', params?.sort ?? 'createdAt,desc');

  const response = await api.get<ApiResponse<PageResponse<Complex>>>(
    `/complexes?${query.toString()}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải danh sách cụm sân');
  }

  return response.data.data;
}

export async function getComplexById(id: number): Promise<ComplexDetail> {
  const response = await api.get<ApiResponse<ComplexDetail>>(`/complexes/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải chi tiết cụm sân');
  }

  return response.data.data;
}

export async function createComplex(
  data: CreateComplexRequest
): Promise<Complex> {
  const payload: CreateComplexRequest = {
    name: data.name.trim(),
    address: data.address.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : undefined,
    status: data.status,
  };

  const response = await api.post<ApiResponse<Complex>>('/complexes', payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Tạo cụm sân mới thất bại');
  }

  return response.data.data;
}

export async function updateComplex(
  id: number,
  data: UpdateComplexRequest
): Promise<Complex> {
  const payload: UpdateComplexRequest = {
    name: data.name.trim(),
    address: data.address.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : '',
    status: data.status,
  };

  const response = await api.put<ApiResponse<Complex>>(`/complexes/${id}`, payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật cụm sân thất bại');
  }

  return response.data.data;
}

export async function deleteComplex(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/complexes/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Xóa cụm sân thất bại');
  }
}

// ==========================================
// SÂN CON (COURTS)
// ==========================================

export async function getCourts(
  params?: CourtQueryParams
): Promise<PageResponse<Court>> {
  const query = new URLSearchParams();
  if (params?.complexId) query.append('complexId', String(params.complexId));
  if (params?.status) query.append('status', params.status);
  if (params?.q) query.append('q', params.q.trim());
  query.append('page', String(params?.page ?? 0));
  query.append('size', String(params?.size ?? 10));
  query.append('sort', params?.sort ?? 'createdAt,desc');

  const response = await api.get<ApiResponse<PageResponse<Court>>>(
    `/courts?${query.toString()}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải danh sách sân con');
  }

  return response.data.data;
}

export async function getCourtById(id: number): Promise<Court> {
  const response = await api.get<ApiResponse<Court>>(`/courts/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải thông tin sân');
  }

  return response.data.data;
}

export async function createCourt(data: CreateCourtRequest): Promise<Court> {
  const payload: CreateCourtRequest = {
    complexId: data.complexId,
    name: data.name.trim(),
    status: data.status,
  };

  const response = await api.post<ApiResponse<Court>>('/courts', payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Tạo sân mới thất bại');
  }

  return response.data.data;
}

/**
 * Cập nhật sân con.
 * Lưu ý quan trọng: BE UpdateCourtRequest KHÔNG có complexId!
 */
export async function updateCourt(
  id: number,
  data: UpdateCourtRequest
): Promise<Court> {
  const payload: UpdateCourtRequest = {
    name: data.name.trim(),
    status: data.status,
  };

  const response = await api.put<ApiResponse<Court>>(`/courts/${id}`, payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật sân thất bại');
  }

  return response.data.data;
}

export async function deleteCourt(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/courts/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Xóa sân thất bại');
  }
}

// ==========================================
// KHUNG GIỜ & BẢNG GIÁ (TIME SLOTS)
// ==========================================

/**
 * Lấy danh sách khung giờ (List thuần không phân trang)
 * Tự sắp xếp startTime tăng dần ở client
 */
export async function getTimeSlots(): Promise<TimeSlot[]> {
  const response = await api.get<ApiResponse<TimeSlot[]>>('/time-slots');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải danh sách khung giờ');
  }

  const items = response.data.data;
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function createTimeSlot(
  data: CreateTimeSlotRequest
): Promise<TimeSlot> {
  const payload: CreateTimeSlotRequest = {
    name: data.name.trim(),
    startTime: data.startTime.trim(),
    endTime: data.endTime.trim(),
    pricePerHour: data.pricePerHour,
  };

  const response = await api.post<ApiResponse<TimeSlot>>('/time-slots', payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Tạo khung giờ mới thất bại');
  }

  return response.data.data;
}

export async function updateTimeSlot(
  id: number,
  data: UpdateTimeSlotRequest
): Promise<TimeSlot> {
  const payload: UpdateTimeSlotRequest = {
    name: data.name.trim(),
    startTime: data.startTime.trim(),
    endTime: data.endTime.trim(),
    pricePerHour: data.pricePerHour,
  };

  const response = await api.put<ApiResponse<TimeSlot>>(`/time-slots/${id}`, payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Cập nhật khung giờ thất bại');
  }

  return response.data.data;
}
