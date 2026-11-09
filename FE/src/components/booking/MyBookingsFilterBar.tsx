import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BookingSortParam, BookingStatus } from '@/types/booking';

export type StatusFilterValue = 'ALL' | BookingStatus;

interface StatusTabOption {
  value: StatusFilterValue;
  label: string;
}

const STATUS_TABS: StatusTabOption[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Đã nhận sân' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const SORT_OPTIONS: { value: BookingSortParam; label: string }[] = [
  { value: 'createdAt,desc', label: 'Mới đặt gần nhất (createdAt ↓)' },
  { value: 'createdAt,asc', label: 'Đặt cũ nhất (createdAt ↑)' },
  { value: 'bookingDate,desc', label: 'Ngày chơi mới nhất (bookingDate ↓)' },
  { value: 'bookingDate,asc', label: 'Ngày chơi gần nhất (bookingDate ↑)' },
  { value: 'totalAmount,desc', label: 'Tổng tiền cao đến thấp (totalAmount ↓)' },
  { value: 'totalAmount,asc', label: 'Tổng tiền thấp đến cao (totalAmount ↑)' },
];

export interface MyBookingsFilterBarProps {
  statusFilter: StatusFilterValue;
  onStatusFilterChange: (status: StatusFilterValue) => void;
  fromDate: string;
  onFromDateChange: (date: string) => void;
  toDate: string;
  onToDateChange: (date: string) => void;
  sort: BookingSortParam;
  onSortChange: (sort: BookingSortParam) => void;
  onResetFilters: () => void;
  disabled?: boolean;
}

export function MyBookingsFilterBar({
  statusFilter,
  onStatusFilterChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  sort,
  onSortChange,
  onResetFilters,
  disabled = false,
}: MyBookingsFilterBarProps) {
  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    sort !== 'createdAt,desc';

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Status Filter Pills */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Lọc theo trạng thái đơn
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onStatusFilterChange(tab.value)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 shadow-2xs'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range & Sort Whitelist Controls */}
        <div className="grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label
              htmlFor="filter-from-date"
              className="text-xs font-medium text-zinc-600"
            >
              Từ ngày
            </Label>
            <Input
              id="filter-from-date"
              type="date"
              value={fromDate}
              disabled={disabled}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="h-9 font-sans text-xs tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="filter-to-date"
              className="text-xs font-medium text-zinc-600"
            >
              Đến ngày
            </Label>
            <Input
              id="filter-to-date"
              type="date"
              value={toDate}
              disabled={disabled}
              onChange={(e) => onToDateChange(e.target.value)}
              className="h-9 font-sans text-xs tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="filter-sort-select"
              className="text-xs font-medium text-zinc-600"
            >
              Sắp xếp theo
            </Label>
            <select
              id="filter-sort-select"
              value={sort}
              disabled={disabled}
              onChange={(e) => onSortChange(e.target.value as BookingSortParam)}
              className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 disabled:opacity-50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={onResetFilters}
                className="h-9 w-full text-xs"
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
