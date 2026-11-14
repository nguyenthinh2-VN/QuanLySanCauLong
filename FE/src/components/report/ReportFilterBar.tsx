import { AuthAlert } from '@/components/auth/AuthAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  REPORT_GROUP_BY_LABELS,
  type CourtOption,
  type ReportGroupBy,
} from '@/types/report';

export interface ReportFilterBarProps {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  courtId: string;
  courts: CourtOption[];
  courtsLoading: boolean;
  validationError: string | null;
  loading: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onGroupByChange: (value: ReportGroupBy) => void;
  onCourtIdChange: (value: string) => void;
  onResetDefault: () => void;
}

export function ReportFilterBar({
  from,
  to,
  groupBy,
  courtId,
  courts,
  courtsLoading,
  validationError,
  loading,
  onFromChange,
  onToChange,
  onGroupByChange,
  onCourtIdChange,
  onResetDefault,
}: ReportFilterBarProps) {
  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* From Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-from-date"
              className="block text-xs font-semibold text-zinc-800"
            >
              Từ ngày
            </label>
            <Input
              id="report-from-date"
              type="date"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              disabled={loading}
              className="font-mono text-xs"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-to-date"
              className="block text-xs font-semibold text-zinc-800"
            >
              Đến ngày
            </label>
            <Input
              id="report-to-date"
              type="date"
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              disabled={loading}
              className="font-mono text-xs"
            />
          </div>

          {/* Group By (Revenue only) */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-group-by"
              className="block text-xs font-semibold text-zinc-800"
            >
              Gom nhóm thời gian
            </label>
            <select
              id="report-group-by"
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as ReportGroupBy)}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(['DAY', 'WEEK', 'MONTH'] as ReportGroupBy[]).map((mode) => (
                <option key={mode} value={mode}>
                  {REPORT_GROUP_BY_LABELS[mode]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              * Chỉ áp dụng cho khu vực Doanh thu
            </p>
          </div>

          {/* Court Filter (Occupancy only) */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-court-id"
              className="block text-xs font-semibold text-zinc-800"
            >
              Lọc theo sân
            </label>
            <select
              id="report-court-id"
              value={courtId}
              onChange={(e) => onCourtIdChange(e.target.value)}
              disabled={loading || courtsLoading}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ALL">Tất cả sân (Đang hoạt động)</option>
              {courts.map((court) => (
                <option key={court.id} value={String(court.id)}>
                  {court.name}
                  {court.complexName ? ` (${court.complexName})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              * Chỉ áp dụng cho khu vực Công suất sân
            </p>
          </div>

          {/* Reset Action */}
          <div className="flex items-start sm:items-end lg:pb-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetDefault}
              disabled={loading}
              className="w-full"
            >
              30 ngày gần nhất
            </Button>
          </div>
        </div>

        {validationError && (
          <AuthAlert variant="error">{validationError}</AuthAlert>
        )}
      </CardContent>
    </Card>
  );
}

