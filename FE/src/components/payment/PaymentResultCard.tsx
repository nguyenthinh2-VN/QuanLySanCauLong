import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTimeVi, formatVnd } from '@/lib/voucher';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  type PaymentResponse,
} from '@/types/payment';

export interface PaymentResultCardProps {
  payment: PaymentResponse;
  title?: string;
  description?: string;
  onDone?: () => void;
  doneLabel?: string;
}

export function PaymentResultCard({
  payment,
  title = 'Biên nhận thanh toán',
  description = 'Thông tin giao dịch đã được hệ thống ghi nhận thành công.',
  onDone,
  doneLabel = 'Hoàn tất',
}: PaymentResultCardProps) {
  const isRefunded = payment.status === 'REFUNDED';

  return (
    <Card className="border-t-4 border-t-zinc-900 bg-white shadow-sm">
      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant={isRefunded ? 'secondary' : 'zinc'}
            className="font-semibold"
          >
            {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
          </Badge>
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-bold text-zinc-900">
            Mã GD #{payment.id}
          </span>
        </div>
        <CardTitle className="text-lg font-bold text-zinc-900">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Amount Box */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Số tiền giao dịch</span>
            <span className="font-mono text-xs font-semibold text-zinc-700">
              Đơn đặt #{payment.bookingId}
            </span>
          </div>
          <p className="mt-1 font-sans text-2xl font-bold tracking-tight text-zinc-900">
            {formatVnd(payment.amount)}
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-zinc-200/70 pt-2 text-xs">
            <span className="text-zinc-600">Mã giao dịch (Payment ID để hoàn tiền):</span>
            <span className="rounded bg-zinc-200/80 px-2 py-0.5 font-mono font-bold text-zinc-900">
              #{payment.id}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
            <span className="text-zinc-500">Loại thanh toán:</span>
            <p className="font-semibold text-zinc-800">
              {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
            <span className="text-zinc-500">Phương thức:</span>
            <p className="font-semibold text-zinc-800">
              {PAYMENT_METHOD_LABELS[payment.paymentMethod] ||
                payment.paymentMethod}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 sm:col-span-2">
            <span className="text-zinc-500">Mã tham chiếu cổng:</span>
            <p className="mt-0.5 break-all font-mono text-xs font-medium text-zinc-800">
              {payment.transactionRef}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 sm:col-span-2">
            <span className="text-zinc-500">Thời điểm ghi nhận:</span>
            <p className="font-semibold text-zinc-800">
              {formatDateTimeVi(payment.paidAt || payment.updatedAt)}
            </p>
          </div>

          {payment.note && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 sm:col-span-2">
              <span className="text-zinc-500">Ghi chú:</span>
              <p className="italic text-zinc-700">{payment.note}</p>
            </div>
          )}
        </div>

        {onDone && (
          <div className="pt-2">
            <Button
              type="button"
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={onDone}
            >
              {doneLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

