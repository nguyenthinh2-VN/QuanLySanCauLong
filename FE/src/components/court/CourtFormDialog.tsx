import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/auth';
import { createCourt, updateCourt } from '@/lib/court';
import type { Complex, Court, CourtStatus } from '@/types/court';

export interface CourtFormDialogProps {
  open: boolean;
  initialData: Court | null;
  complexes: Complex[];
  defaultComplexId?: number;
  onClose: () => void;
  onSaved: (court: Court, message: string) => void;
}

export function CourtFormDialog({
  open,
  initialData,
  complexes,
  defaultComplexId,
  onClose,
  onSaved,
}: CourtFormDialogProps) {
  const isEditing = Boolean(initialData);

  const [complexId, setComplexId] = useState<number>(0);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CourtStatus>('AVAILABLE');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setComplexId(initialData.complexId);
      setName(initialData.name);
      setStatus(initialData.status);
    } else {
      const initialComplex =
        defaultComplexId && defaultComplexId > 0
          ? defaultComplexId
          : complexes.length > 0
          ? complexes[0].id
          : 0;
      setComplexId(initialComplex);
      setName('');
      setStatus('AVAILABLE');
    }
    setErrorMessage(null);
  }, [initialData, open, complexes, defaultComplexId]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();

    if (!isEditing && (!complexId || complexId <= 0)) {
      setErrorMessage('Vui lòng chọn cụm sân cho sân mới');
      return;
    }
    if (!trimmedName) {
      setErrorMessage('Tên sân không được để trống');
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Tên sân tối đa 100 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        // Chú ý: UpdateCourtRequest BE chỉ nhận { name, status }, KHÔNG có complexId
        const updated = await updateCourt(initialData.id, {
          name: trimmedName,
          status,
        });
        onSaved(updated, `Cập nhật sân "${updated.name}" thành công`);
      } else {
        const created = await createCourt({
          complexId,
          name: trimmedName,
          status,
        });
        onSaved(created, `Tạo mới sân "${created.name}" thành công`);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          isEditing ? 'Cập nhật sân thất bại' : 'Tạo mới sân thất bại'
        )
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
      <Card className="w-full max-w-md shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-zinc-100 pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900">
              {isEditing ? 'Cập nhật Sân Con' : 'Thêm Sân Con Mới'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {isEditing
                ? 'Chỉnh sửa tên sân và trạng thái hoạt động'
                : 'Thêm sân con mới vào một cụm sân cụ thể'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 pt-4 text-xs">
            {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

            {/* Cụm sân */}
            <div className="space-y-1">
              <Label htmlFor="court-complex" className="text-xs font-medium text-zinc-700">
                Thuộc Cụm sân <span className="text-red-500">*</span>
              </Label>
              {isEditing ? (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700">
                  {initialData?.complexName}
                  <span className="ml-1.5 text-[11px] font-normal text-zinc-400">
                    (Không thể đổi cụm sân của sân đã tạo)
                  </span>
                </div>
              ) : (
                <select
                  id="court-complex"
                  value={complexId}
                  onChange={(e) => setComplexId(Number(e.target.value))}
                  required
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                >
                  <option value={0} disabled>
                    -- Chọn cụm sân --
                  </option>
                  {complexes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.address})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tên sân con */}
            <div className="space-y-1">
              <Label htmlFor="court-name" className="text-xs font-medium text-zinc-700">
                Tên sân con <span className="text-red-500">*</span>
              </Label>
              <Input
                id="court-name"
                type="text"
                maxLength={100}
                required
                placeholder="VD: Sân 1 (Thảm Victor)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <Label htmlFor="court-status" className="text-xs font-medium text-zinc-700">
                Trạng thái sân <span className="text-red-500">*</span>
              </Label>
              <select
                id="court-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CourtStatus)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
              >
                <option value="AVAILABLE">Đang trống (AVAILABLE - Sẵn sàng nhận khách)</option>
                <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE - Tạm ngừng nhận lịch)</option>
              </select>
            </div>
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
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-8 bg-zinc-900 px-3.5 text-xs text-zinc-50 shadow-xs hover:bg-zinc-800"
            >
              {submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo sân con'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
