import { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PaymentVoucherBox } from '@/components/payment/PaymentVoucherBox';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { extractErrorMessage } from '@/lib/auth';
import { formatShortDateVi, formatTimeShort } from '@/lib/booking';
import { createPayment } from '@/lib/payment';
import { formatVnd } from '@/lib/voucher';
import type { BookingResponse } from '@/types/booking';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  type PaymentMethod,
  type PaymentResponse,
  type PaymentType,
} from '@/types/payment';
import type { ApplyVoucherResponse } from '@/types/voucher';

export interface PaymentDialogProps {
  booking: BookingResponse | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (payment: PaymentResponse) => void;
  onNeedRefresh?: () => void;
}

export function PaymentDialog({
  booking,
  open,
  onClose,
  onSuccess,
  onNeedRefresh,
}: PaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('BANK_TRANSFER');
  const [note, setNote] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] =
    useState<ApplyVoucherResponse | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentType('FULL');
      setPaymentMethod('BANK_TRANSFER');
      setNote('');
      setAppliedVoucher(null);
      setErrorMessage(null);
    }
  }, [open, booking?.id]);

  if (!open || !booking) return null;

  // Preview amount calculations (HALF_UP 2 chữ số thập phân)
  const totalAmount = appliedVoucher
    ? appliedVoucher.finalAmount
    : booking.totalAmount;
  const depositAmount = Math.round(Math.round(totalAmount * 100) * 0.5) / 100;
  const previewAmount = paymentType === 'FULL' ? totalAmount : depositAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createPayment({
        bookingId: booking.id,
        paymentType,
        paymentMethod,
        note: note.trim() || undefined,
      });
      onSuccess(result);
    } catch (error) {
      const msg = extractErrorMessage(
        error,
        'Không thể thực hiện thanh toán đơn đặt sân'
      );
      setErrorMessage(msg);
      // Khi gặp lỗi 409 (đơn không còn PENDING hoặc đã trả rồi), gọi refresh để cập nhật UI
      onNeedRefresh?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-dialog-title"
    >
      <Card className="w-full max-w-lg border-zinc-200 bg-white shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle id="payment-dialog-title" className="text-lg font-bold text-zinc-900">
                Thanh toán đơn đặt sân #{booking.id}
              </CardTitle>
              <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-zinc-800">
                Trạng thái: PENDING
              </span>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              Xác nhận thông tin thanh toán để hoàn tất đặt sân và giữ chỗ chính thức.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

            {/* Booking Summary Box */}
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800">
                  {booking.courtName} &bull; {booking.complexName}
                </span>
                <span className="font-mono text-zinc-600">
                  {formatShortDateVi(booking.bookingDate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Khung giờ:</span>
                <span className="font-medium text-zinc-800">
                  {formatTimeShort(booking.startTime)} &ndash;{' '}
                  {formatTimeShort(booking.endTime)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200/80 pt-2 text-zinc-700">
                <span>Tổng tiền đơn (đã áp voucher nếu có):</span>
                <span className="font-sans text-sm font-bold text-emerald-700">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>

            {/* Manual Voucher Input */}
            <PaymentVoucherBox
              bookingId={booking.id}
              disabled={submitting}
              appliedVoucher={appliedVoucher}
              onApplied={(res) => {
                setAppliedVoucher(res);
                onNeedRefresh?.();
              }}
            />

            {/* Payment Type Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Loại thanh toán <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['FULL', 'DEPOSIT'] as PaymentType[]).map((type) => {
                  const selected = paymentType === type;
                  const estAmount = type === 'FULL' ? totalAmount : depositAmount;

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={submitting}
                      onClick={() => setPaymentType(type)}
                      className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${selected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
                        }`}
                    >
                      <span className="font-semibold text-xs">
                        {PAYMENT_TYPE_LABELS[type]}
                      </span>
                      <span
                        className={`mt-1 font-sans text-sm font-bold ${selected ? 'text-emerald-50' : 'text-zinc-900'
                          }`}
                      >
                        {formatVnd(estAmount)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                * Số tiền xem trước: <strong>{formatVnd(previewAmount)}</strong>. Số tiền thực tế do máy chủ tính toán từ tổng tiền đơn hàng.
              </p>
            </div>

            {/* Mandatory Deposit Alert */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-900">
              <p className="font-semibold text-[11px] uppercase tracking-wide text-amber-800">
                Lưu ý quan trọng:
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Khi thanh toán thành công (kể cả chọn <strong>Đặt cọc 50%</strong>), đơn đặt sân sẽ chuyển ngay sang trạng thái <strong>CONFIRMED</strong> (Đã xác nhận). Hiện tại hệ thống chưa hỗ trợ thanh toán nốt 50% còn lại qua API (thanh toán lần 2 sẽ bị từ chối). Vui lòng cân nhắc kỹ trước khi lựa chọn.
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-800">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['BANK_TRANSFER', 'E_WALLET', 'CASH'] as PaymentMethod[]).map(
                  (method) => {
                    const selected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        disabled={submitting}
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${selected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                          }`}
                      >
                        {PAYMENT_METHOD_LABELS[method]}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Note Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="customer-payment-note"
                className="block text-xs font-semibold text-zinc-800"
              >
                Ghi chú thanh toán (Tùy chọn, tối đa 500 ký tự)
              </label>
              <textarea
                id="customer-payment-note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                placeholder="Ví dụ: Khách thanh toán cọc qua ngân hàng..."
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
            >
              {submitting ? 'Đang thanh toán...' : 'Xác nhận thanh toán'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

