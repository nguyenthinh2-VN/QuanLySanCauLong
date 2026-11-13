import { useState } from 'react';
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
import { extractErrorMessage } from '@/lib/auth';
import { deleteVoucher } from '@/lib/voucher';
import type { Voucher } from '@/types/voucher';

export interface DeleteVoucherDialogProps {
  voucher: Voucher | null;
  onClose: () => void;
  onDeleted: (voucher: Voucher, message: string) => void;
}

export function DeleteVoucherDialog({
  voucher,
  onClose,
  onDeleted,
}: DeleteVoucherDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!voucher) return null;

  const isUsed = voucher.usedCount > 0;

  async function handleConfirmDelete() {
    if (!voucher) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await deleteVoucher(voucher.id);
      const msg = isUsed
        ? `Voucher ${voucher.code} đã được chuyển sang trạng thái Tắt (đã có ${voucher.usedCount} lượt sử dụng để bảo toàn lịch sử).`
        : `Đã xóa hoàn toàn voucher ${voucher.code} khỏi hệ thống.`;
      onDeleted(voucher, msg);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể xóa voucher ở thời điểm hiện tại')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-voucher-title"
    >
      <Card className="w-full max-w-md border-t-4 border-t-rose-600 bg-white shadow-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle id="delete-voucher-title" className="text-lg font-bold text-zinc-900">
              Xác nhận xóa voucher
            </CardTitle>
            <Badge variant="destructive">ADMIN</Badge>
          </div>
          <CardDescription className="text-xs leading-relaxed text-zinc-500">
            Hành động này sẽ thực thi theo cơ chế bảo toàn dữ liệu của Backend.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5">
          {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Mã voucher:</span>
              <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono font-bold text-zinc-900">
                {voucher.code}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Tên chương trình:</span>
              <strong className="text-zinc-900">{voucher.name}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">Số lượt đã sử dụng:</span>
              <span className="font-mono font-bold text-zinc-900">
                {voucher.usedCount} lượt
              </span>
            </div>
          </div>

          {/* Explanation of BE Behavior */}
          <div
            className={`rounded-lg border p-3 text-xs leading-relaxed ${
              isUsed
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700'
            }`}
          >
            {isUsed ? (
              <p>
                <strong>Lưu ý bảo toàn lịch sử:</strong> Voucher này đã có{' '}
                <strong>{voucher.usedCount} lượt áp dụng</strong> thực tế. Theo
                quy định của hệ thống, voucher sẽ <strong>chuyển trạng thái sang Tắt</strong>{' '}
                (không xóa vĩnh viễn) để bảo toàn lịch sử giao dịch và doanh thu.
              </p>
            ) : (
              <p>
                Voucher này <strong>chưa từng có lượt sử dụng nào</strong>. Hệ
                thống sẽ <strong>xóa hoàn toàn</strong> bản ghi voucher này khỏi
                cơ sở dữ liệu.
              </p>
            )}
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
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={submitting}
            onClick={handleConfirmDelete}
            className="h-9 px-4 text-xs font-semibold"
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận xóa'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

