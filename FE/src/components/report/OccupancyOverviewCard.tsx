import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatPercentVi } from '@/lib/report';

export interface OccupancyOverviewCardProps {
  overallRate: number;
  bookedSlots: number;
  totalSlots: number;
  selectedCourtName?: string;
}

export function OccupancyOverviewCard({
  overallRate,
  bookedSlots,
  totalSlots,
  selectedCourtName,
}: OccupancyOverviewCardProps) {
  const clampedPercent = Math.min(100, Math.max(0, overallRate || 0));

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Tỉ lệ lấp đầy chung
              </span>
              <Badge variant="zinc">
                {selectedCourtName ? selectedCourtName : 'Tất cả sân AVAILABLE'}
              </Badge>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-4xl font-bold tracking-tight tabular-nums text-zinc-900">
                {formatPercentVi(overallRate)}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-zinc-600">
                ({bookedSlots} / {totalSlots} slot)
              </span>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Mức độ sử dụng</span>
              <span className="font-mono font-semibold text-zinc-800">
                {bookedSlots} đã đặt &bull; {Math.max(0, totalSlots - bookedSlots)} trống
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all"
                style={{ width: `${clampedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

