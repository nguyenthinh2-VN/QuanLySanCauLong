import { AuthAlert } from '@/components/auth/AuthAlert';
import { PaymentMethodBreakdownCard } from '@/components/report/PaymentMethodBreakdownCard';
import { RevenueKpiGrid } from '@/components/report/RevenueKpiGrid';
import { RevenueTimelineChart } from '@/components/report/RevenueTimelineChart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortDateVi } from '@/lib/booking';
import type { RevenueReportResponse } from '@/types/report';

export interface RevenueReportSectionProps {
  report: RevenueReportResponse | null;
  loading: boolean;
  errorMessage: string | null;
}

export function RevenueReportSection({
  report,
  loading,
  errorMessage,
}: RevenueReportSectionProps) {
  return (
    <section className="space-y-4">
      {/* Section Header & Business Rule Note */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            1. Báo cáo Doanh thu
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Tính theo thời điểm thanh toán (<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px]">paidAt</code>): chỉ tính giao dịch <strong>SUCCESS</strong> (gộp) và <strong>REFUNDED</strong> (hoàn tiền); giao dịch PENDING/FAILED không tính.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Skeleton className="h-64 w-full rounded-xl lg:col-span-5" />
            <Skeleton className="h-64 w-full rounded-xl lg:col-span-7" />
          </div>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <RevenueKpiGrid totals={report.totals} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <PaymentMethodBreakdownCard items={report.byPaymentMethod} />
            </div>
            <div className="lg:col-span-7">
              <RevenueTimelineChart
                timeline={report.timeline}
                groupBy={report.groupBy}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

