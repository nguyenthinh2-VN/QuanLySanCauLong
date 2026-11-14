import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatPercentVi } from '@/lib/report';
import type { CourtOccupancyResponse } from '@/types/report';

export interface CourtOccupancyTableProps {
  items: CourtOccupancyResponse[];
}

export function CourtOccupancyTable({ items }: CourtOccupancyTableProps) {
  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-zinc-900">
          Công suất theo từng sân
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          So sánh số slot đã đặt trên tổng slot khả dụng của từng sân trong kỳ.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Không có dữ liệu sân khả dụng trong kỳ này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-y border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-2.5">Tên sân</th>
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
                    <tr key={row.courtId} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        <div>{row.courtName}</div>
                        <div className="mt-1.5 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-800 transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-700">
                        {row.bookedSlots} / {row.totalSlots}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-zinc-900">
                        {formatPercentVi(row.occupancyRate)}
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

