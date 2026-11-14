import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatShortDateVi } from '@/lib/booking';
import { formatPercentVi } from '@/lib/report';
import type { DailyOccupancyResponse } from '@/types/report';

export interface DailyOccupancyTableProps {
  items: DailyOccupancyResponse[];
}

export function DailyOccupancyTable({ items }: DailyOccupancyTableProps) {
  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Công suất theo ngày
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Chi tiết số slot lấp đầy từng ngày trong kỳ báo cáo.
            </CardDescription>
          </div>
          <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
            {items.length} ngày
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Không có dữ liệu công suất theo ngày.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr className="border-y border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-2.5">Ngày</th>
                  <th className="px-4 py-2.5 text-right">Đã đặt / Tổng</th>
                  <th className="px-4 py-2.5 text-right">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((row) => {
                  const widthPercent = Math.min(
                    100,
                    Math.max(0, row.occupancyRate || 0)
                  );
                  return (
                    <tr key={row.date} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-2.5 font-mono font-medium text-zinc-900">
                        {formatShortDateVi(row.date)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-700">
                        {row.bookedSlots} / {row.totalSlots}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 sm:block">
                            <div
                              className="h-full rounded-full bg-zinc-800"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold tabular-nums text-zinc-900">
                            {formatPercentVi(row.occupancyRate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

