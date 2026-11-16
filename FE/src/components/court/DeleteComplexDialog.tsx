import { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
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
import { deleteComplex } from '@/lib/court';
import type { Complex } from '@/types/court';

export interface DeleteComplexDialogProps {
  complex: Complex | null;
  onClose: () => void;
  onDeleted: (complex: Complex, message: string) => void;
}

export function DeleteComplexDialog({
  complex,
  onClose,
  onDeleted,
}: DeleteComplexDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!complex) return null;

  async function handleConfirmDelete() {
    if (!complex) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteComplex(complex.id);
      onDeleted(complex, `Đã xóa cụm sân "${complex.name}" thành công`);
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(err, 'Không thể xóa cụm sân ở thời điểm hiện tại')
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
    >
      <Card className="w-full max-w-md shadow-xl border-red-100">
        <CardHeader className="border-b border-zinc-100 pb-3">
          <CardTitle className="text-base font-semibold text-red-600">
            Xác nhận Xóa Cụm Sân
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Hành động này sẽ xóa hoàn toàn cụm sân và không thể hoàn tác
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-4 text-xs text-zinc-700">
          {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

          <div className="rounded-md border border-zinc-200 bg-zinc-50/75 p-3">
            <p className="font-medium text-zinc-900">{complex.name}</p>
            <p className="mt-1 text-zinc-500">{complex.address}</p>
            <p className="mt-1 text-zinc-500">
              Số sân trực thuộc: <span className="font-semibold text-zinc-800">{complex.totalCourts}</span>
            </p>
          </div>

          <p className="text-zinc-600">
            Bạn có chắc chắn muốn xóa cụm sân này? Nếu cụm sân còn chứa các sân con,
            hệ thống sẽ từ chối thao tác để đảm bảo toàn vẹn dữ liệu.
          </p>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={onClose}
            className="h-8 text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={handleConfirmDelete}
            className="h-8 bg-red-600 px-3.5 text-xs text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-600"
          >
            {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
