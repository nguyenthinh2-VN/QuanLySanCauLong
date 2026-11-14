import {
  DashboardStatCard,
  type StatCardItem,
} from '@/components/dashboard/DashboardStatCard';
import { formatVnd } from '@/lib/voucher';
import type { RevenueTotalsResponse } from '@/types/report';

export interface RevenueKpiGridProps {
  totals: RevenueTotalsResponse;
}

export function RevenueKpiGrid({ totals }: RevenueKpiGridProps) {
  const items: StatCardItem[] = [
    {
      label: 'Doanh thu thuần',
      value: formatVnd(totals.netRevenue),
      subtext: 'Doanh thu gộp trừ tiền hoàn (Net Revenue)',
      badgeText: 'Thực thu',
      badgeVariant: 'success',
      accentBarClass: 'bg-emerald-600',
    },
    {
      label: 'Doanh thu gộp',
      value: formatVnd(totals.grossRevenue),
      subtext: 'Tổng tiền các giao dịch SUCCESS theo paidAt',
      badgeText: 'SUCCESS',
      badgeVariant: 'sky',
      accentBarClass: 'bg-sky-600',
    },
    {
      label: 'Tiền đã hoàn',
      value: formatVnd(totals.refundedAmount),
      subtext: 'Tổng tiền các giao dịch REFUNDED trong kỳ',
      badgeText: 'REFUNDED',
      badgeVariant: 'destructive',
      accentBarClass: 'bg-rose-500',
    },
    {
      label: 'Giao dịch thành công',
      value: String(totals.transactionCount),
      unit: 'giao dịch',
      subtext: 'Chỉ đếm giao dịch SUCCESS (không đếm hoàn tiền)',
      badgeText: 'Số lượng',
      badgeVariant: 'amber',
      accentBarClass: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((stat) => (
        <DashboardStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

