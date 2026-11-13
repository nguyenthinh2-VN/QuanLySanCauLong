import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface ConfirmRefundDialogProps {
  open: boolean;
  paymentId: number;
  reason?: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmRefundDialog({
  open,
  paymentId,
  reason,
  submitting,
  onClose,
  onConfirm,
}: ConfirmRefundDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-refund-title"
    >
      <Card className="w-full max-w-md border-zinc-200 bg-white shadow-xl">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              id="confirm-refund-title"
              className="text-base font-bold text-zinc-900"
            >
              Xác nhận hoàn tiền giao dịch #{paymentId}
            </CardTitle>
            <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-700">
              CẢNH BÁO
            </span>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Vui lòng kiểm tra kỹ các điều kiện nghiệp vụ trước khi hoàn tiền.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-xs leading-relaxed text-zinc-700">
          <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-red-900">
            <p className="font-semibold text-xs text-red-800">
              Hệ quả của thao tác hoàn tiền (Không thể hoàn tác):
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] text-red-800">
              <li>
                Trạng thái giao dịch thanh toán #{paymentId} sẽ chuyển sang{' '}
                <strong>REFUNDED</strong>.
              </li>
              <li>
                Đơn đặt sân liên quan sẽ <strong>tự động chuyển sang CANCELLED</strong> (Đã hủy).
              </li>
              <li>
                Khung giờ đặt của đơn sẽ được giải phóng cho khách hàng khác.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-zinc-600">
            <p className="font-semibold text-[11px] text-zinc-800">
              Điều kiện hợp lệ từ hệ thống:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-[11px]">
              <li>Giao dịch phải ở trạng thái <strong>SUCCESS</strong>.</li>
              <li>
                Khách hàng <strong>chưa nhận sân</strong> (chưa CHECKED_IN hoặc COMPLETED).
              </li>
            </ul>
          </div>

          {reason && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
              <span className="font-semibold text-zinc-700">Lý do hoàn tiền:</span>
              <p className="mt-0.5 italic text-zinc-600">{reason}</p>
            </div>
          )}
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
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Đang hoàn tiền...' : 'Xác nhận hoàn tiền'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

