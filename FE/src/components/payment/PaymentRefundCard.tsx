import { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { ConfirmRefundDialog } from '@/components/payment/ConfirmRefundDialog';
import { PaymentResultCard } from '@/components/payment/PaymentResultCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/auth';
import { refundPayment } from '@/lib/payment';
import type { PaymentResponse } from '@/types/payment';

export interface RefundTriggerRequest {
  paymentId: number;
  requestKey: number;
}

export interface PaymentRefundCardProps {
  refundRequest?: RefundTriggerRequest | null;
  onRefundSuccess?: () => void;
}

export function PaymentRefundCard({
  refundRequest,
  onRefundSuccess,
}: PaymentRefundCardProps) {
  const [paymentId, setPaymentId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [result, setResult] = useState<PaymentResponse | null>(null);

  useEffect(() => {
    if (refundRequest) {
      setPaymentId(String(refundRequest.paymentId));
      setResult(null);
      setErrorMessage(null);
      setDialogOpen(true);
    }
  }, [refundRequest]);

  function handleOpenConfirm(e: React.FormEvent) {
    e.preventDefault();
    const idNum = parseInt(paymentId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      setErrorMessage('Vui lòng nhập mã giao dịch thanh toán hợp lệ (số nguyên dương)');
      return;
    }

    setErrorMessage(null);
    setDialogOpen(true);
  }

  async function handleConfirmRefund() {
    const idNum = parseInt(paymentId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await refundPayment(idNum, {
        reason: reason.trim() || undefined,
      });
      setDialogOpen(false);
      setResult(res);
      onRefundSuccess?.();
    } catch (error) {
      setDialogOpen(false);
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể thực hiện hoàn tiền cho giao dịch này'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setPaymentId('');
    setReason('');
    setErrorMessage(null);
    setResult(null);
  }

  if (result) {
    return (
      <PaymentResultCard
        payment={result}
        title="Hoàn tiền thành công"
        description="Giao dịch đã được chuyển sang trạng thái REFUNDED và đơn đặt sân đã được hủy (CANCELLED)."
        onDone={handleReset}
        doneLabel="Hoàn tiền giao dịch khác"
      />
    );
  }

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-xs">
        <form onSubmit={handleOpenConfirm}>
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-900">
                Hoàn tiền giao dịch (Refund)
              </CardTitle>
              <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                POST /payments/&#123;id&#125;/refund
              </span>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              Dành cho nhân viên lễ tân/Admin xử lý hoàn tiền cho khách. Nhập mã giao dịch thanh toán (Payment ID).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 text-xs">
            {errorMessage && (
              <AuthAlert variant="error">{errorMessage}</AuthAlert>
            )}

            {/* Constraints Note */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-zinc-600">
              <p className="font-semibold text-[11px] text-zinc-800">
                Điều kiện hoàn tiền hợp lệ:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-[11px] leading-relaxed">
                <li>Giao dịch thanh toán phải ở trạng thái <strong>SUCCESS</strong>.</li>
                <li>Khách hàng <strong>chưa nhận sân</strong> (chưa CHECKED_IN hoặc COMPLETED).</li>
                <li>Mã giao dịch lấy từ biên nhận khi thu tiền (hoặc khách hàng cung cấp).</li>
                <li>Hoàn tiền thành công sẽ chuyển đơn đặt sân tương ứng sang <strong>CANCELLED</strong>.</li>
              </ul>
            </div>

            {/* Payment ID Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="refund-payment-id"
                className="block text-xs font-semibold text-zinc-800"
              >
                Mã giao dịch thanh toán (Payment ID) <span className="text-red-500">*</span>
              </label>
              <Input
                id="refund-payment-id"
                type="number"
                min={1}
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Nhập mã GD (ví dụ: 2 từ biên nhận thu tiền)"
                disabled={submitting}
                required
                className="font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                * Lưu ý: Nhập <strong>Mã giao dịch (Mã GD #{'{id}'})</strong> hiển thị trên biên nhận thanh toán, <u>không</u> nhập Mã đơn đặt sân (Booking ID).
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="refund-reason"
                className="block text-xs font-semibold text-zinc-800"
              >
                Lý do hoàn tiền (Tùy chọn, tối đa 500 ký tự)
              </label>
              <textarea
                id="refund-reason"
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                placeholder="Ví dụ: Khách bận việc đột xuất xin hủy trước giờ thi đấu..."
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-100 pt-3">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={submitting}
              className="w-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
            >
              Yêu cầu hoàn tiền
            </Button>
          </CardFooter>
        </form>
      </Card>

      <ConfirmRefundDialog
        open={dialogOpen}
        paymentId={parseInt(paymentId.trim(), 10) || 0}
        reason={reason}
        submitting={submitting}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmRefund}
      />
    </>
  );
}

