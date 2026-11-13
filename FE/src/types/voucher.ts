export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  userUsageLimit: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherRequest {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  userUsageLimit: number;
  startDate: string;
  endDate: string;
  active?: boolean;
}

export interface UpdateVoucherRequest {
  name?: string;
  description?: string;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  endDate?: string;
  active?: boolean;
}

export interface ApplyVoucherRequest {
  bookingId: number;
  code: string;
}

export interface ApplyVoucherResponse {
  bookingId: number;
  voucherCode: string;
  voucherName: string;
  discountType: DiscountType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export type VoucherSortField =
  | 'id'
  | 'code'
  | 'name'
  | 'discountValue'
  | 'startDate'
  | 'endDate'
  | 'active'
  | 'createdAt'
  | 'usedCount';

export interface VoucherQueryParams {
  keyword?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ActiveVoucherQueryParams {
  page?: number;
  size?: number;
  sort?: string;
}

