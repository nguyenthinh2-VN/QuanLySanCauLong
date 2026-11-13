export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'E_WALLET';

export type PaymentType = 'FULL' | 'DEPOSIT';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface CreatePaymentRequest {
  bookingId: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface RefundPaymentRequest {
  reason?: string;
}

export interface PaymentResponse {
  id: number;
  bookingId: number;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Payment = PaymentResponse;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  E_WALLET: 'Ví điện tử',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  FULL: 'Thanh toán đủ (100%)',
  DEPOSIT: 'Đặt cọc (50%)',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

