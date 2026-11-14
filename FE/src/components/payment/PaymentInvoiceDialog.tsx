import { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/auth';
import {
  formatShortDateVi,
  formatTimeShort,
  getBookingStatusMeta,
} from '@/lib/booking';
import { getPaymentById } from '@/lib/payment';
import { formatDateTimeVi, formatVnd } from '@/lib/voucher';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  type PaymentDetailResponse,
  type PaymentStatus,
} from '@/types/payment';

export interface PaymentInvoiceDialogProps {
  paymentId: number | null;
  onClose: () => void;
}

function getInvoiceBadgeVariant(
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

export function PaymentInvoiceDialog({
  paymentId,
  onClose,
}: PaymentInvoiceDialogProps) {
  const [detail, setDetail] = useState<PaymentDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId === null) {
      setDetail(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    getPaymentById(paymentId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            extractErrorMessage(error, 'Không thể tải chi tiết hóa đơn')
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (paymentId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/50 p-4 print:static print:block print:bg-transparent print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white shadow-xl print:max-w-none print:border-none print:shadow-none">
        {/* Printable POS 80mm Receipt Body */}
        <div className="printable-receipt p-5 text-xs text-zinc-800 print:p-0 print:text-[11px] print:text-black">
          {/* Store / Receipt Header */}
          <div className="border-b border-dashed border-zinc-300 pb-3 text-center print:border-black/40">
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-900 print:text-black">
              SÂN CẦU LÔNG
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 print:text-black">
              HÓA ĐƠN THANH TOÁN
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[11px] text-zinc-600 print:text-black">
              <span>Mã GD: #{paymentId}</span>
              <span>•</span>
              <span>
                {detail
                  ? formatDateTimeVi(detail.paidAt ?? detail.createdAt)
                  : '---'}
              </span>
            </div>
            {detail && (
              <div className="mt-2 flex justify-center print:hidden">
                <Badge variant={getInvoiceBadgeVariant(detail.status)}>
                  {PAYMENT_STATUS_LABELS[detail.status]}
                </Badge>
              </div>
            )}
          </div>

          {loading && (
            <p className="py-8 text-center text-xs text-zinc-500">
              Đang tải thông tin hóa đơn...
            </p>
          )}

          {errorMessage && (
            <div className="py-4">
              <AuthAlert variant="error">{errorMessage}</AuthAlert>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Customer Info */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 py-3 print:border-black/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 print:text-black">
                  Khách hàng
                </p>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Họ tên:</span>
                  <span className="text-right font-semibold text-zinc-900 print:text-black">
                    {detail.customerName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">SĐT:</span>
                  <span className="font-mono font-medium text-zinc-900 print:text-black">
                    {detail.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Loại khách:</span>
                  <span className="text-right text-zinc-900 print:text-black">
                    {detail.customerEmail || 'Khách vãng lai'}
                  </span>
                </div>
              </div>

              {/* Booking Detail */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 py-3 print:border-black/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 print:text-black">
                  Chi tiết đặt sân (Đơn #{detail.bookingId})
                </p>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Cụm sân:</span>
                  <span className="text-right font-medium text-zinc-900 print:text-black">
                    {detail.complexName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Sân:</span>
                  <span className="text-right font-semibold text-zinc-900 print:text-black">
                    {detail.courtName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Ngày chơi:</span>
                  <span className="font-mono font-medium text-zinc-900 print:text-black">
                    {formatShortDateVi(detail.bookingDate)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Khung giờ:</span>
                  <span className="font-mono font-semibold text-zinc-900 print:text-black">
                    {formatTimeShort(detail.startTime)} -{' '}
                    {formatTimeShort(detail.endTime)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Trạng thái đơn:</span>
                  <span className="text-right text-zinc-900 print:text-black">
                    {getBookingStatusMeta(detail.bookingStatus).label}
                  </span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 py-3 print:border-black/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 print:text-black">
                  Thông tin thanh toán
                </p>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Tổng tiền đơn:</span>
                  <span className="font-mono font-medium tabular-nums text-zinc-900 print:text-black">
                    {formatVnd(detail.bookingTotalAmount)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Hình thức:</span>
                  <span className="text-right font-medium text-zinc-900 print:text-black">
                    {PAYMENT_TYPE_LABELS[detail.paymentType]}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Phương thức:</span>
                  <span className="text-right font-medium text-zinc-900 print:text-black">
                    {PAYMENT_METHOD_LABELS[detail.paymentMethod]}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 print:text-black">Trạng thái GD:</span>
                  <span className="text-right font-semibold text-zinc-900 print:text-black">
                    {PAYMENT_STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="block text-[10px] text-zinc-500 print:text-black">
                    Mã tham chiếu:
                  </span>
                  <span className="block break-all font-mono text-[10px] text-zinc-700 print:text-black">
                    {detail.transactionRef}
                  </span>
                </div>
                {detail.note && (
                  <div className="pt-1">
                    <span className="block text-[10px] text-zinc-500 print:text-black">
                      Ghi chú:
                    </span>
                    <span className="block text-[11px] text-zinc-800 print:text-black">
                      {detail.note}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between border-b border-dashed border-zinc-300 py-3.5 print:border-black/40">
                <span className="text-xs font-bold uppercase text-zinc-900 print:text-black">
                  Số tiền giao dịch
                </span>
                <span className="text-lg font-bold tabular-nums text-emerald-700 print:text-base print:text-black">
                  {formatVnd(detail.amount)}
                </span>
              </div>

              {/* Thermal Receipt Footer */}
              <div className="pt-3 text-center text-[11px] text-zinc-500 print:text-black">
                <p className="font-medium">
                  Cảm ơn quý khách đã sử dụng dịch vụ!
                </p>
                <p className="mt-0.5 text-[10px]">
                  Vui lòng giữ hóa đơn để đối chiếu khi cần thiết.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Action Buttons (hidden when printing) */}
        <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3 rounded-b-xl print:hidden">
          {detail && (
            <Button type="button" onClick={() => window.print()}>
              In hóa đơn
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
