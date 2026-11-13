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
import { Separator } from '@/components/ui/separator';
import { formatVnd } from '@/lib/voucher';
import type { ApplyVoucherResponse } from '@/types/voucher';

export interface ApplyVoucherResultCardProps {
  result: ApplyVoucherResponse;
  onApplyAnother: () => void;
}

export function ApplyVoucherResultCard({
  result,
  onApplyAnother,
}: ApplyVoucherResultCardProps) {
  return (
    <Card className="border-t-4 border-t-zinc-900 bg-white shadow-sm">
      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="indigo" className="font-semibold">
            Áp mã thành công
          </Badge>
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-bold text-zinc-900">
            Đơn #{result.bookingId}
          </span>
        </div>
        <CardTitle className="text-lg font-bold text-zinc-900">
          Ưu đãi đã được áp dụng vào đơn đặt sân
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Tổng tiền đơn đặt sân #{result.bookingId} đã được khấu trừ trực tiếp.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AuthAlert variant="success">
          Áp dụng thành công mã <strong>{result.voucherCode}</strong> ({result.voucherName})!
        </AuthAlert>

        <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Mã ưu đãi:</span>
            <span className="font-mono font-bold uppercase text-zinc-900">
              {result.voucherCode} &middot; {result.voucherName}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Tổng tiền ban đầu:</span>
            <span className="font-sans font-medium line-through tabular-nums text-zinc-500">
              {formatVnd(result.originalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-800">
              Số tiền được giảm:
            </span>
            <span className="font-sans font-bold tabular-nums text-emerald-700">
              - {formatVnd(result.discountAmount)}
            </span>
          </div>

          <Separator />

          <div className="flex items-baseline justify-between rounded-lg border border-zinc-200 bg-white p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Tổng tiền sau khi giảm:
            </span>
            <span className="font-mono text-base font-bold tabular-nums text-zinc-900">
              {formatVnd(result.finalAmount)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-end gap-2.5 border-t border-zinc-100 pt-3.5">
        <Button type="button" variant="outline" size="sm" onClick={onApplyAnother}>
          Áp mã cho đơn khác
        </Button>
        <Button size="sm" asChild>
          <Link to="/my-bookings">Xem đơn ở Lịch đặt của tôi</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

