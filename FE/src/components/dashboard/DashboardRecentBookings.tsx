import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  fetchBookings,
  fetchMyBookings,
  formatBookingCustomerSummary,
  formatCurrencyVnd,
  formatTimeShort,
  getBookingStatusMeta,
  getTodayIso,
} from '@/lib/booking';
import type { Role } from '@/types/auth';
import type { BookingResponse } from '@/types/booking';

export interface DashboardRecentBookingsProps {
  primaryRole: Role;
}

const BADGE_CLASS: Record<string, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  zinc: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  destructive: 'border-red-200 bg-red-50 text-red-700',
};

export function DashboardRecentBookings({
  primaryRole,
}: DashboardRecentBookingsProps) {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const isCustomer = primaryRole === 'CUSTOMER';
  const targetLink = isCustomer ? '/my-bookings' : '/bookings';
  const title = isCustomer ? 'Lịch đặt gần đây của bạn' : 'Đơn đặt sân mới nhất hôm nay';
  const description = isCustomer
    ? '5 đơn đặt sân mới nhất của tài khoản'
    : '5 đơn đặt sân phát sinh mới nhất trong ngày';

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const todayStr = getTodayIso();
        if (isCustomer) {
          const res = await fetchMyBookings({ size: 5, sort: 'createdAt,desc' });
          if (active) setBookings(res.items);
        } else {
          const res = await fetchBookings({
            bookingDate: todayStr,
            size: 5,
            sort: 'createdAt,desc',
          });
          if (active) setBookings(res.items);
        }
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [isCustomer]);

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-zinc-900">
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            {description}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-zinc-600 hover:text-zinc-900">
          <Link to={targetLink}>Xem tất cả &rarr;</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center text-xs text-zinc-400">
            {isCustomer
              ? 'Bạn chưa có đơn đặt sân nào gần đây.'
              : 'Chưa có đơn đặt sân nào phát sinh trong ngày hôm nay.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-100 text-zinc-400">
                <tr>
                  <th className="pb-2 text-left font-medium">#Đơn</th>
                  {!isCustomer && <th className="pb-2 text-left font-medium">Khách</th>}
                  <th className="pb-2 text-left font-medium">Sân</th>
                  <th className="pb-2 text-left font-medium">Khung giờ</th>
                  <th className="pb-2 text-left font-medium">Trạng thái</th>
                  <th className="pb-2 text-right font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {bookings.map((b) => {
                  const meta = getBookingStatusMeta(b.status);
                  const badgeCls = BADGE_CLASS[meta.badgeVariant] ?? BADGE_CLASS.zinc;
                  const customer = formatBookingCustomerSummary(b);
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 font-mono font-bold text-zinc-700">#{b.id}</td>
                      {!isCustomer && (
                        <td className="max-w-[120px] truncate py-2.5 text-zinc-800">
                          {customer.primaryText}
                        </td>
                      )}
                      <td className="py-2.5">
                        <span className="font-medium text-zinc-800">{b.courtName}</span>
                      </td>
                      <td className="py-2.5 font-sans tabular-nums text-zinc-600">
                        {formatTimeShort(b.startTime)}–{formatTimeShort(b.endTime)}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" className={`text-[10px] ${badgeCls}`}>
                          {meta.label.split(' ')[0]}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right font-sans font-semibold tabular-nums text-zinc-800">
                        {formatCurrencyVnd(b.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
