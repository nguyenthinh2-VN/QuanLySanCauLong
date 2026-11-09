import { Link } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
  isBookingActionable,
} from '@/lib/booking';
import type { BookingResponse, PageResponse } from '@/types/booking';

export interface MyBookingsTableProps {
  pageData: PageResponse<BookingResponse> | null;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onPageChange: (newPage: number) => void;
  onOpenCancel: (booking: BookingResponse) => void;
  onOpenReschedule: (booking: BookingResponse) => void;
}

export function MyBookingsTable({
  pageData,
  loading,
  errorMessage,
  onRetry,
  onPageChange,
  onOpenCancel,
  onOpenReschedule,
}: MyBookingsTableProps) {
  if (loading) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-1.5 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="space-y-4 p-6">
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Thử tải lại danh sách
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = pageData?.items ?? [];

  if (items.length === 0) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 stroke-current stroke-[1.75]"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-base font-semibold text-zinc-900">
            Chưa có lịch đặt sân nào
          </p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
            Bạn chưa có đơn đặt sân nào khớp với điều kiện tra cứu hiện tại. Hãy
            chọn ngày và đặt ngay khung giờ trống phù hợp với bạn.
          </p>
          <div className="mt-4">
            <Button asChild size="sm">
              <Link to="/booking">Đặt sân trực tuyến ngay</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPage = pageData?.page ?? 0;
  const totalPages = Math.max(pageData?.totalPages ?? 1, 1);
  const totalElements = pageData?.totalElements ?? items.length;

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="flex flex-col gap-2 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-bold text-zinc-900">
            Danh sách lịch đặt của tôi
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Tổng cộng{' '}
            <strong className="font-semibold tabular-nums text-zinc-900">
              {totalElements}
            </strong>{' '}
            đơn đặt sân &middot; Trang {currentPage + 1} / {totalPages}
          </CardDescription>
        </div>
        <Button asChild size="sm">
          <Link to="/booking">+ Đặt sân mới</Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table View (>= md) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Sân &amp; Cụm sân</th>
                <th className="px-4 py-3">Ngày đặt</th>
                <th className="px-4 py-3">Khung giờ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((booking) => {
                const statusMeta = getBookingStatusMeta(booking.status);
                const actionable = isBookingActionable(booking.status);

                return (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-zinc-50/70"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-sans text-xs font-bold tabular-nums text-zinc-900">
                      #{booking.id}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-zinc-900">
                        {booking.courtName}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {booking.complexName}
                      </span>
                      {booking.note && (
                        <p className="mt-1 max-w-xs truncate text-[11px] italic text-zinc-500">
                          Ghi chú: {booking.note}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-zinc-900">
                        {formatShortDateVi(booking.bookingDate)}
                      </span>
                      <div className="mt-0.5 font-sans text-[11px] tabular-nums text-zinc-400">
                        {booking.bookingDate}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-amber-900">
                        {formatTimeShort(booking.startTime)} &ndash;{' '}
                        {formatTimeShort(booking.endTime)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge variant={statusMeta.badgeVariant}>
                        {statusMeta.label}
                      </Badge>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-sans text-sm font-bold tabular-nums text-indigo-700">
                      {formatCurrencyVnd(booking.totalAmount)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      {actionable ? (
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenReschedule(booking)}
                          >
                            Đổi lịch
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onOpenCancel(booking)}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="divide-y divide-zinc-100 md:hidden">
          {items.map((booking) => {
            const statusMeta = getBookingStatusMeta(booking.status);
            const actionable = isBookingActionable(booking.status);

            return (
              <div key={booking.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-bold tabular-nums text-zinc-900">
                    Đơn #{booking.id}
                  </span>
                  <Badge variant={statusMeta.badgeVariant}>
                    {statusMeta.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {booking.courtName}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {booking.complexName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-sans font-bold tabular-nums text-zinc-900">
                    Ngày: {formatShortDateVi(booking.bookingDate)}
                  </span>
                  <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-sans font-bold tabular-nums text-amber-900">
                    Giờ: {formatTimeShort(booking.startTime)} &ndash;{' '}
                    {formatTimeShort(booking.endTime)}
                  </span>
                </div>

                {booking.note && (
                  <p className="text-xs italic text-zinc-500">
                    Ghi chú: {booking.note}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Tổng tiền
                  </span>
                  <span className="font-sans text-sm font-bold tabular-nums text-indigo-700">
                    {formatCurrencyVnd(booking.totalAmount)}
                  </span>
                </div>

                {actionable && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenReschedule(booking)}
                    >
                      Đổi lịch
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenCancel(booking)}
                    >
                      Hủy đơn
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3.5 text-xs text-zinc-600">
          <span>
            Hiển thị <strong className="tabular-nums">{items.length}</strong> /{' '}
            <strong className="tabular-nums">{totalElements}</strong> đơn đặt sân
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageData?.first ?? true}
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            >
              &larr; Trước
            </Button>
            <span className="px-2 font-sans font-semibold tabular-nums text-zinc-800">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageData?.last ?? true}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sau &rarr;
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
