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
import {
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
} from '@/lib/booking';
import type { RecurringBookingResponse } from '@/types/booking';

export interface RecurringSuccessCardProps {
  response: RecurringBookingResponse;
  onBookAnother: () => void;
}

export function RecurringSuccessCard({
  response,
  onBookAnother,
}: RecurringSuccessCardProps) {
  const { createdCount, bookings } = response;
  const firstBooking = bookings[0];

  const totalAllBookings = bookings.reduce(
    (acc, b) => acc + (b.totalAmount || 0),
    0
  );

  return (
    <Card className="mx-auto max-w-3xl border-t-4 border-t-emerald-600 bg-white shadow-sm">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
          >
            Tạo chuỗi thành công
          </Badge>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
            Tổng cộng: {createdCount} đơn đặt sân
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-zinc-900">
          Đã tạo thành công {createdCount} đơn đặt sân cố định
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          {firstBooking?.courtName} ({firstBooking?.complexName}) •{' '}
          {firstBooking?.timeSlotName} (
          {formatTimeShort(firstBooking?.startTime)} -{' '}
          {formatTimeShort(firstBooking?.endTime)})
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <AuthAlert variant="success">
          Toàn bộ {createdCount} buổi đặt sân đã được hệ thống ghi nhận thành công ở trạng thái PENDING.
        </AuthAlert>

        {/* Danh sách các đơn đã tạo */}
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2.5">STT</th>
                <th className="px-3 py-2.5">Mã đơn</th>
                <th className="px-3 py-2.5">Ngày thi đấu</th>
                <th className="px-3 py-2.5">Khung giờ</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {bookings.map((b, index) => (
                <tr key={b.id} className="hover:bg-zinc-50/50">
                  <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-zinc-900">
                    #{b.id}
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-800">
                    {formatShortDateVi(b.bookingDate)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-600">
                    {formatTimeShort(b.startTime)} - {formatTimeShort(b.endTime)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700 font-semibold"
                    >
                      PENDING
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-900">
                    {formatCurrencyVnd(b.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-zinc-200 bg-zinc-50/50 font-semibold text-zinc-900">
              <tr>
                <td colSpan={5} className="px-3 py-2.5 text-right">
                  Tổng tiền cả chuỗi ({createdCount} buổi):
                </td>
                <td className="px-3 py-2.5 text-right text-sm text-zinc-950 font-bold">
                  {formatCurrencyVnd(totalAllBookings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cảnh báo thanh toán riêng */}
        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Quy tắc thanh toán &amp; quản lý đơn:</p>
          <p className="text-amber-800">
            Mỗi đơn đặt sân trong chuỗi là <strong>hoàn toàn độc lập</strong>. Quý khách vui lòng vào mục <em>"Lịch đặt của tôi"</em> để thực hiện thanh toán (hoặc đặt cọc) riêng cho từng đơn. Hủy một đơn bất kỳ sẽ không làm ảnh hưởng tới các ngày còn lại.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBookAnother}
          className="h-8 text-xs"
        >
          Đặt chuỗi khác
        </Button>
        <Button
          asChild
          size="sm"
          className="h-8 bg-zinc-900 text-xs text-zinc-50 hover:bg-zinc-800"
        >
          <Link to="/my-bookings">Xem lịch đặt của tôi &rarr;</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
