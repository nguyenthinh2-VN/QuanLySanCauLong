import {
  DashboardStatCard,
  type StatCardItem,
} from '@/components/dashboard/DashboardStatCard';
import type { Role } from '@/types/auth';

const STATS_BY_ROLE: Record<Role, StatCardItem[]> = {
  ADMIN: [
    {
      label: 'Doanh thu hôm nay',
      value: '14.850.000',
      unit: '₫',
      subtext: 'Dữ liệu minh họa tĩnh — Phase 1',
      badgeText: '+12.4%',
      badgeVariant: 'emerald',
      accentBarClass: 'bg-emerald-600',
    },
    {
      label: 'Tỷ lệ lấp đầy sân',
      value: '78.5',
      unit: '%',
      subtext: '63 / 80 khung giờ hoạt động',
      badgeText: 'Cao điểm 17h–21h',
      badgeVariant: 'sky',
      accentBarClass: 'bg-sky-500',
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
      badgeVariant: 'emerald',
      accentBarClass: 'bg-emerald-600',
    },
    {
      label: 'Khách chờ Check-in',
      value: '06',
      unit: 'lịch đặt',
      subtext: 'Trong vòng 60 phút tới',
      badgeText: 'Cần xác nhận',
      badgeVariant: 'sky',
      accentBarClass: 'bg-sky-500',
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
      value: '02',
      unit: 'lịch đặt',
      subtext: 'Sân VIP 1 & Sân Tiêu chuẩn 3',
      badgeText: 'Tuần này',
      badgeVariant: 'emerald',
      accentBarClass: 'bg-emerald-600',
    },
    {
      label: 'Tổng giờ đã chơi',
      value: '28',
      unit: 'giờ chơi',
      subtext: 'Tích lũy trong 30 ngày qua',
      badgeText: 'Thành viên tích cực',
      badgeVariant: 'sky',
      accentBarClass: 'bg-sky-500',
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
  const statCards = STATS_BY_ROLE[primaryRole];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => (
        <DashboardStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
