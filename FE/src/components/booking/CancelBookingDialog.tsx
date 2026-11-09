import { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { extractErrorMessage } from '@/lib/auth';
import {
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  submitCancelBooking,
} from '@/lib/booking';
import type { BookingResponse } from '@/types/booking';

export interface CancelBookingDialogProps {
  booking: BookingResponse | null;
  onClose: () => void;
  onCancelled: (updatedBooking: BookingResponse) => void;
}

export function CancelBookingDialog({
  booking,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!booking) return null;

  async function handleConfirmCancel() {
    if (!booking) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const updated = await submitCancelBooking(booking.id);
      onCancelled(updated);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể hủy đơn đặt sân ở trạng thái hiện tại'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <Card className="w-full max-w-md border-t-4 border-t-red-600 bg-white shadow-xl">
        <CardHeader className="space-y-1.5">
          <CardTitle
            id="cancel-dialog-title"
            className="text-lg font-bold text-zinc-900"
          >
            Xác nhận hủy lịch đặt sân #{booking.id}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed text-zinc-500">
            Bạn có chắc chắn muốn hủy đơn đặt sân này? Lưu ý chỉ có thể hủy
            trước giờ bắt đầu của khung giờ đã đặt.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

          <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-500">Sân &amp; Cụm sân:</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <strong className="text-zinc-900">{booking.courtName}</strong>
                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  {booking.complexName}
                </span>
              </span>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-500">Ngày &amp; Khung giờ:</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-sans font-bold tabular-nums text-zinc-900">
                  {formatShortDateVi(booking.bookingDate)}
                </span>
                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-sans font-bold tabular-nums text-amber-900">
                  {formatTimeShort(booking.startTime)} &ndash;{' '}
                  {formatTimeShort(booking.endTime)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Tổng tiền:</span>
              <span className="font-sans text-sm font-bold tabular-nums text-indigo-700">
                {formatCurrencyVnd(booking.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={handleConfirmCancel}
          >
            {submitting ? 'Đang hủy lịch...' : 'Xác nhận hủy đơn'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
