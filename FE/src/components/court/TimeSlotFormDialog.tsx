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
import { createTimeSlot, formatTimeShort, updateTimeSlot } from '@/lib/court';
import type { TimeSlot } from '@/types/court';

export interface TimeSlotFormDialogProps {
  open: boolean;
  initialData: TimeSlot | null;
  onClose: () => void;
  onSaved: (slot: TimeSlot, message: string) => void;
}

export function TimeSlotFormDialog({
  open,
  initialData,
  onClose,
  onSaved,
}: TimeSlotFormDialogProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [pricePerHour, setPricePerHour] = useState<string>('100000');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStartTime(formatTimeShort(initialData.startTime));
      setEndTime(formatTimeShort(initialData.endTime));
      setPricePerHour(String(initialData.pricePerHour));
    } else {
      setName('');
      setStartTime('08:00');
      setEndTime('16:00');
      setPricePerHour('100000');
    }
    setErrorMessage(null);
  }, [initialData, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedStart = startTime.trim();
    const trimmedEnd = endTime.trim();
    const parsedPrice = Number(pricePerHour);

    if (!trimmedName) {
      setErrorMessage('Tên khung giờ không được để trống');
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Tên khung giờ tối đa 100 ký tự');
      return;
    }
    if (!trimmedStart || !trimmedEnd) {
      setErrorMessage('Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc');
      return;
    }
    if (trimmedStart >= trimmedEnd) {
      setErrorMessage('Giờ bắt đầu phải nhỏ hơn giờ kết thúc trong ngày');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Giá thuê mỗi giờ không hợp lệ và không được âm');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        const updated = await updateTimeSlot(initialData.id, {
          name: trimmedName,
          startTime: trimmedStart,
          endTime: trimmedEnd,
          pricePerHour: parsedPrice,
        });
        onSaved(updated, `Cập nhật khung giờ "${updated.name}" thành công`);
      } else {
        const created = await createTimeSlot({
          name: trimmedName,
          startTime: trimmedStart,
          endTime: trimmedEnd,
          pricePerHour: parsedPrice,
        });
        onSaved(created, `Tạo mới khung giờ "${created.name}" thành công`);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          isEditing ? 'Cập nhật khung giờ thất bại' : 'Tạo mới khung giờ thất bại'
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
              {isEditing ? 'Cập nhật Khung Giờ' : 'Thêm Khung Giờ Mới'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {isEditing
                ? 'Chỉnh sửa khoảng thời gian và đơn giá thuê theo giờ'
                : 'Thiết lập khung giờ hoạt động và mức giá áp dụng cho sân'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 pt-4 text-xs">
            {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

            {/* Tên khung giờ */}
            <div className="space-y-1">
              <Label htmlFor="slot-name" className="text-xs font-medium text-zinc-700">
                Tên khung giờ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slot-name"
                type="text"
                maxLength={100}
                required
                placeholder="VD: Sáng sớm 05:00–08:00 hoặc Giờ vàng 17:00–21:00"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Giờ bắt đầu & Giờ kết thúc */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="slot-start" className="text-xs font-medium text-zinc-700">
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slot-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="slot-end" className="text-xs font-medium text-zinc-700">
                  Giờ kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slot-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Đơn giá thuê / giờ */}
            <div className="space-y-1">
              <Label htmlFor="slot-price" className="text-xs font-medium text-zinc-700">
                Đơn giá thuê (VNĐ / giờ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slot-price"
                type="number"
                min={0}
                step={5000}
                required
                placeholder="VD: 100000"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                className="h-9 font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-400">
                Giá áp dụng cho mỗi giờ chơi trong khung giờ này.
              </p>
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
              {submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo khung giờ'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
