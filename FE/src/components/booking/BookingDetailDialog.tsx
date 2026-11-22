import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  canCheckIn,
  formatBookingCustomerSummary,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
  isBookingActionable,
} from '@/lib/booking';
import type { BookingResponse } from '@/types/booking';

export interface BookingDetailDialogProps {
  open: boolean;
  booking: BookingResponse | null;
  loading: boolean;
  onClose: () => void;
  onCheckIn: (booking: BookingResponse) => void;
  onReschedule?: (booking: BookingResponse) => void;
  onCancel?: (booking: BookingResponse) => void;
  isAdmin: boolean;
}

const BADGE_CLASS: Record<string, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  zinc: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  destructive: 'border-red-200 bg-red-50 text-red-700',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <span className="text-zinc-500">{label}:</span>
      <span className="text-right font-medium text-zinc-900">{children}</span>
    </div>
  );
}

export function BookingDetailDialog({
  open,
  booking,
  loading,
  onClose,
  onCheckIn,
  onReschedule,
  onCancel,
  isAdmin,
}: BookingDetailDialogProps) {
  if (!open) return null;

  const meta = booking ? getBookingStatusMeta(booking.status) : null;
  const badgeCls = meta ? (BADGE_CLASS[meta.badgeVariant] ?? BADGE_CLASS.zinc) : '';
  const customer = booking ? formatBookingCustomerSummary(booking) : null;
  const checkInState = booking ? canCheckIn(booking) : { allowed: false };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-dialog-title"
    >
      <Card className="w-full max-w-lg border-t-4 border-t-indigo-600 bg-white shadow-xl">
        <CardHeader className="border-b border-zinc-100 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle
              id="detail-dialog-title"
              className="text-base font-bold text-zinc-900"
            >
              {loading ? 'Đang tải...' : booking ? `Chi tiết đơn #${booking.id}` : 'Không tìm thấy đơn'}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 text-xs">
          {loading && (
            <div className="py-6 text-center text-sm text-zinc-400">Đang tải thông tin đơn...</div>
          )}

          {!loading && !booking && (
            <div className="py-6 text-center text-sm text-zinc-500">
              Không tìm thấy thông tin đơn đặt sân.
            </div>
          )}

          {!loading && booking && customer && meta && (
            <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              {/* Trạng thái */}
              <Row label="Trạng thái">
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold ${badgeCls}`}
                >
                  {meta.label}
                </span>
              </Row>
              <Separator />

              {/* Khách */}
              <Row label="Khách">
                <span className="text-right">
                  <span className="block">{customer.primaryText}</span>
                  {customer.secondaryText && (
                    <span className="block text-zinc-500">{customer.secondaryText}</span>
                  )}
                </span>
              </Row>
              <Separator />

              {/* Cụm / Sân */}
              <Row label="Cụm sân">{booking.complexName}</Row>
              <Row label="Sân">{booking.courtName}</Row>
              <Separator />

              {/* Ngày / Giờ */}
              <Row label="Ngày đặt">
                <span className="font-sans tabular-nums">{formatShortDateVi(booking.bookingDate)}</span>
              </Row>
              <Row label="Khung giờ">
                <span className="font-sans tabular-nums">
                  {formatTimeShort(booking.startTime)} – {formatTimeShort(booking.endTime)}
                </span>
              </Row>
              <Separator />

              {/* Tiền */}
              <Row label="Tổng tiền">
                <span className="font-sans font-bold tabular-nums text-indigo-700">
                  {formatCurrencyVnd(booking.totalAmount)}
                </span>
              </Row>

              {/* Ghi chú */}
              {booking.note && (
                <>
                  <Separator />
                  <Row label="Ghi chú">{booking.note}</Row>
                </>
              )}
              <Separator />

              {/* Timestamps */}
              <Row label="Tạo lúc">
                <span className="font-sans tabular-nums text-zinc-500">
                  {new Date(booking.createdAt).toLocaleString('vi-VN')}
                </span>
              </Row>
              <Row label="Cập nhật">
                <span className="font-sans tabular-nums text-zinc-500">
                  {new Date(booking.updatedAt).toLocaleString('vi-VN')}
                </span>
              </Row>
            </div>
          )}
        </CardContent>

        {!loading && booking && (
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3">
            {/* Check-in */}
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <Button
                type="button"
                size="sm"
                disabled={!checkInState.allowed}
                title={checkInState.reason}
                onClick={() => onCheckIn(booking)}
              >
                Check-in
              </Button>
            )}

            {/* Đổi lịch: ADMIN only */}
            {isAdmin && isBookingActionable(booking.status) && onReschedule && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReschedule(booking)}
              >
                Đổi lịch
              </Button>
            )}

            {/* Hủy: ADMIN only */}
            {isAdmin && isBookingActionable(booking.status) && onCancel && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onCancel(booking)}
              >
                Hủy đơn
              </Button>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
