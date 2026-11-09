import { Link } from 'react-router-dom';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
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
import {
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
} from '@/lib/booking';
import type { BookingResponse } from '@/types/booking';

export interface BookingSuccessCardProps {
  booking: BookingResponse;
  onBookAnother: () => void;
}

export function BookingSuccessCard({
  booking,
  onBookAnother,
}: BookingSuccessCardProps) {
  const statusMeta = getBookingStatusMeta(booking.status);

  return (
    <Card className="mx-auto max-w-2xl border-t-4 border-t-amber-600 bg-white shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="amber" className="font-semibold">
            Đặt sân thành công
          </Badge>
          <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-sans text-xs font-bold tabular-nums text-indigo-700">
            Mã booking: #{booking.id}
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-zinc-900">
          Đơn đặt sân đã được ghi nhận
        </CardTitle>
        <CardDescription className="text-sm text-zinc-600">
          Đơn đặt sân của bạn hiện ở trạng thái{' '}
          <span className="font-semibold text-amber-700">
            {booking.status} (đơn đang chờ thanh toán)
          </span>
          .
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AuthAlert variant="success">
          Đặt sân thành công! Đơn đặt sân #{booking.id} đang chờ thanh toán.
        </AuthAlert>

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Mã đơn đặt sân
            </span>
            <span className="font-sans text-sm font-bold tabular-nums text-zinc-900">
              #{booking.id}
            </span>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Sân &amp; Cụm sân
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-zinc-900">
                {booking.courtName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {booking.complexName}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Ngày &amp; Khung giờ
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-zinc-900">
                {formatShortDateVi(booking.bookingDate)} ({booking.bookingDate})
              </span>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-amber-900">
                {formatTimeShort(booking.startTime)} &ndash;{' '}
                {formatTimeShort(booking.endTime)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Trạng thái đơn
            </span>
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
          </div>

          {booking.note && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500">
                Ghi chú
              </span>
              <span className="text-xs text-zinc-700">{booking.note}</span>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-950">
              Tổng tiền cần thanh toán
            </span>
            <span className="font-sans text-lg font-bold tabular-nums text-amber-800">
              {formatCurrencyVnd(booking.totalAmount)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4">
        <Button type="button" variant="outline" onClick={onBookAnother}>
          Đặt thêm khung giờ khác
        </Button>
        <Button asChild>
          <Link to="/my-bookings">Xem lịch đặt của tôi</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
