import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatBookingCustomerSummary,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
  getTodayIso,
  isBookingActionable,
} from '@/lib/booking';
import type { BookingResponse, BookingStatus } from '@/types/booking';

export interface StaffBookingsTableProps {
  bookings: BookingResponse[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onViewDetail: (booking: BookingResponse) => void;
  onCheckIn: (booking: BookingResponse) => void;
  onReschedule?: (booking: BookingResponse) => void;
  onCancel?: (booking: BookingResponse) => void;
  isAdmin: boolean;
}

function canCheckIn(booking: BookingResponse): { allowed: boolean; reason?: string } {
  const status: BookingStatus = booking.status;
  if (status !== 'PENDING' && status !== 'CONFIRMED') {
    return { allowed: false, reason: 'Chỉ check-in đơn PENDING hoặc CONFIRMED' };
  }
  const today = getTodayIso();
  if (booking.bookingDate !== today) {
    return { allowed: false, reason: 'Chỉ check-in đơn của ngày hôm nay' };
  }
  // Check endTime vs current time
  const now = new Date();
  const [endH, endM] = booking.endTime.split(':').map(Number);
  const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes >= endMinutes) {
    return { allowed: false, reason: 'Đã qua khung giờ, không thể check-in' };
  }
  return { allowed: true };
}

const BADGE_CLASS: Record<string, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  zinc: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  destructive: 'border-red-200 bg-red-50 text-red-700',
};

function StatusBadge({ status }: { status: BookingResponse['status'] }) {
  const meta = getBookingStatusMeta(status);
  const cls = BADGE_CLASS[meta.badgeVariant] ?? BADGE_CLASS.zinc;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-sans text-[11px] font-semibold ${cls}`}
    >
      {meta.label}
    </span>
  );
}

export function StaffBookingsTable({
  bookings,
  loading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
  onCheckIn,
  onReschedule,
  onCancel,
  isAdmin,
}: StaffBookingsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-10 text-center text-sm text-zinc-500">
        Không có đơn đặt sân nào phù hợp với bộ lọc.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                #Đơn
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                Khách
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                Cụm / Sân
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                Ngày
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                Khung giờ
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-zinc-500">
                Trạng thái
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-zinc-500">
                Tổng tiền
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-zinc-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {bookings.map((b) => {
              const customer = formatBookingCustomerSummary(b);
              const checkInState = canCheckIn(b);
              return (
                <tr
                  key={b.id}
                  className="transition-colors hover:bg-zinc-50/60"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-zinc-700">
                    #{b.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="max-w-[140px]">
                      <div className="truncate font-medium text-zinc-800">
                        {customer.primaryText}
                      </div>
                      {customer.secondaryText && (
                        <div className="truncate text-zinc-400">
                          {customer.secondaryText}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-zinc-800">{b.courtName}</div>
                    <div className="text-zinc-400">{b.complexName}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-sans tabular-nums text-zinc-700">
                    {formatShortDateVi(b.bookingDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-sans tabular-nums text-zinc-700">
                    {formatTimeShort(b.startTime)}–{formatTimeShort(b.endTime)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-sans font-semibold tabular-nums text-indigo-700">
                    {formatCurrencyVnd(b.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onViewDetail(b)}
                      >
                        Chi tiết
                      </Button>

                      {/* Check-in: show for PENDING/CONFIRMED, enable only if conditions met */}
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={!checkInState.allowed}
                          title={checkInState.reason}
                          onClick={() => onCheckIn(b)}
                        >
                          Check-in
                        </Button>
                      )}

                      {/* Đổi lịch: ADMIN only, actionable statuses */}
                      {isAdmin && isBookingActionable(b.status) && onReschedule && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onReschedule(b)}
                        >
                          Đổi lịch
                        </Button>
                      )}

                      {/* Hủy: ADMIN only, actionable statuses */}
                      {isAdmin && isBookingActionable(b.status) && onCancel && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onCancel(b)}
                        >
                          Hủy
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Tổng <strong className="text-zinc-900">{totalElements}</strong> đơn
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              ← Trước
            </Button>
            <span className="font-mono tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Tiếp →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
