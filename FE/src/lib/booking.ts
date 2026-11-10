import axios from 'axios';
import api from '@/lib/api';
import type { ApiResponse, RawUser, User } from '@/types/auth';
import { normalizeUser } from '@/lib/auth';
import type {
  BookingResponse,
  BookingStatus,
  CourtAvailabilityResponse,
  CreateBookingRequest,
  CreatePosBookingRequest,
  MyBookingsQueryParams,
  PageResponse,
  SlotStatus,
  UpdateBookingRequest,
} from '@/types/booking';

export function formatLocalDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIso(): string {
  return formatLocalDateIso(new Date());
}

export function getMaxBookingDateIso(maxDaysAhead = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + maxDaysAhead);
  return formatLocalDateIso(date);
}

export function shiftDateIso(dateIso: string, deltaDays: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (!y || !m || !d) return getTodayIso();
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return formatLocalDateIso(date);
}

export function formatDateVietnamese(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (!y || !m || !d) return dateIso;
  const date = new Date(y, m - 1, d);
  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const dayName = weekdays[date.getDay()] ?? '';
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${dayName}, ${dd}/${mm}/${y}`;
}

export function formatShortDateVi(dateIso: string): string {
  const [y, m, d] = dateIso.split('-');
  if (!y || !m || !d) return dateIso;
  return `${d}/${m}/${y}`;
}

export function formatTimeShort(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function calculateSlotHours(startTime: string, endTime: string): number {
  const parseMinutes = (t: string): number => {
    const [hh, mm] = t.split(':').map(Number);
    return (hh || 0) * 60 + (mm || 0);
  };
  const diffMinutes = parseMinutes(endTime) - parseMinutes(startTime);
  if (diffMinutes <= 0) return 0;
  return Number((diffMinutes / 60).toFixed(2));
}

export function estimateSlotTotal(
  pricePerHour: number,
  startTime: string,
  endTime: string
): number {
  const hours = calculateSlotHours(startTime, endTime);
  return Math.round(pricePerHour * hours);
}

export function formatCurrencyVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} ₫`;
}

export function getSlotStatusLabel(status: SlotStatus): string {
  switch (status) {
    case 'FREE':
      return 'Còn trống';
    case 'BOOKED':
      return 'Đã đặt';
    case 'PASSED':
      return 'Đã qua giờ';
    case 'UNAVAILABLE':
      return 'Không khả dụng';
  }
}

export function getBookingStatusMeta(status: BookingStatus): {
  label: string;
  badgeVariant: 'amber' | 'sky' | 'indigo' | 'zinc' | 'destructive';
} {
  switch (status) {
    case 'PENDING':
      return { label: 'Chờ thanh toán (PENDING)', badgeVariant: 'amber' };
    case 'CONFIRMED':
      return { label: 'Đã xác nhận (CONFIRMED)', badgeVariant: 'sky' };
    case 'CHECKED_IN':
      return { label: 'Đã nhận sân (CHECKED_IN)', badgeVariant: 'indigo' };
    case 'COMPLETED':
      return { label: 'Hoàn thành (COMPLETED)', badgeVariant: 'zinc' };
    case 'CANCELLED':
      return { label: 'Đã hủy (CANCELLED)', badgeVariant: 'destructive' };
  }
}

export function isBookingActionable(status: BookingStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export function extractErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}

export async function fetchCourtAvailability(params: {
  date: string;
  courtId?: number;
  complexId?: number;
}): Promise<CourtAvailabilityResponse[]> {
  const response = await api.get<ApiResponse<CourtAvailabilityResponse[]>>(
    '/bookings/availability',
    { params }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể tải lịch trống sân');
  }
  return response.data.data ?? [];
}

export async function submitCreateBooking(
  payload: CreateBookingRequest
): Promise<BookingResponse> {
  const response = await api.post<ApiResponse<BookingResponse>>(
    '/bookings',
    payload
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tạo đơn đặt sân');
  }
  return response.data.data;
}

export async function fetchMyBookings(
  params: MyBookingsQueryParams
): Promise<PageResponse<BookingResponse>> {
  const cleanParams: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 10,
    sort: params.sort ?? 'createdAt,desc',
  };
  if (params.status) cleanParams.status = params.status;
  if (params.fromDate) cleanParams.fromDate = params.fromDate;
  if (params.toDate) cleanParams.toDate = params.toDate;

  const response = await api.get<ApiResponse<PageResponse<BookingResponse>>>(
    '/bookings/my',
    { params: cleanParams }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể tải lịch đặt của tôi');
  }
  return response.data.data;
}

export async function submitUpdateBooking(
  bookingId: number,
  payload: UpdateBookingRequest
): Promise<BookingResponse> {
  const response = await api.put<ApiResponse<BookingResponse>>(
    `/bookings/${bookingId}`,
    payload
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể đổi lịch đặt sân');
  }
  return response.data.data;
}

export async function submitCancelBooking(
  bookingId: number
): Promise<BookingResponse> {
  const response = await api.delete<ApiResponse<BookingResponse>>(
    `/bookings/${bookingId}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể hủy lịch đặt sân');
  }
  return response.data.data;
}

export async function createPosBooking(
  payload: CreatePosBookingRequest
): Promise<BookingResponse> {
  const response = await api.post<ApiResponse<BookingResponse>>(
    '/bookings/pos',
    payload
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tạo đơn đặt sân tại quầy'
    );
  }
  return response.data.data;
}

export async function checkInBooking(
  bookingId: number
): Promise<BookingResponse> {
  const response = await api.post<ApiResponse<BookingResponse>>(
    `/bookings/${bookingId}/check-in`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Không thể check-in đơn đặt sân');
  }
  return response.data.data;
}

export async function fetchAdminUserById(userId: number): Promise<User> {
  const response = await api.get<ApiResponse<RawUser>>(
    `/admin/users/${userId}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không tìm thấy thông tin người dùng'
    );
  }
  return normalizeUser(response.data.data);
}

export function formatBookingCustomerSummary(booking: BookingResponse): {
  typeLabel: string;
  primaryText: string;
  secondaryText: string | null;
} {
  if (booking.userId != null) {
    return {
      typeLabel: `Thành viên #${booking.userId}`,
      primaryText: booking.userFullName || `Thành viên #${booking.userId}`,
      secondaryText: booking.userEmail || null,
    };
  }
  return {
    typeLabel: 'Khách vãng lai',
    primaryText: booking.guestName || 'Khách vãng lai',
    secondaryText: booking.guestPhone ? `SĐT: ${booking.guestPhone}` : null,
  };
}


