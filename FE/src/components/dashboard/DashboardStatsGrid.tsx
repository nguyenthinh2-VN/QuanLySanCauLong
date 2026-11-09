import { useEffect, useState } from 'react';
import {
  DashboardStatCard,
  type StatCardItem,
} from '@/components/dashboard/DashboardStatCard';
import type { Role } from '@/types/auth';
import { fetchMyBookings, getTodayIso } from '@/lib/booking';

const STATS_BY_ROLE: Record<Role, StatCardItem[]> = {
  ADMIN: [
    {
      label: 'Doanh thu hôm nay',
      value: '14.850.000',
      unit: '₫',
      subtext: 'Dữ liệu minh họa tĩnh — Phase 1',
      badgeText: '+12.4%',
      badgeVariant: 'zinc',
      accentBarClass: 'bg-zinc-900',
    },
    {
      label: 'Tỷ lệ lấp đầy sân',
      value: '78.5',
      unit: '%',
      subtext: '63 / 80 khung giờ hoạt động',
      badgeText: 'Cao điểm 17h–21h',
      badgeVariant: 'sky',
      accentBarClass: 'bg-amber-500',
    },
    {
      label: 'Tổng lượt đặt sân',
      value: '42',
      unit: 'lượt đặt',
      subtext: '36 hoàn tất · 6 chờ check-in',
      badgeText: 'Hôm nay',
      badgeVariant: 'indigo',
      accentBarClass: 'bg-indigo-500',
    },
    {
      label: 'Sân đang hoạt động',
      value: '08 / 08',
      unit: 'sân',
      subtext: '0 sân đang bảo trì',
      badgeText: '100% sẵn sàng',
      badgeVariant: 'amber',
      accentBarClass: 'bg-amber-500',
    },
  ],
  STAFF: [
    {
      label: 'Ca trực hiện tại',
      value: 'Ca Chiều',
      subtext: 'Khung giờ 14:00 – 22:00',
      badgeText: 'Đang mở quầy',
      badgeVariant: 'zinc',
      accentBarClass: 'bg-zinc-900',
    },
    {
      label: 'Khách chờ Check-in',
      value: '06',
      unit: 'lịch đặt',
      subtext: 'Trong vòng 60 phút tới',
      badgeText: 'Cần xác nhận',
      badgeVariant: 'sky',
      accentBarClass: 'bg-amber-500',
    },
    {
      label: 'Đơn POS tại quầy',
      value: '18',
      unit: 'đơn hàng',
      subtext: 'Nước uống, cầu lông & phụ kiện',
      badgeText: 'Trong ca',
      badgeVariant: 'indigo',
      accentBarClass: 'bg-indigo-500',
    },
    {
      label: 'Thanh toán chờ xử lý',
      value: '02',
      unit: 'giao dịch',
      subtext: 'Chờ quét QR chuyển khoản',
      badgeText: 'Ưu tiên',
      badgeVariant: 'amber',
      accentBarClass: 'bg-amber-500',
    },
  ],
  CUSTOMER: [
    {
      label: 'Lịch đặt sắp tới',
      value: '--',
      unit: 'lịch đặt',
      subtext: 'Đang tải...',
      badgeText: 'Trực tuyến',
      badgeVariant: 'zinc',
      accentBarClass: 'bg-zinc-900',
    },
    {
      label: 'Đã hoàn thành',
      value: '--',
      unit: 'lượt đặt',
      subtext: 'Đang tải...',
      badgeText: 'Hoàn thành',
      badgeVariant: 'sky',
      accentBarClass: 'bg-amber-500',
    },
    {
      label: 'Voucher khả dụng',
      value: '03',
      unit: 'mã ưu đãi',
      subtext: 'Giảm tối đa 50.000 ₫ / lượt đặt',
      badgeText: 'Sẵn sàng áp dụng',
      badgeVariant: 'indigo',
      accentBarClass: 'bg-indigo-500',
    },
    {
      label: 'Khung giờ trống hôm nay',
      value: '17',
      unit: 'khung giờ',
      subtext: 'Cập nhật theo thời gian thực ở Phase sau',
      badgeText: 'Đặt ngay',
      badgeVariant: 'amber',
      accentBarClass: 'bg-amber-500',
    },
  ],
};

export interface DashboardStatsGridProps {
  primaryRole: Role;
}

export function DashboardStatsGrid({ primaryRole }: DashboardStatsGridProps) {
  const [customerStats, setCustomerStats] = useState<{
    upcoming: number | null;
    completed: number | null;
  }>({ upcoming: null, completed: null });

  useEffect(() => {
    if (primaryRole !== 'CUSTOMER') return;

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const todayStr = getTodayIso();
        const [upcomingRes, completedRes] = await Promise.all([
          fetchMyBookings({ fromDate: todayStr, size: 1 }).catch(() => null),
          fetchMyBookings({ status: 'COMPLETED', size: 1 }).catch(() => null),
        ]);

        if (isMounted) {
          setCustomerStats({
            upcoming: upcomingRes?.totalElements ?? 0,
            completed: completedRes?.totalElements ?? 0,
          });
        }
      } catch {
        if (isMounted) {
          setCustomerStats({ upcoming: 0, completed: 0 });
        }
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [primaryRole]);

  let statCards = STATS_BY_ROLE[primaryRole];

  if (primaryRole === 'CUSTOMER') {
    statCards = [
      {
        ...statCards[0],
        value:
          customerStats.upcoming !== null
            ? String(customerStats.upcoming).padStart(2, '0')
            : '--',
        subtext:
          customerStats.upcoming !== null
            ? 'Từ hôm nay trở đi'
            : 'Đang tải số liệu...',
      },
      {
        ...statCards[1],
        value:
          customerStats.completed !== null
            ? String(customerStats.completed).padStart(2, '0')
            : '--',
        subtext:
          customerStats.completed !== null
            ? 'Tổng số lịch đặt đã hoàn tất'
            : 'Đang tải số liệu...',
      },
      statCards[2],
      statCards[3],
    ];
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => (
        <DashboardStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
