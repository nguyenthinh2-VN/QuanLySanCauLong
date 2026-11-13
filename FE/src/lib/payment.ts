import api from '@/lib/api';
import type { ApiResponse } from '@/types/auth';
import type {
  CreatePaymentRequest,
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
  return response.data.data;
}

