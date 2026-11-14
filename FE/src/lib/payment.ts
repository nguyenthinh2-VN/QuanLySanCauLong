import api from '@/lib/api';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/types/booking';
import type {
  CreatePaymentRequest,
  PaymentDetailResponse,
  PaymentHistoryQueryParams,
  PaymentResponse,
  RefundPaymentRequest,
} from '@/types/payment';

/**
 * Gửi yêu cầu thanh toán đơn đặt sân
 * Endpoint: POST /api/v1/payments
 * Quyền: Đã đăng nhập (Chủ đơn hoặc STAFF/ADMIN)
 * Lưu ý: Không gửi `amount`, server tự tính từ booking.totalAmount (FULL = 100%, DEPOSIT = 50% HALF_UP)
 */
export async function createPayment(
  request: CreatePaymentRequest
): Promise<PaymentResponse> {
  const response = await api.post<ApiResponse<PaymentResponse>>(
    '/payments',
    request
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể thực hiện thanh toán đơn đặt sân'
    );
  }
  return response.data.data;
}

/**
 * Gửi yêu cầu hoàn tiền giao dịch thanh toán
 * Endpoint: POST /api/v1/payments/{id}/refund
 * Quyền: STAFF hoặc ADMIN
 * Lưu ý: Hoàn tiền thành công sẽ chuyển payment -> REFUNDED và booking -> CANCELLED
 */
export async function refundPayment(
  paymentId: number,
  request?: RefundPaymentRequest
): Promise<PaymentResponse> {
  const response = await api.post<ApiResponse<PaymentResponse>>(
    `/payments/${paymentId}/refund`,
    request ?? {}
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể thực hiện hoàn tiền cho giao dịch này'
    );
  }
  return response.data.data;
}

function cleanQueryParams(
  params?: PaymentHistoryQueryParams
): Record<string, string | number> {
  if (!params) return {};
  const cleaned: Record<string, string | number> = {};
  if (params.status) cleaned.status = params.status;
  if (params.paymentMethod) cleaned.paymentMethod = params.paymentMethod;
  if (params.bookingId !== undefined) cleaned.bookingId = params.bookingId;
  if (params.fromDate) cleaned.fromDate = params.fromDate;
  if (params.toDate) cleaned.toDate = params.toDate;
  if (params.page !== undefined) cleaned.page = params.page;
  if (params.size !== undefined) cleaned.size = params.size;
  if (params.sort) cleaned.sort = params.sort;
  return cleaned;
}

/**
 * Lấy lịch sử giao dịch toàn hệ thống (STAFF, ADMIN)
 * Endpoint: GET /api/v1/payments
 */
export async function getPayments(
  params?: PaymentHistoryQueryParams
): Promise<PageResponse<PaymentResponse>> {
  const response = await api.get<ApiResponse<PageResponse<PaymentResponse>>>(
    '/payments',
    { params: cleanQueryParams(params) }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải danh sách lịch sử giao dịch'
    );
  }
  return response.data.data;
}

/**
 * Lấy lịch sử giao dịch của người dùng đang đăng nhập
 * Endpoint: GET /api/v1/payments/my
 */
export async function getMyPayments(
  params?: PaymentHistoryQueryParams
): Promise<PageResponse<PaymentResponse>> {
  const response = await api.get<ApiResponse<PageResponse<PaymentResponse>>>(
    '/payments/my',
    { params: cleanQueryParams(params) }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải lịch sử giao dịch của bạn'
    );
  }
  return response.data.data;
}

/**
 * Lấy chi tiết hóa đơn giao dịch thanh toán
 * Endpoint: GET /api/v1/payments/{id}
 */
export async function getPaymentById(
  paymentId: number
): Promise<PaymentDetailResponse> {
  const response = await api.get<ApiResponse<PaymentDetailResponse>>(
    `/payments/${paymentId}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải chi tiết hóa đơn giao dịch'
    );
  }
  return response.data.data;
}

