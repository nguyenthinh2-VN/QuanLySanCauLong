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
  formatBookingCustomerSummary,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
} from '@/lib/booking';
import type { BookingResponse } from '@/types/booking';

export interface PosBookingSuccessCardProps {
  booking: BookingResponse;
  onBookAnother: () => void;
}

export function PosBookingSuccessCard({
  booking,
  onBookAnother,
}: PosBookingSuccessCardProps) {
  const statusMeta = getBookingStatusMeta(booking.status);
  const customerInfo = formatBookingCustomerSummary(booking);

  return (
    <Card className="mx-auto max-w-2xl border-t-4 border-t-zinc-900 bg-white shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="sky" className="font-semibold">
            Đặt sân tại quầy thành công
          </Badge>
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-zinc-900">
            Mã đơn: #{booking.id}
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-zinc-900">
          Phiếu đặt sân tại quầy (POS) đã được xác nhận
        </CardTitle>
        <CardDescription className="text-sm text-zinc-600">
          Đơn đặt tại quầy được khởi tạo ngay ở trạng thái{' '}
          <span className="font-semibold text-zinc-900">
            {booking.status} (Đã xác nhận)
          </span>
          .
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AuthAlert variant="success">
          Đã tạo đơn đặt sân tại quầy #{booking.id} thành công! Trạng thái đơn:{' '}
          <strong>{booking.status}</strong>.
        </AuthAlert>

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Mã đơn đặt sân
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-zinc-900">
              #{booking.id}
            </span>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Khách hàng
            </span>
            <div className="flex flex-wrap items-center gap-2 text-right">
              <Badge variant="zinc">{customerInfo.typeLabel}</Badge>
              <span className="font-bold text-zinc-900">
                {customerInfo.primaryText}
              </span>
              {customerInfo.secondaryText && (
                <span className="text-xs font-medium text-zinc-600">
                  ({customerInfo.secondaryText})
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Sân &amp; Cụm sân
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-zinc-900">
                {booking.courtName}
              </span>
              <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
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
              <span className="text-xs font-medium text-zinc-500">Ghi chú</span>
              <span className="text-xs text-zinc-700">{booking.note}</span>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-800">
              Tổng tiền đơn đặt sân
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-zinc-900">
              {formatCurrencyVnd(booking.totalAmount)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4">
        <Button type="button" variant="outline" asChild>
          <Link to="/check-in">Sang màn hình Check-in</Link>
        </Button>
        <Button type="button" onClick={onBookAnother}>
          Đặt đơn khác
        </Button>
      </CardFooter>
    </Card>
  );
}

