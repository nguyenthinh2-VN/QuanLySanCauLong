import { useState } from 'react';
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
import {
  formatDateTimeVi,
  formatVnd,
  formatVoucherDiscount,
} from '@/lib/voucher';
import type { Voucher } from '@/types/voucher';

export interface ActiveVoucherCardProps {
  voucher: Voucher;
  onApplyCode: (code: string) => void;
}

export function ActiveVoucherCard({
  voucher,
  onApplyCode,
}: ActiveVoucherCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is not available
      setCopied(false);
    }
  }

  const discountText = formatVoucherDiscount(
    voucher.discountType,
    voucher.discountValue,
    voucher.maxDiscountAmount
  );

  return (
    <Card className="flex flex-col justify-between border-zinc-200/90 bg-white shadow-xs transition-shadow hover:shadow-md">
      <div>
        <CardHeader className="space-y-2 pb-2 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md border border-zinc-300 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-bold text-zinc-900">
                {voucher.code}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                title="Sao chép mã voucher"
              >
                {copied ? 'Đã chép ✓' : 'Sao chép'}
              </button>
            </div>
            <Badge variant="zinc" className="font-semibold">
              {voucher.discountType === 'PERCENTAGE'
                ? 'Giảm theo %'
                : 'Giảm tiền mặt'}
            </Badge>
          </div>

          <CardTitle className="text-base font-bold text-zinc-900">
            {voucher.name}
          </CardTitle>

          {voucher.description && (
            <CardDescription className="text-xs leading-relaxed text-zinc-500">
              {voucher.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-2.5 pb-3 text-xs">
          {/* Discount highlight */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-100/70 p-2.5">
            <span className="text-[11px] font-medium text-zinc-900">
              Mức giảm ưu đãi:
            </span>
            <p className="font-sans text-sm font-bold text-zinc-800">
              {discountText}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-1 text-zinc-600">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Đơn tối thiểu:</span>
              <span className="font-sans font-medium tabular-nums text-zinc-800">
                {voucher.minOrderAmount != null && voucher.minOrderAmount > 0
                  ? formatVnd(voucher.minOrderAmount)
                  : 'Không yêu cầu'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Hạn sử dụng:</span>
              <span className="font-sans font-medium tabular-nums text-zinc-800">
                {formatDateTimeVi(voucher.endDate)}
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="border-t border-zinc-100 pt-3">
        <Button
          type="button"
          size="sm"
          onClick={() => onApplyCode(voucher.code)}
          className="h-8 w-full text-xs font-semibold"
        >
          Áp dụng ngay
        </Button>
      </CardFooter>
    </Card>
  );
}

