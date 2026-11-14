import { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/auth';
import { applyVoucher, formatVnd } from '@/lib/voucher';
import type { ApplyVoucherResponse } from '@/types/voucher';

export interface PaymentVoucherBoxProps {
  bookingId: number;
  disabled?: boolean;
  appliedVoucher: ApplyVoucherResponse | null;
  onApplied: (result: ApplyVoucherResponse) => void;
}

export function PaymentVoucherBox({
  bookingId,
  disabled = false,
  appliedVoucher,
  onApplied,
}: PaymentVoucherBoxProps) {
  const [code, setCode] = useState<string>('');
  const [applying, setApplying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!appliedVoucher) {
      setCode('');
      setErrorMessage(null);
    }
  }, [bookingId, appliedVoucher]);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập mã giảm giá trước khi áp dụng.');
      return;
    }

    setApplying(true);
    setErrorMessage(null);

    try {
      const res = await applyVoucher({
        code: trimmed,
        bookingId,
      });
      onApplied(res);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể áp dụng mã giảm giá này')
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="payment-voucher-code"
          className="text-xs font-semibold text-zinc-800"
        >
          Mã giảm giá / Voucher (Tùy chọn)
        </label>
        {appliedVoucher && (
          <Badge variant="success">Đã áp mã {appliedVoucher.voucherCode}</Badge>
        )}
      </div>

      {!appliedVoucher ? (
        <div className="flex items-center gap-2">
          <Input
            id="payment-voucher-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleApply();
              }
            }}
            placeholder="Nhập mã voucher (VD: HE2026)..."
            disabled={disabled || applying}
            className="h-9 bg-white font-mono text-xs uppercase"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || applying || !code.trim()}
            onClick={() => void handleApply()}
            className="h-9 shrink-0 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
          >
            {applying ? 'Đang áp...' : 'Áp dụng'}
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-emerald-800">
              {appliedVoucher.voucherName}
            </span>
            <span className="font-mono font-bold text-emerald-700">
              -{formatVnd(appliedVoucher.discountAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-700">
            <span>
              Giá gốc: <span className="line-through">{formatVnd(appliedVoucher.originalAmount)}</span>
            </span>
            <span>
              Còn lại:{' '}
              <strong className="text-emerald-800">
                {formatVnd(appliedVoucher.finalAmount)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}
    </div>
  );
}
