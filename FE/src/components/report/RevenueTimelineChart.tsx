import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatShortDateVi } from '@/lib/booking';
import { formatVnd } from '@/lib/voucher';
import {
  REPORT_GROUP_BY_LABELS,
  type ReportGroupBy,
  type RevenuePeriodBucketResponse,
} from '@/types/report';

export interface RevenueTimelineChartProps {
  timeline: RevenuePeriodBucketResponse[];
  groupBy: ReportGroupBy;
}

function formatPeriodLabel(period: string, groupBy: ReportGroupBy): string {
  if (groupBy === 'MONTH') {
    const [yyyy, mm] = period.split('-');
    return yyyy && mm ? `Tháng ${mm}/${yyyy}` : period;
  }
  const formatted = formatShortDateVi(period);
  return groupBy === 'WEEK' ? `Tuần từ ${formatted}` : formatted;
}

function formatAxisTick(period: string, groupBy: ReportGroupBy): string {
  if (groupBy === 'MONTH') {
    const [yyyy, mm] = period.split('-');
    return yyyy && mm ? `${mm}/${yyyy.slice(2)}` : period;
  }
  const parts = period.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return period;
}

export function RevenueTimelineChart({
  timeline,
  groupBy,
}: RevenueTimelineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxMagnitude = timeline.reduce((max, bucket) => {
    const candidate = Math.max(
      Math.abs(bucket.netRevenue || 0),
      bucket.grossRevenue || 0
    );
    return candidate > max ? candidate : max;
  }, 0);

  const inspectedBucket =
    activeIndex != null && timeline[activeIndex]
      ? timeline[activeIndex]
      : timeline[timeline.length - 1] ?? null;

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Biểu đồ dòng thời gian doanh thu
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Chế độ: {REPORT_GROUP_BY_LABELS[groupBy]} &bull; Hiển thị đầy đủ các kỳ liên tiếp (kể cả kỳ 0đ).
            </CardDescription>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
            {timeline.length} mốc
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {timeline.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-xs text-zinc-500">
            Không có dữ liệu dòng thời gian trong kỳ đã chọn.
          </div>
        ) : (
          <>
            {/* Detail Inspector Strip */}
            {inspectedBucket && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs sm:grid-cols-5">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-zinc-500">Mốc kỳ</span>
                  <p className="font-semibold text-zinc-900">
                    {formatPeriodLabel(inspectedBucket.period, groupBy)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Thuần (Net)</span>
                  <p className="font-sans font-bold tabular-nums text-zinc-900">
                    {formatVnd(inspectedBucket.netRevenue)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Gộp (Gross)</span>
                  <p className="font-sans font-semibold tabular-nums text-zinc-700">
                    {formatVnd(inspectedBucket.grossRevenue)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Hoàn tiền</span>
                  <p className="font-sans font-semibold tabular-nums text-zinc-600">
                    {formatVnd(inspectedBucket.refundedAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Giao dịch</span>
                  <p className="font-mono font-semibold tabular-nums text-zinc-800">
                    {inspectedBucket.transactionCount} GD
                  </p>
                </div>
              </div>
            )}

            {/* Pure CSS Bar Chart */}
            <div className="overflow-x-auto pb-2">
              <div
                className="flex h-52 items-end gap-1.5 border-b border-zinc-200 px-1 pt-6"
                style={{
                  minWidth:
                    timeline.length > 16
                      ? `${timeline.length * 34}px`
                      : '100%',
                }}
              >
                {timeline.map((bucket, idx) => {
                  const net = bucket.netRevenue || 0;
                  const heightPercent =
                    maxMagnitude > 0
                      ? Math.max(
                          net > 0 ? 4 : 0,
                          Math.round((Math.max(0, net) / maxMagnitude) * 100)
                        )
                      : 0;
                  const isActive =
                    activeIndex === idx ||
                    (activeIndex === null && idx === timeline.length - 1);

                  return (
                    <button
                      key={bucket.period}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onFocus={() => setActiveIndex(idx)}
                      onClick={() => setActiveIndex(idx)}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5 focus:outline-none"
                      title={`${formatPeriodLabel(bucket.period, groupBy)}: Thuần ${formatVnd(bucket.netRevenue)} (${bucket.transactionCount} GD)`}
                    >
                      <div className="relative flex h-full w-full items-end justify-center">
                        {net > 0 ? (
                          <div
                            className={`w-full max-w-[28px] rounded-t-sm transition-all ${
                              isActive
                                ? 'bg-zinc-900'
                                : 'bg-zinc-600 group-hover:bg-zinc-800'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        ) : (
                          <div
                            className={`h-[2px] w-full max-w-[28px] rounded-full ${
                              isActive ? 'bg-zinc-900' : 'bg-zinc-300'
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`whitespace-nowrap font-mono text-[10px] ${
                          isActive
                            ? 'font-bold text-zinc-900'
                            : 'text-zinc-500'
                        }`}
                      >
                        {formatAxisTick(bucket.period, groupBy)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              * Di chuột hoặc chạm vào từng cột để xem chi tiết doanh thu gộp, hoàn tiền và số giao dịch tại mốc kỳ đó.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

