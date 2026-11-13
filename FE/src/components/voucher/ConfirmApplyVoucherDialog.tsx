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

export interface ConfirmApplyVoucherDialogProps {
  open: boolean;
  bookingId: number | null;
  code: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmApplyVoucherDialog({
  open,
  bookingId,
  code,
  submitting,
  onClose,
  onConfirm,
}: ConfirmApplyVoucherDialogProps) {
  if (!open || bookingId == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-apply-title"
    >
      <Card className="w-full max-w-md border-t-4 border-t-zinc-900 bg-white shadow-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle id="confirm-apply-title" className="text-lg font-bold text-zinc-900">
              Xác nhận áp dụng voucher
            </CardTitle>
            <Badge variant="amber">Thao tác không hoàn tác</Badge>
          </div>
          <CardDescription className="text-xs leading-relaxed text-zinc-500">
            Vui lòng kiểm tra kỹ thông tin đơn đặt sân và mã voucher trước khi xác nhận.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5">
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Mã đơn đặt sân:</span>
              <span className="font-mono font-bold text-zinc-900">
                #{bookingId}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Mã ưu đãi áp dụng:</span>
              <span className="rounded border border-zinc-300 bg-white px-2 py-0.5 font-mono font-bold uppercase text-zinc-900">
                {code}
              </span>
            </div>
          </div>

          {/* Prominent Warning Box */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-bold text-amber-950">
              Cảnh báo quan trọng:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>
                Áp mã là thao tác <strong>một lần duy nhất</strong>. Tổng tiền đơn đặt sân sẽ giảm vĩnh viễn và không thể hủy bỏ hay đổi sang mã khác.
              </li>
              <li>
                Mỗi đơn đặt sân chỉ có thể áp dụng <strong>tối đa 1 mã ưu đãi</strong>.
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-end gap-2.5 border-t border-zinc-100 pt-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={onConfirm}
            className="h-9 px-5 text-xs font-semibold"
          >
            {submitting ? 'Đang áp mã...' : 'Xác nhận áp mã'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

