import api from '@/lib/api';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/types/booking';
import type {
  ActiveVoucherQueryParams,
  ApplyVoucherRequest,
  ApplyVoucherResponse,
  CreateVoucherRequest,
  DiscountType,
  UpdateVoucherRequest,
  Voucher,
  VoucherQueryParams,
} from '@/types/voucher';

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0đ';
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`;
}

export function formatDateTimeVi(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function toDateTimeLocalInput(
  isoString: string | null | undefined
): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function fromDateTimeLocalInput(
  localString: string | null | undefined
): string {
  if (!localString) return '';
  // Convert YYYY-MM-DDTHH:mm to YYYY-MM-DDTHH:mm:00
  if (localString.length === 16) {
    return `${localString}:00`;
  }
  return localString;
}

export function formatVoucherDiscount(
  discountType: DiscountType,
  discountValue: number,
  maxDiscountAmount?: number | null
): string {
  if (discountType === 'PERCENTAGE') {
    const base = `${discountValue}%`;
    if (maxDiscountAmount != null && maxDiscountAmount > 0) {
      return `${base} (tối đa ${formatVnd(maxDiscountAmount)})`;
    }
    return base;
  }
  return formatVnd(discountValue);
}

// ----------------------------------------------------
// Admin Voucher API Calls
// ----------------------------------------------------

export async function getVouchers(
  params?: VoucherQueryParams
): Promise<PageResponse<Voucher>> {
  const cleanParams: Record<string, string | number | boolean> = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
    sort: params?.sort ?? 'createdAt,desc',
  };
  if (params?.keyword?.trim()) {
    cleanParams.keyword = params.keyword.trim();
  }
  if (typeof params?.active === 'boolean') {
    cleanParams.active = params.active;
  }

  const response = await api.get<ApiResponse<PageResponse<Voucher>>>(
    '/vouchers',
    { params: cleanParams }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải danh sách voucher');
  }
  return response.data.data;
}

export async function getVoucherById(id: number): Promise<Voucher> {
  const response = await api.get<ApiResponse<Voucher>>(`/vouchers/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không tìm thấy voucher');
  }
  return response.data.data;
}

export async function createVoucher(
  payload: CreateVoucherRequest
): Promise<Voucher> {
  const response = await api.post<ApiResponse<Voucher>>('/vouchers', payload);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tạo mới voucher');
  }
  return response.data.data;
}

export async function updateVoucher(
  id: number,
  payload: UpdateVoucherRequest
): Promise<Voucher> {
  const response = await api.put<ApiResponse<Voucher>>(
    `/vouchers/${id}`,
    payload
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể cập nhật voucher');
  }
  return response.data.data;
}

export async function toggleVoucherStatus(id: number): Promise<Voucher> {
  const response = await api.patch<ApiResponse<Voucher>>(
    `/vouchers/${id}/status`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể thay đổi trạng thái voucher'
    );
  }
  return response.data.data;
}

export async function deleteVoucher(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/vouchers/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể xóa voucher');
  }
}

// ----------------------------------------------------
// Customer / Public Voucher API Calls
// ----------------------------------------------------

export async function getActiveVouchers(
  params?: ActiveVoucherQueryParams
): Promise<PageResponse<Voucher>> {
  const cleanParams: Record<string, string | number> = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
    sort: params?.sort ?? 'createdAt,desc',
  };

  const response = await api.get<ApiResponse<PageResponse<Voucher>>>(
    '/vouchers/active',
    { params: cleanParams }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải danh sách ưu đãi đang áp dụng'
    );
  }
  return response.data.data;
}

export async function applyVoucher(
  payload: ApplyVoucherRequest
): Promise<ApplyVoucherResponse> {
  const response = await api.post<ApiResponse<ApplyVoucherResponse>>(
    '/vouchers/apply',
    payload
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể áp dụng voucher');
  }
  return response.data.data;
}

