import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTimeVi, formatVnd } from '@/lib/voucher';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  type PaymentResponse,
  type PaymentStatus,
} from '@/types/payment';

export interface PaymentHistoryTableProps {
  payments: PaymentResponse[];
  loading: boolean;
  onViewInvoice: (paymentId: number) => void;
  onSelectRefund?: (paymentId: number) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

function getStatusBadgeVariant(
  status: PaymentStatus
): 'success' | 'secondary' | 'destructive' | 'amber' {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'REFUNDED':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'amber';
  }
}

function getAmountClassName(status: PaymentStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-emerald-700';
    case 'REFUNDED':
      return 'text-rose-600 line-through decoration-rose-400';
    case 'FAILED':
      return 'text-rose-600';
    default:
      return 'text-amber-700';
  }
}

export function PaymentHistoryTable({
  payments,
  loading,
  onViewInvoice,
  onSelectRefund,
  page,
  totalPages,
  totalElements,
  onPageChange,
}: PaymentHistoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        Đang tải lịch sử giao dịch...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        Chưa có giao dịch thanh toán nào phù hợp với bộ lọc.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Mã GD</th>
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Loại &amp; Phương thức</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-zinc-50/70">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">
                  #{payment.id}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                  Đơn #{payment.bookingId}
                </td>
                <td
                  className={`px-4 py-3 font-semibold tabular-nums ${getAmountClassName(
                    payment.status
                  )}`}
                >
                  {formatVnd(payment.amount)}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">
                  <div className="font-medium text-zinc-900">
                    {PAYMENT_TYPE_LABELS[payment.paymentType]}
                  </div>
                  <div className="text-zinc-500">
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 tabular-nums">
                  {formatDateTimeVi(payment.paidAt ?? payment.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewInvoice(payment.id)}
                    >
                      Xem hóa đơn
                    </Button>
                    {onSelectRefund && payment.status === 'SUCCESS' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                        onClick={() => onSelectRefund(payment.id)}
                      >
                        Hoàn tiền
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
        <span>
          Tổng cộng <strong className="text-zinc-900">{totalElements}</strong>{' '}
          giao dịch (Trang {page + 1}/{Math.max(totalPages, 1)})
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

