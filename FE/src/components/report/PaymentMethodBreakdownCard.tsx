import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatVnd } from '@/lib/voucher';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/payment';
import type { PaymentMethodBreakdownResponse } from '@/types/report';

export interface PaymentMethodBreakdownCardProps {
  items: PaymentMethodBreakdownResponse[];
}

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'CASH',
  'BANK_TRANSFER',
  'E_WALLET',
];

export function PaymentMethodBreakdownCard({
  items,
}: PaymentMethodBreakdownCardProps) {
  const byMethodMap = new Map<PaymentMethod, PaymentMethodBreakdownResponse>();
  for (const item of items) {
    byMethodMap.set(item.paymentMethod, item);
  }

  // Luôn hiển thị đủ 3 phương thức thanh toán, tự bù 0đ / 0 GD nếu kỳ không có dữ liệu
  const rows: PaymentMethodBreakdownResponse[] = ALL_PAYMENT_METHODS.map(
    (method) =>
      byMethodMap.get(method) ?? {
        paymentMethod: method,
        grossRevenue: 0,
        transactionCount: 0,
      }
  );

  const totalGross = rows.reduce((sum, row) => sum + (row.grossRevenue || 0), 0);

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-zinc-900">
          Doanh thu gộp theo phương thức
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Thống kê các giao dịch thành công (SUCCESS) theo từng hình thức thanh toán.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-y border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5">Phương thức</th>
                <th className="px-4 py-2.5 text-right">Số giao dịch</th>
                <th className="px-4 py-2.5 text-right">Doanh thu gộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => {
                const sharePercent =
                  totalGross > 0
                    ? Math.round((row.grossRevenue / totalGross) * 100)
                    : 0;

                return (
                  <tr key={row.paymentMethod} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">
                        {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                      </div>
                      <div className="mt-1.5 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-zinc-800 transition-all"
                          style={{ width: `${sharePercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-700">
                      {row.transactionCount}
                    </td>
                    <td className="px-4 py-3 text-right font-sans font-bold tabular-nums text-zinc-900">
                      {formatVnd(row.grossRevenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

