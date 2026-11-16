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
import { createComplex, isValidVnPhone, updateComplex } from '@/lib/court';
import type { Complex, ComplexStatus } from '@/types/court';

export interface ComplexFormDialogProps {
  open: boolean;
  initialData: Complex | null;
  onClose: () => void;
  onSaved: (complex: Complex, message: string) => void;
}

export function ComplexFormDialog({
  open,
  initialData,
  onClose,
  onSaved,
}: ComplexFormDialogProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ComplexStatus>('ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAddress(initialData.address);
      setPhone(initialData.phone || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setAddress('');
      setPhone('');
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
  }, [initialData, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage('Tên cụm sân không được để trống');
      return;
    }
    if (trimmedName.length > 150) {
      setErrorMessage('Tên cụm sân tối đa 150 ký tự');
      return;
    }
    if (!trimmedAddress) {
      setErrorMessage('Địa chỉ cụm sân không được để trống');
      return;
    }
    if (trimmedPhone && !isValidVnPhone(trimmedPhone)) {
      setErrorMessage('Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678 hoặc +84912345678)');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        const updated = await updateComplex(initialData.id, {
          name: trimmedName,
          address: trimmedAddress,
          phone: trimmedPhone,
          status,
        });
        onSaved(updated, `Cập nhật cụm sân "${updated.name}" thành công`);
      } else {
        const created = await createComplex({
          name: trimmedName,
          address: trimmedAddress,
          phone: trimmedPhone || undefined,
          status,
        });
        onSaved(created, `Tạo mới cụm sân "${created.name}" thành công`);
      }
      onClose();
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, isEditing ? 'Cập nhật cụm sân thất bại' : 'Tạo cụm sân mới thất bại'));
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
              {isEditing ? 'Cập nhật Cụm Sân' : 'Thêm Cụm Sân Mới'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {isEditing
                ? 'Chỉnh sửa thông tin địa điểm và trạng thái hoạt động'
                : 'Thiết lập địa điểm cụm sân cầu lông mới trong hệ thống'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 pt-4 text-xs">
            {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

            {/* Tên cụm sân */}
            <div className="space-y-1">
              <Label htmlFor="complex-name" className="text-xs font-medium text-zinc-700">
                Tên cụm sân <span className="text-red-500">*</span>
              </Label>
              <Input
                id="complex-name"
                type="text"
                maxLength={150}
                required
                placeholder="VD: Cụm Sân Cầu Lông Cầu Giấy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1">
              <Label htmlFor="complex-address" className="text-xs font-medium text-zinc-700">
                Địa chỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="complex-address"
                type="text"
                required
                placeholder="VD: Số 123 Đường Cầu Giấy, Hà Nội"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <Label htmlFor="complex-phone" className="text-xs font-medium text-zinc-700">
                Số điện thoại liên hệ <span className="text-zinc-400 font-normal">(Tùy chọn)</span>
              </Label>
              <Input
                id="complex-phone"
                type="tel"
                placeholder="VD: 0988776655 hoặc +84988776655"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <Label htmlFor="complex-status" className="text-xs font-medium text-zinc-700">
                Trạng thái hoạt động <span className="text-red-500">*</span>
              </Label>
              <select
                id="complex-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplexStatus)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
              >
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
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
              {submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo cụm sân'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
