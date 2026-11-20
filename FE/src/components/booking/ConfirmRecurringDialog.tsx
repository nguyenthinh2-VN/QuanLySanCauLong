import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrencyVnd, formatShortDateVi, formatTimeShort } from '@/lib/booking';

export interface ConfirmRecurringDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courtName: string;
  complexName: string;
  slotName: string;
  startTime: string;
  endTime: string;
  dayOfWeekLabel: string;
  firstDate: string;
  lastDate: string;
  weeks: number;
  totalAmount: number;
  submitting?: boolean;
}

export function ConfirmRecurringDialog({
  open,
  onClose,
  onConfirm,
  courtName,
  complexName,
  slotName,
  startTime,
  endTime,
  dayOfWeekLabel,
  firstDate,
  lastDate,
  weeks,
  totalAmount,
  submitting = false,
}: ConfirmRecurringDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-lg border-zinc-200 bg-white shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-base font-semibold text-zinc-900">
            Xác nhận đặt lịch cố định
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Vui lòng kiểm tra kỹ chuỗi lịch đặt trước khi hệ thống khởi tạo các đơn đặt sân.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5 pt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/75 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Cảnh báo quy tắc thanh toán &amp; hủy đơn:</p>
            <p className="text-amber-800">
              Hệ thống sẽ tạo <strong>{weeks} đơn đặt sân riêng lẻ</strong> ở trạng thái PENDING. Quý khách sẽ <strong>thanh toán riêng từng đơn</strong> trong mục <em>"Lịch đặt của tôi"</em>. Không có tính năng thanh toán hoặc hủy chung cả chuỗi.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">Cơ sở / Sân:</span>
              <span className="font-medium text-zinc-900">
                {courtName} ({complexName})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Khung giờ:</span>
              <span className="font-mono text-zinc-900">
                {slotName} ({formatTimeShort(startTime)} - {formatTimeShort(endTime)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Thứ lặp lại:</span>
              <span className="font-medium text-zinc-900">{dayOfWeekLabel} hàng tuần</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Thời gian chuỗi:</span>
              <span className="font-medium text-zinc-900">
                Từ {formatShortDateVi(firstDate)} đến {formatShortDateVi(lastDate)} ({weeks} buổi)
              </span>
            </div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between items-center">
              <span className="font-semibold text-zinc-700">Tổng tiền tham khảo:</span>
              <span className="text-sm font-bold text-zinc-900">
                {formatCurrencyVnd(totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={onClose}
            className="h-8 text-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={onConfirm}
            className="h-8 bg-zinc-900 text-xs text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Đang tạo chuỗi...' : 'Đồng ý đặt lịch'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
