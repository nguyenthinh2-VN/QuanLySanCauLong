import type { PaymentMethod } from '@/types/payment';

export type ReportGroupBy = 'DAY' | 'WEEK' | 'MONTH';

export interface RevenueTotalsResponse {
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  transactionCount: number;
}

export interface PaymentMethodBreakdownResponse {
  paymentMethod: PaymentMethod;
  grossRevenue: number;
  transactionCount: number;
}

export interface RevenuePeriodBucketResponse {
  period: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  transactionCount: number;
}

export interface RevenueReportResponse {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  totals: RevenueTotalsResponse;
  byPaymentMethod: PaymentMethodBreakdownResponse[];
  timeline: RevenuePeriodBucketResponse[];
}

export interface CourtOccupancyResponse {
  courtId: number;
  courtName: string;
  bookedSlots: number;
  totalSlots: number;
  occupancyRate: number;
}

export interface DailyOccupancyResponse {
  date: string;
  bookedSlots: number;
  totalSlots: number;
  occupancyRate: number;
}

export interface OccupancyReportResponse {
  from: string;
  to: string;
  overallRate: number;
  bookedSlots: number;
  totalSlots: number;
  byCourt: CourtOccupancyResponse[];
  daily: DailyOccupancyResponse[];
}

export interface CourtOption {
  id: number;
  name: string;
  status: string;
  complexName?: string;
}

export interface RevenueReportQueryParams {
  from?: string;
  to?: string;
  groupBy?: ReportGroupBy;
}

export interface OccupancyReportQueryParams {
  from?: string;
  to?: string;
  courtId?: number;
}

export const REPORT_GROUP_BY_LABELS: Record<ReportGroupBy, string> = {
  DAY: 'Theo ngày',
  WEEK: 'Theo tuần (T2–CN)',
  MONTH: 'Theo tháng',
};

