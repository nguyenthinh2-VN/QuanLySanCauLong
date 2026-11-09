import React, { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  calculateSlotHours,
  estimateSlotTotal,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
} from '@/lib/booking';
import type { SelectedBookingSlot } from '@/types/booking';

export interface BookingConfirmPanelProps {
  selectedDate: string;
  selectedSlot: SelectedBookingSlot | null;
  submitting: boolean;
  submitError: string | null;
  onClearSelection: () => void;
  onSubmitBooking: (note: string) => Promise<void>;
}

export function BookingConfirmPanel({
  selectedDate,
  selectedSlot,
  submitting,
  submitError,
  onClearSelection,
  onSubmitBooking,
}: BookingConfirmPanelProps) {
  const [note, setNote] = useState('');

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot) return;
    await onSubmitBooking(note.trim());
  }

  if (!selectedSlot) {
    return (
      <Card
        id="booking-confirm-panel"
        className="border-zinc-200/90 bg-white shadow-xs"
      >
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-base font-bold text-zinc-900">
            Xác nhận đặt sân
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Chọn một khung giờ còn trống ở bảng bên trái để tiến hành đặt sân.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-5">
          {submitError && (
            <div className="mb-4">
              <AuthAlert variant="error">{submitError}</AuthAlert>
            </div>
          )}
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-5 text-center">
            <Badge variant="amber" className="mb-2 font-semibold">
              Chưa chọn khung giờ
            </Badge>
            <p className="text-xs leading-relaxed text-zinc-600">
              Bấm vào một ô khung giờ có trạng thái{' '}
              <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-semibold text-zinc-900">
                Còn trống
              </span>{' '}
              để xem chi tiết giá ước tính và gửi yêu cầu đặt sân.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { courtName, complexName, slot } = selectedSlot;
  const durationHours = calculateSlotHours(slot.startTime, slot.endTime);
  const estimatedTotal = estimateSlotTotal(
    slot.pricePerHour,
    slot.startTime,
    slot.endTime
  );

  return (
    <Card
      id="booking-confirm-panel"
      className="border-t-4 border-t-amber-600 border-zinc-200/90 bg-white shadow-sm lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto"
    >
      <CardHeader className="px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-zinc-900">
            Xác nhận đặt sân
          </CardTitle>
          <span className="inline-flex items-center rounded-md bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Đang chọn
          </span>
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Kiểm tra kỹ thông tin sân, địa chỉ và khung giờ trước khi xác nhận.
        </CardDescription>
      </CardHeader>

      <Separator />

      <form onSubmit={handleFormSubmit}>
        <CardContent className="space-y-3.5 px-5 py-4">
          {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}

          <div className="space-y-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3 text-sm">
            {/* Court & Complex / Address Highlight */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Sân &amp; Địa chỉ Cụm sân
              </span>
              <p className="text-sm sm:text-base font-bold text-zinc-900">
                {courtName}
              </p>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 shrink-0 text-indigo-600"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {complexName}
                </span>
              </div>
            </div>

            <Separator />

            {/* Date Highlight */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Ngày đặt
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-zinc-900">
                {formatShortDateVi(selectedDate)} ({selectedDate})
              </span>
            </div>

            {/* Time Slot Highlight */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Khung giờ chơi
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-amber-900">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 text-amber-600"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTimeShort(slot.startTime)} &ndash;{' '}
                {formatTimeShort(slot.endTime)} ({durationHours} giờ)
              </span>
            </div>

            {/* Unit Price Highlight */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Đơn giá khung giờ
              </span>
              <span className="font-sans text-xs font-bold tabular-nums text-indigo-700">
                {formatCurrencyVnd(slot.pricePerHour)} / giờ
              </span>
            </div>

            {/* Estimated Total Banner */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-950">
                  Giá ước tính
                </span>
                <span className="font-sans text-base sm:text-lg font-bold tabular-nums text-amber-800">
                  {formatCurrencyVnd(estimatedTotal)}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-900/75">
                * Tổng tiền chính thức do hệ thống tính toán khi tạo đơn.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-note-input" className="text-xs">
              Ghi chú (tùy chọn)
            </Label>
            <Input
              id="booking-note-input"
              type="text"
              maxLength={500}
              placeholder="VD: Thuê thêm 2 vợt cầu lông, 1 ống cầu..."
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              className="h-9 w-full"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý đặt sân...' : 'Đặt sân'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              disabled={submitting}
              onClick={onClearSelection}
            >
              Bỏ chọn khung giờ
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
