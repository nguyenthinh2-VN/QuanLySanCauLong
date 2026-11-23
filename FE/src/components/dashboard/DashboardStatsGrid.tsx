import { useEffect, useState } from 'react';
import {
  DashboardStatCard,
  type StatCardItem,
} from '@/components/dashboard/DashboardStatCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchBookings,
  fetchMyBookings,
  getTodayIso,
} from '@/lib/booking';
import { getCourts } from '@/lib/court';
import { getOccupancyReport, getRevenueReport } from '@/lib/report';
import { getActiveVouchers } from '@/lib/voucher';
import type { Role } from '@/types/auth';

export interface DashboardStatsGridProps {
  primaryRole: Role;
}

export function DashboardStatsGrid({ primaryRole }: DashboardStatsGridProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCardItem[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadStats = async () => {
      const todayStr = getTodayIso();

      try {
        if (primaryRole === 'ADMIN') {
          const [revRes, occRes, bookRes, courtRes] = await Promise.all([
            getRevenueReport({ from: todayStr, to: todayStr }).catch(() => null),
            getOccupancyReport({ from: todayStr, to: todayStr }).catch(() => null),
            fetchBookings({ bookingDate: todayStr, size: 1 }).catch(() => null),
            getCourts({ size: 100 }).catch(() => null),
          ]);

          if (!active) return;

          const netRevenue = revRes?.totals?.netRevenue ?? 0;
          const txCount = revRes?.totals?.transactionCount ?? 0;
          const occRate = occRes?.overallRate ?? 0;
          const bookedSlots = occRes?.bookedSlots ?? 0;
          const totalSlots = occRes?.totalSlots ?? 0;
          const totalBookings = bookRes?.totalElements ?? 0;
          const courtList = courtRes?.items ?? [];
          const totalCourts = courtList.length;
          const activeCourts = courtList.filter((c) => c.status === 'AVAILABLE').length;

          setStats([
            {
              label: 'Doanh thu hôm nay',
              value: new Intl.NumberFormat('vi-VN').format(netRevenue),
              unit: '₫',
              subtext: `${txCount} giao dịch thành công`,
              badgeText: 'Hôm nay',
              badgeVariant: 'zinc',
              accentBarClass: 'bg-zinc-900',
            },
            {
              label: 'Tỷ lệ lấp đầy sân',
              value: occRate.toFixed(1),
              unit: '%',
              subtext: `${bookedSlots} / ${totalSlots} khung giờ hoạt động`,
              badgeText: 'Công suất',
              badgeVariant: 'sky',
              accentBarClass: 'bg-amber-500',
            },
            {
              label: 'Tổng lượt đặt sân',
              value: String(totalBookings),
              unit: 'lượt đặt',
              subtext: 'Lịch đặt trong ngày hôm nay',
              badgeText: 'Hôm nay',
              badgeVariant: 'indigo',
              accentBarClass: 'bg-indigo-500',
            },
            {
              label: 'Sân đang hoạt động',
              value: `${String(activeCourts).padStart(2, '0')} / ${String(totalCourts).padStart(2, '0')}`,
              unit: 'sân',
              subtext: `${totalCourts - activeCourts} sân đang bảo trì`,
              badgeText: activeCourts === totalCourts && totalCourts > 0 ? '100% sẵn sàng' : 'Khả dụng',
              badgeVariant: 'amber',
              accentBarClass: 'bg-amber-500',
            },
          ]);
        } else if (primaryRole === 'STAFF') {
          const [bookRes, confRes, inRes, courtRes] = await Promise.all([
            fetchBookings({ bookingDate: todayStr, size: 1 }).catch(() => null),
            fetchBookings({ bookingDate: todayStr, status: 'CONFIRMED', size: 1 }).catch(() => null),
            fetchBookings({ bookingDate: todayStr, status: 'CHECKED_IN', size: 1 }).catch(() => null),
            getCourts({ size: 100 }).catch(() => null),
          ]);

          if (!active) return;

          const totalBookings = bookRes?.totalElements ?? 0;
          const confirmedCount = confRes?.totalElements ?? 0;
          const checkedInCount = inRes?.totalElements ?? 0;
          const courtList = courtRes?.items ?? [];
          const totalCourts = courtList.length;
          const activeCourts = courtList.filter((c) => c.status === 'AVAILABLE').length;

          setStats([
            {
              label: 'Tổng lượt đặt hôm nay',
              value: String(totalBookings),
              unit: 'lịch đặt',
              subtext: 'Toàn bộ đơn trong ngày hôm nay',
              badgeText: 'Hôm nay',
              badgeVariant: 'zinc',
              accentBarClass: 'bg-zinc-900',
            },
            {
              label: 'Khách chờ Check-in',
              value: String(confirmedCount).padStart(2, '0'),
              unit: 'đơn',
              subtext: 'Đã xác nhận & chờ nhận sân',
              badgeText: 'Cần đón khách',
              badgeVariant: 'sky',
              accentBarClass: 'bg-amber-500',
            },
            {
              label: 'Đang sử dụng sân',
              value: String(checkedInCount).padStart(2, '0'),
              unit: 'đơn',
              subtext: 'Khách đang chơi trên sân',
              badgeText: 'Đang chơi',
              badgeVariant: 'indigo',
              accentBarClass: 'bg-indigo-500',
            },
            {
              label: 'Sân đang hoạt động',
              value: `${String(activeCourts).padStart(2, '0')} / ${String(totalCourts).padStart(2, '0')}`,
              unit: 'sân',
              subtext: `${totalCourts - activeCourts} sân đang bảo trì`,
              badgeText: 'Khả dụng',
              badgeVariant: 'amber',
              accentBarClass: 'bg-amber-500',
            },
          ]);
        } else {
          // CUSTOMER
          const [upcomingRes, completedRes, voucherRes] = await Promise.all([
            fetchMyBookings({ fromDate: todayStr, size: 1 }).catch(() => null),
            fetchMyBookings({ status: 'COMPLETED', size: 1 }).catch(() => null),
            getActiveVouchers({ size: 1 }).catch(() => null),
          ]);

          if (!active) return;

          const upcomingCount = upcomingRes?.totalElements ?? 0;
          const completedCount = completedRes?.totalElements ?? 0;
          const voucherCount = voucherRes?.totalElements ?? 0;

          setStats([
            {
              label: 'Lịch đặt sắp tới',
              value: String(upcomingCount).padStart(2, '0'),
              unit: 'lịch đặt',
              subtext: 'Từ hôm nay trở đi',
              badgeText: 'Trực tuyến',
              badgeVariant: 'zinc',
              accentBarClass: 'bg-zinc-900',
            },
            {
              label: 'Đã hoàn thành',
              value: String(completedCount).padStart(2, '0'),
              unit: 'lượt đặt',
              subtext: 'Tổng số lịch đặt đã hoàn tất',
              badgeText: 'Hoàn thành',
              badgeVariant: 'sky',
              accentBarClass: 'bg-amber-500',
            },
            {
              label: 'Voucher khả dụng',
              value: String(voucherCount).padStart(2, '0'),
              unit: 'mã ưu đãi',
              subtext: 'Sẵn sàng áp dụng cho đơn mới',
              badgeText: 'Ưu đãi',
              badgeVariant: 'indigo',
              accentBarClass: 'bg-indigo-500',
            },
            {
              label: 'Đặt sân trực tuyến',
              value: 'Đặt ngay',
              subtext: 'Lưới giờ cập nhật theo thời gian thực',
              badgeText: 'Mở 24/7',
              badgeVariant: 'amber',
              accentBarClass: 'bg-amber-500',
            },
          ]);
        }
      } catch {
        if (active) setStats([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStats();

    return () => {
      active = false;
    };
  }, [primaryRole]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
