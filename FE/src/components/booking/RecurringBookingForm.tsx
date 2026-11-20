import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DAY_OF_WEEK_OPTIONS,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getMaxBookingDateIso,
  getTodayIso,
} from '@/lib/booking';
import type { DayOfWeek } from '@/types/booking';
import type { Complex, Court, TimeSlot } from '@/types/court';

export interface RecurringBookingFormProps {
  complexes: Complex[];
  courts: Court[];
  timeSlots: TimeSlot[];
  selectedComplexId: number | null;
  onSelectComplexId: (id: number | null) => void;
  selectedCourtId: number | null;
  onSelectCourtId: (id: number | null) => void;
  selectedTimeSlotId: number | null;
  onSelectTimeSlotId: (id: number | null) => void;
  selectedDayOfWeek: DayOfWeek;
  onSelectDayOfWeek: (day: DayOfWeek) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  firstCalculatedDate: string;
  weeks: number;
  onWeeksChange: (weeks: number) => void;
  note: string;
  onNoteChange: (note: string) => void;
  disabled?: boolean;
}

export function RecurringBookingForm({
  complexes,
  courts,
  timeSlots,
  selectedComplexId,
  onSelectComplexId,
  selectedCourtId,
  onSelectCourtId,
  selectedTimeSlotId,
  onSelectTimeSlotId,
  selectedDayOfWeek,
  onSelectDayOfWeek,
  startDate,
  onStartDateChange,
  firstCalculatedDate,
  weeks,
  onWeeksChange,
  note,
  onNoteChange,
  disabled = false,
}: RecurringBookingFormProps) {
  const isFirstDateToday = firstCalculatedDate === getTodayIso();

  function isSlotPassedToday(endTime: string): boolean {
    if (!isFirstDateToday) return false;
    const now = new Date();
    const [hh, mm] = endTime.split(':').map(Number);
    const end = new Date();
    end.setHours(hh || 0, mm || 0, 0, 0);
    return now.getTime() >= end.getTime();
  }

  return (
    <Card className="border-zinc-200 bg-white shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <CardTitle className="text-sm font-semibold text-zinc-900">
          Thông tin cấu hình lịch cố định
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Bước 1: Chọn Cụm sân & Sân con */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-zinc-700">
              1. Cụm sân <span className="text-red-500">*</span>
            </Label>
            <select
              value={selectedComplexId ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onSelectComplexId(val);
              }}
              disabled={disabled}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden disabled:opacity-50"
            >
              <option value="">-- Chọn cụm sân --</option>
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-zinc-700">
              2. Sân con <span className="text-red-500">*</span>
            </Label>
            <select
              value={selectedCourtId ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onSelectCourtId(val);
              }}
              disabled={disabled || !selectedComplexId}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden disabled:opacity-50"
            >
              <option value="">
                {selectedComplexId
                  ? '-- Chọn sân con --'
                  : '-- Vui lòng chọn cụm sân trước --'}
              </option>
              {courts.map((court) => {
                const isMaintenance = court.status === 'MAINTENANCE';
                return (
                  <option
                    key={court.id}
                    value={court.id}
                    disabled={isMaintenance}
                  >
                    {court.name}{' '}
                    {isMaintenance ? '(Đang bảo trì - Không khả dụng)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Bước 2: Chọn Khung giờ */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-zinc-700">
            3. Khung giờ thuê <span className="text-red-500">*</span>
          </Label>
          <select
            value={selectedTimeSlotId ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSelectTimeSlotId(val);
            }}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden disabled:opacity-50"
          >
            <option value="">-- Chọn khung giờ mở cửa --</option>
            {timeSlots.map((slot) => {
              const passed = isSlotPassedToday(slot.endTime);
              return (
                <option key={slot.id} value={slot.id} disabled={passed}>
                  {slot.name} ({formatTimeShort(slot.startTime)} -{' '}
                  {formatTimeShort(slot.endTime)}) —{' '}
                  {formatCurrencyVnd(slot.pricePerHour)}/giờ
                  {passed ? ' (Đã kết thúc hôm nay)' : ''}
                </option>
              );
            })}
          </select>
          {isFirstDateToday && (
            <p className="text-[11px] text-zinc-500">
              * Buổi đầu tiên rơi vào hôm nay: các khung giờ đã kết thúc trước thời điểm hiện tại sẽ bị vô hiệu hóa.
            </p>
          )}
        </div>

        {/* Bước 3: Chọn Thứ trong tuần */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700">
            4. Thứ lặp lại hàng tuần <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {DAY_OF_WEEK_OPTIONS.map((opt) => {
              const isSelected = selectedDayOfWeek === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectDayOfWeek(opt.key)}
                  className={`flex flex-col items-center justify-center rounded-lg border py-2 text-xs transition-colors ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 font-semibold text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bước 4: Ngày bắt đầu & Số tuần */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-zinc-700">
              5. Ngày bắt đầu <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={startDate}
              min={getTodayIso()}
              max={getMaxBookingDateIso(30)}
              disabled={disabled}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-zinc-500">
              Cho phép chọn trong khoảng 30 ngày tới. Buổi đầu tiên thật sự sẽ tự động căn chỉnh tới{' '}
              <span className="font-semibold text-zinc-800">
                {formatShortDateVi(firstCalculatedDate)}
              </span>.
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-zinc-700">
              6. Số tuần lặp lại (1 – 12 tuần) <span className="text-red-500">*</span>
            </Label>
            <select
              value={weeks}
              onChange={(e) => onWeeksChange(Number(e.target.value))}
              disabled={disabled}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden disabled:opacity-50"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {w} tuần ({w} buổi)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              Số tuần tối đa được phép đặt trước là 12 tuần.
            </p>
          </div>
        </div>

        {/* Ghi chú */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-zinc-700">
            7. Ghi chú thêm (tùy chọn)
          </Label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={disabled}
            maxLength={500}
            rows={2}
            placeholder="VD: Nhóm sinh hoạt cố định thứ 4 hàng tuần..."
            className="w-full rounded-md border border-zinc-200 p-2.5 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-hidden disabled:opacity-50"
          />
          <div className="flex justify-end text-[10px] text-zinc-400">
            {note.length}/500 ký tự
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
