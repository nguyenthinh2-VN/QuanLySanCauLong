import { AuthAlert } from '@/components/auth/AuthAlert';
import { CourtOccupancyTable } from '@/components/report/CourtOccupancyTable';
import { DailyOccupancyTable } from '@/components/report/DailyOccupancyTable';
import { OccupancyOverviewCard } from '@/components/report/OccupancyOverviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortDateVi } from '@/lib/booking';
import type { OccupancyReportResponse } from '@/types/report';

export interface OccupancyReportSectionProps {
  report: OccupancyReportResponse | null;
  loading: boolean;
  errorMessage: string | null;
  selectedCourtName?: string;
}

export function OccupancyReportSection({
  report,
  loading,
  errorMessage,
  selectedCourtName,
}: OccupancyReportSectionProps) {
  return (
    <section className="space-y-4">
      {/* Section Header & Business Rule Note */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            2. Báo cáo Công suất sân (Tỉ lệ lấp đầy)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Tính các đơn <strong>PENDING / CONFIRMED / CHECKED_IN / COMPLETED</strong> (loại <strong>CANCELLED</strong>). Mẫu số = số sân <strong>AVAILABLE</strong> &times; số khung giờ &times; số ngày; sân <strong>MAINTENANCE</strong> không tính vào mẫu số (nếu chưa có sân AVAILABLE hoặc chưa cấu hình khung giờ thì tỉ lệ bằng 0).
          </p>
        </div>
        {report && !loading && (
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-medium text-zinc-700">
            {formatShortDateVi(report.from)} &ndash; {formatShortDateVi(report.to)}
          </span>
        )}
      </div>

      {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Skeleton className="h-72 w-full rounded-xl lg:col-span-5" />
            <Skeleton className="h-72 w-full rounded-xl lg:col-span-7" />
          </div>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <OccupancyOverviewCard
            overallRate={report.overallRate}
            bookedSlots={report.bookedSlots}
            totalSlots={report.totalSlots}
            selectedCourtName={selectedCourtName}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <CourtOccupancyTable items={report.byCourt} />
            </div>
            <div className="lg:col-span-7">
              <DailyOccupancyTable items={report.daily} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

