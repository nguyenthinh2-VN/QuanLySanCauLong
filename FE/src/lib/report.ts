import api from '@/lib/api';
import { formatLocalDateIso } from '@/lib/booking';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/types/booking';
import type {
  CourtOption,
  OccupancyReportQueryParams,
  OccupancyReportResponse,
  RevenueReportQueryParams,
  RevenueReportResponse,
} from '@/types/report';

export const REPORT_MAX_RANGE_DAYS = 366;

/**
 * Lấy khoảng ngày mặc định 30 ngày gần nhất (to = hôm nay, from = to - 29 ngày)
 */
export function getDefaultReportRange(): { from: string; to: string } {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 29);

  return {
    from: formatLocalDateIso(fromDate),
    to: formatLocalDateIso(today),
  };
}

/**
 * Tính số ngày bao gồm cả 2 đầu mút [fromIso, toIso]
 */
export function diffDaysInclusive(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return NaN;

  const startUtc = Date.UTC(fy, fm - 1, fd);
  const endUtc = Date.UTC(ty, tm - 1, td);
  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Định dạng tỉ lệ phần trăm 2 chữ số thập phân (ví dụ: 62,50%)
 */
export function formatPercentVi(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0,00%';
  return `${new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

/**
 * Lấy báo cáo doanh thu (ADMIN-only)
 * Endpoint: GET /reports/revenue
 */
export async function getRevenueReport(
  params?: RevenueReportQueryParams
): Promise<RevenueReportResponse> {
  const cleanParams: Record<string, string> = {};
  if (params?.from) cleanParams.from = params.from;
  if (params?.to) cleanParams.to = params.to;
  if (params?.groupBy) cleanParams.groupBy = params.groupBy;

  const response = await api.get<ApiResponse<RevenueReportResponse>>(
    '/reports/revenue',
    { params: cleanParams }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải báo cáo doanh thu'
    );
  }
  return response.data.data;
}

/**
 * Lấy báo cáo tỉ lệ lấp đầy sân (ADMIN-only)
 * Endpoint: GET /reports/occupancy
 */
export async function getOccupancyReport(
  params?: OccupancyReportQueryParams
): Promise<OccupancyReportResponse> {
  const cleanParams: Record<string, string | number> = {};
  if (params?.from) cleanParams.from = params.from;
  if (params?.to) cleanParams.to = params.to;
  if (params?.courtId != null) cleanParams.courtId = params.courtId;

  const response = await api.get<ApiResponse<OccupancyReportResponse>>(
    '/reports/occupancy',
    { params: cleanParams }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải báo cáo công suất sân'
    );
  }
  return response.data.data;
}

/**
 * Lấy danh sách sân đang AVAILABLE để lọc báo cáo công suất
 * Endpoint: GET /courts?status=AVAILABLE&size=100 (Public)
 */
export async function getAvailableCourts(): Promise<CourtOption[]> {
  const response = await api.get<ApiResponse<PageResponse<CourtOption>>>(
    '/courts',
    {
      params: {
        status: 'AVAILABLE',
        size: 100,
      },
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || 'Không thể tải danh sách sân cầu lông'
    );
  }
  return response.data.data.items ?? [];
}

