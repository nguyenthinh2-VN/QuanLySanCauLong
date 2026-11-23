import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaymentMethodBreakdownCard } from '@/components/report/PaymentMethodBreakdownCard';
import { DashboardRecentBookings } from '@/components/dashboard/DashboardRecentBookings';
import { getTodayIso } from '@/lib/booking';
import { getRevenueReport } from '@/lib/report';
import type { Role } from '@/types/auth';
import type { PaymentMethodBreakdownResponse } from '@/types/report';

export interface DashboardOverviewSectionProps {
  primaryRole: Role;
}

export function DashboardOverviewSection({
  primaryRole,
}: DashboardOverviewSectionProps) {
  const [breakdown, setBreakdown] = useState<PaymentMethodBreakdownResponse[]>([]);

  useEffect(() => {
    if (primaryRole !== 'ADMIN') return;

    let active = true;
    const today = getTodayIso();
    getRevenueReport({ from: today, to: today })
      .then((res) => {
        if (active) setBreakdown(res.byPaymentMethod ?? []);
      })
      .catch(() => {
        if (active) setBreakdown([]);
      });

    return () => {
      active = false;
    };
  }, [primaryRole]);

  if (primaryRole === 'ADMIN') {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentMethodBreakdownCard items={breakdown} />
        <DashboardRecentBookings primaryRole="ADMIN" />
      </div>
    );
  }

  if (primaryRole === 'STAFF') {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-zinc-900">
              Thao tác nghiệp vụ nhanh
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Các lối tắt tiện ích phục vụ công việc tại quầy và điều hành sân
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
              <Link to="/pos">
                <span className="text-xs font-bold text-zinc-900">Đặt sân tại quầy (POS)</span>
                <span className="text-[11px] text-zinc-500">Tạo đơn đặt trực tiếp cho khách</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
              <Link to="/check-in">
                <span className="text-xs font-bold text-zinc-900">Check-in khách đến</span>
                <span className="text-[11px] text-zinc-500">Xác nhận khách nhận sân</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
              <Link to="/bookings">
                <span className="text-xs font-bold text-zinc-900">Quản lý đặt sân</span>
                <span className="text-[11px] text-zinc-500">Bảng điều phối lịch trong ngày</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
              <Link to="/payments">
                <span className="text-xs font-bold text-zinc-900">Thanh toán &amp; Thu tiền</span>
                <span className="text-[11px] text-zinc-500">Thu tiền đơn chờ &amp; hoàn tiền</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
        <DashboardRecentBookings primaryRole="STAFF" />
      </div>
    );
  }

  // CUSTOMER
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900">
            Dịch vụ đặt sân cầu lông
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Chọn sân, khung giờ và trải nghiệm không gian thể thao chuyên nghiệp
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50">
            <Link to="/booking">
              <span className="text-xs font-bold text-indigo-950">Đặt sân trực tuyến</span>
              <span className="text-[11px] text-indigo-700">Xem lưới giờ &amp; chọn slot ngay</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
            <Link to="/recurring">
              <span className="text-xs font-bold text-zinc-900">Đặt lịch cố định</span>
              <span className="text-[11px] text-zinc-500">Giữ sân hàng tuần từ 2–12 tuần</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
            <Link to="/vouchers">
              <span className="text-xs font-bold text-zinc-900">Ưu đãi &amp; Voucher</span>
              <span className="text-[11px] text-zinc-500">Khám phá mã giảm giá hấp dẫn</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-16 flex-col items-start justify-center gap-1 p-3 text-left">
            <Link to="/my-bookings">
              <span className="text-xs font-bold text-zinc-900">Lịch đặt của tôi</span>
              <span className="text-[11px] text-zinc-500">Tra cứu lịch sử &amp; thanh toán</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
      <DashboardRecentBookings primaryRole="CUSTOMER" />
    </div>
  );
}
