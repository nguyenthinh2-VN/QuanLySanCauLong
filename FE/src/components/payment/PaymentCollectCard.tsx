import { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
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
import { createPayment } from '@/lib/payment';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  type PaymentMethod,
  type PaymentResponse,
  type PaymentType,
} from '@/types/payment';

export function PaymentCollectCard() {
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idNum = parseInt(bookingId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      setErrorMessage('Vui lòng nhập mã đơn đặt sân hợp lệ (số nguyên dương)');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await createPayment({
        bookingId: idNum,
        paymentType,
        paymentMethod,
        note: note.trim() || undefined,
      });
      setResult(res);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể thu tiền cho đơn đặt sân này'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setBookingId('');
    setPaymentType('FULL');
    setPaymentMethod('CASH');
    setNote('');
    setErrorMessage(null);
    setResult(null);
  }

  if (result) {
    return (
      <PaymentResultCard
        payment={result}
        title="Thu tiền thành công"
        description="Đơn đặt sân đã được thanh toán và chuyển sang trạng thái CONFIRMED."
        onDone={handleReset}
        doneLabel="Thu tiền đơn khác"
      />
    );
  }

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <form onSubmit={handleSubmit}>
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-zinc-900">
              Thu tiền đơn đặt sân (PENDING)
            </CardTitle>
            <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
              POST /payments
            </span>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Dành cho nhân viên lễ tân thu tiền trực tiếp cho khách hàng. Nhập mã đơn đặt sân do khách cung cấp.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5 text-xs">
          {errorMessage && (
            <AuthAlert variant="error">{errorMessage}</AuthAlert>
          )}

          {/* Description & Constraints Note */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-zinc-600">
            <p className="font-semibold text-[11px] text-zinc-800">
              Lưu ý quy tắc nghiệp vụ:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-[11px] leading-relaxed">
              <li>Chỉ áp dụng cho đơn đặt trực tuyến đang ở trạng thái <strong>PENDING</strong> (chờ thanh toán).</li>
              <li>Đơn POS tạo tại quầy đã ở trạng thái <strong>CONFIRMED</strong> sẵn, nếu thu lại sẽ báo lỗi <em>409 BOOKING_NOT_PAYABLE</em> (đây là hành vi chuẩn).</li>
              <li>Khách vãng lai (không có tài khoản) chỉ có nhân viên quầy hoặc Admin mới có quyền thu tiền.</li>
            </ul>
          </div>

          {/* Booking ID Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="collect-booking-id"
              className="block text-xs font-semibold text-zinc-800"
            >
              Mã đơn đặt sân (Booking ID) <span className="text-red-500">*</span>
            </label>
            <Input
              id="collect-booking-id"
              type="number"
              min={1}
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Ví dụ: 12"
              disabled={submitting}
              required
              className="font-mono"
            />
          </div>

          {/* Payment Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-800">
              Loại thanh toán <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['FULL', 'DEPOSIT'] as PaymentType[]).map((type) => {
                const selected = paymentType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={submitting}
                    onClick={() => setPaymentType(type)}
                    className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${
                      selected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {PAYMENT_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
            {paymentType === 'DEPOSIT' && (
              <p className="text-[11px] text-amber-700">
                * Lưu ý: Khi chọn Đặt cọc 50%, đơn cũng sẽ chuyển sang CONFIRMED ngay lập tức.
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-800">
              Phương thức thanh toán <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'BANK_TRANSFER', 'E_WALLET'] as PaymentMethod[]).map(
                (method) => {
                  const selected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={submitting}
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-colors ${
                        selected
                          ? 'border-zinc-900 bg-zinc-900 text-white'
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

          {/* Note Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="collect-note"
              className="block text-xs font-semibold text-zinc-800"
            >
              Ghi chú (Tùy chọn, tối đa 500 ký tự)
            </label>
            <textarea
              id="collect-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder="Ví dụ: Khách thanh toán tiền mặt tại quầy lễ tân..."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-zinc-100 pt-3">
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
          >
            {submitting ? 'Đang xử lý thu tiền...' : 'Xác nhận thu tiền'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

