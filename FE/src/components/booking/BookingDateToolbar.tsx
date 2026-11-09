import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  formatDateVietnamese,
  getMaxBookingDateIso,
  getTodayIso,
  shiftDateIso,
} from '@/lib/booking';

export interface BookingDateToolbarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  complexOptions: string[];
  selectedComplex: string;
  onComplexChange: (complexName: string) => void;
  disabled?: boolean;
}

export function BookingDateToolbar({
  selectedDate,
  onDateChange,
  complexOptions,
  selectedComplex,
  onComplexChange,
  disabled = false,
}: BookingDateToolbarProps) {
  const todayIso = getTodayIso();
  const maxDateIso = getMaxBookingDateIso(30);

  const canGoPrev = selectedDate > todayIso;
  const canGoNext = selectedDate < maxDateIso;

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Date Picker & Quick Navigation */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label
                htmlFor="booking-date-input"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                Ngày đặt sân
              </Label>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 text-amber-600"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                {formatDateVietnamese(selectedDate)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || !canGoPrev}
                onClick={() => onDateChange(shiftDateIso(selectedDate, -1))}
                className="h-9 px-2.5 sm:px-3"
              >
                &larr; <span className="hidden xs:inline sm:inline">Ngày trước</span>
              </Button>

              <Input
                id="booking-date-input"
                type="date"
                min={todayIso}
                max={maxDateIso}
                value={selectedDate}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.value) {
                    onDateChange(e.target.value);
                  }
                }}
                className="h-9 w-[150px] sm:w-44 border-zinc-300 bg-white font-sans text-xs sm:text-sm font-semibold tabular-nums text-zinc-900 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/15"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || !canGoNext}
                onClick={() => onDateChange(shiftDateIso(selectedDate, 1))}
                className="h-9 px-2.5 sm:px-3"
              >
                <span className="hidden xs:inline sm:inline">Ngày sau</span> &rarr;
              </Button>

              {selectedDate !== todayIso && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onDateChange(todayIso)}
                  className="h-9 border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                >
                  Hôm nay
                </Button>
              )}
            </div>

            <p className="text-[11px] text-zinc-500">
              Hệ thống nhận đặt sân từ hôm nay (
              <span className="font-sans font-semibold tabular-nums text-zinc-700">
                {todayIso}
              </span>
              ) đến tối đa 30 ngày tới (
              <span className="font-sans font-semibold tabular-nums text-zinc-700">
                {maxDateIso}
              </span>
              ).
            </p>
          </div>

          {/* Complex / Location Filter */}
          {complexOptions.length > 0 && (
            <div className="space-y-1.5 sm:w-72">
              <Label
                htmlFor="complex-filter-select"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 text-indigo-600"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Lọc theo cụm sân / địa chỉ
              </Label>
              <select
                id="complex-filter-select"
                value={selectedComplex}
                disabled={disabled}
                onChange={(e) => onComplexChange(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-1.5 text-sm font-medium text-indigo-950 shadow-2xs transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              >
                <option value="ALL">
                  Tất cả cụm sân ({complexOptions.length} khu vực)
                </option>
                {complexOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
          <span className="font-medium text-zinc-500">Chú thích khung giờ:</span>
          <Badge variant="outline" className="border-zinc-300 bg-white font-semibold text-zinc-800">
            Còn trống (Bấm chọn được)
          </Badge>
          <span className="inline-flex items-center rounded-md border border-amber-600 bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Đang chọn
          </span>
          <span className="inline-flex items-center rounded-md border border-red-600 bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Đã đặt
          </span>
          <Badge variant="secondary" className="opacity-85">
            Đã qua giờ / Không khả dụng
          </Badge>
          <Badge variant="amber">Sân đang bảo trì</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
