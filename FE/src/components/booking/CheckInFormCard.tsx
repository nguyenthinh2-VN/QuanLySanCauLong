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
import { formatDateVietnamese, getTodayIso } from '@/lib/booking';

export interface CheckInFormCardProps {
  submitting: boolean;
  errorMessage: string | null;
  onSubmitCheckIn: (bookingId: number) => Promise<void>;
  onClearError: () => void;
}

export function CheckInFormCard({
  submitting,
  errorMessage,
  onSubmitCheckIn,
  onClearError,
}: CheckInFormCardProps) {
  const [bookingIdInput, setBookingIdInput] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const todayIso = getTodayIso();

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    onClearError();

    const trimmed = bookingIdInput.trim();
    const parsedId = Number(trimmed);
    if (!trimmed || !Number.isInteger(parsedId) || parsedId <= 0) {
      setLocalError(
        'Vui lòng nhập mã đơn đặt sân hợp lệ (số nguyên dương, ví dụ: 15)'
      );
      return;
    }

    await onSubmitCheckIn(parsedId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Main Input Card */}
      <Card className="border-t-4 border-t-zinc-900 border-zinc-200/90 bg-white shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="zinc">Nghiệp vụ Lễ tân &middot; Module 5</Badge>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-sans text-xs font-semibold text-zinc-700">
              Hôm nay: {formatDateVietnamese(todayIso)} ({todayIso})
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-zinc-900">
            Check-in Khách Vào Sân
          </CardTitle>
          <CardDescription className="text-sm text-zinc-600">
            Nhập mã đơn đặt sân (Booking ID) của khách hàng để xác nhận khách đã
            có mặt nhận sân thi đấu.
          </CardDescription>
        </CardHeader>

        <Separator />

        <form onSubmit={handleFormSubmit} noValidate>
          <CardContent className="space-y-4 pt-5">
            {localError && <AuthAlert variant="error">{localError}</AuthAlert>}
            {errorMessage && (
              <AuthAlert variant="error">{errorMessage}</AuthAlert>
            )}

            <div className="space-y-2">
              <Label htmlFor="checkin-booking-id" className="text-sm font-semibold">
                Mã đơn đặt sân (Booking ID){' '}
                <span className="text-rose-600">*</span>
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="checkin-booking-id"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Nhập mã số đơn đặt sân (VD: 15, 85...)"
                  value={bookingIdInput}
                  disabled={submitting}
                  onChange={(e) => {
                    setBookingIdInput(e.target.value);
                    if (localError) setLocalError(null);
                    if (errorMessage) onClearError();
                  }}
                  className="h-10 flex-1 font-mono text-sm tabular-nums"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 shrink-0 px-6 font-semibold"
                >
                  {submitting ? 'Đang xác nhận...' : 'Check-in'}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Nhân viên hỏi mã đơn đặt sân từ khách hàng (ví dụ: đơn `#15`
                trên màn hình Lịch đặt của khách hoặc phiếu POS tại quầy) rồi
                bấm <strong>Check-in</strong>.
              </p>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 4 Mandatory Check-in Rules Reference Card */}
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-zinc-900">
              4 Điều kiện hợp lệ để Check-in đơn đặt sân
            </CardTitle>
            <Badge variant="secondary">Quy định hệ thống</Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Hệ thống Backend tự động kiểm tra đủ 4 điều kiện dưới đây khi bấm
            Check-in:
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                1. Mã đơn tồn tại
              </span>
              <Badge variant="zinc">404 nếu sai mã</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              Mã đơn đặt sân (`bookingId`) phải tồn tại trong hệ thống. Nếu nhập
              mã không tồn tại, hệ thống trả lỗi{' '}
              <span className="font-mono font-semibold text-zinc-800">
                BOOKING_NOT_FOUND
              </span>
              .
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                2. Đúng ngày hôm nay
              </span>
              <Badge variant="sky">{todayIso}</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              Ngày đặt sân (`bookingDate`) phải trùng khớp với ngày hiện tại.
              Không thể check-in sớm cho đơn ngày mai hoặc check-in bù đơn ngày
              cũ.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                3. Trước giờ kết thúc ca
              </span>
              <Badge variant="amber">Trong giờ chơi</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              Thời điểm bấm Check-in phải diễn ra nghiêm ngặt trước giờ kết thúc
              (`endTime`) của khung giờ đã đặt. Ca đã qua giờ sẽ bị từ chối.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                4. Trạng thái hợp lệ
              </span>
              <Badge variant="indigo">PENDING / CONFIRMED</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              Chỉ chấp nhận đơn đang ở trạng thái{' '}
              <span className="font-semibold text-zinc-900">PENDING</span> hoặc{' '}
              <span className="font-semibold text-zinc-900">CONFIRMED</span>.
              Đơn đã <span className="font-mono">CHECKED_IN</span>,{' '}
              <span className="font-mono">COMPLETED</span> hoặc{' '}
              <span className="font-mono">CANCELLED</span> sẽ báo lỗi 409.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

