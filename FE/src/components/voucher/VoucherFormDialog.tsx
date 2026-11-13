import React, { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { extractErrorMessage } from '@/lib/auth';
import {
  createVoucher,
  fromDateTimeLocalInput,
  toDateTimeLocalInput,
  updateVoucher,
} from '@/lib/voucher';
import type {
  CreateVoucherRequest,
  DiscountType,
  UpdateVoucherRequest,
  Voucher,
} from '@/types/voucher';

export interface VoucherFormDialogProps {
  open: boolean;
  initialVoucher: Voucher | null;
  onClose: () => void;
  onSuccess: (saved: Voucher, message: string) => void;
}

const CODE_REGEX = /^[A-Za-z0-9_-]{3,50}$/;

export function VoucherFormDialog({
  open,
  initialVoucher,
  onClose,
  onSuccess,
}: VoucherFormDialogProps) {
  const isEdit = Boolean(initialVoucher);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [userUsageLimit, setUserUsageLimit] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (initialVoucher) {
      setCode(initialVoucher.code);
      setName(initialVoucher.name);
      setDescription(initialVoucher.description || '');
      setDiscountType(initialVoucher.discountType);
      setDiscountValue(String(initialVoucher.discountValue));
      setMaxDiscountAmount(
        initialVoucher.maxDiscountAmount != null
          ? String(initialVoucher.maxDiscountAmount)
          : ''
      );
      setMinOrderAmount(
        initialVoucher.minOrderAmount != null
          ? String(initialVoucher.minOrderAmount)
          : ''
      );
      setUsageLimit(
        initialVoucher.usageLimit != null
          ? String(initialVoucher.usageLimit)
          : ''
      );
      setUserUsageLimit(String(initialVoucher.userUsageLimit || 1));
      setStartDate(toDateTimeLocalInput(initialVoucher.startDate));
      setEndDate(toDateTimeLocalInput(initialVoucher.endDate));
      setActive(initialVoucher.active);
    } else {
      // Default dates for new voucher: start now, end 30 days later
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);

      setCode('');
      setName('');
      setDescription('');
      setDiscountType('PERCENTAGE');
      setDiscountValue('10');
      setMaxDiscountAmount('50000');
      setMinOrderAmount('100000');
      setUsageLimit('100');
      setUserUsageLimit('1');
      setStartDate(toDateTimeLocalInput(now.toISOString()));
      setEndDate(toDateTimeLocalInput(nextMonth.toISOString()));
      setActive(true);
    }
    setFormError(null);
  }, [open, initialVoucher]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    // Validations
    if (!isEdit) {
      if (!trimmedCode) {
        setFormError('Vui lòng nhập mã voucher.');
        return;
      }
      if (!CODE_REGEX.test(trimmedCode)) {
        setFormError(
          'Mã voucher chỉ gồm chữ cái, số, gạch ngang (-) hoặc gạch dưới (_), độ dài từ 3 đến 50 ký tự.'
        );
        return;
      }
    }

    if (!trimmedName) {
      setFormError('Vui lòng nhập tên voucher.');
      return;
    }
    if (trimmedName.length > 100) {
      setFormError('Tên voucher không được vượt quá 100 ký tự.');
      return;
    }
    if (trimmedDesc.length > 500) {
      setFormError('Mô tả voucher không được vượt quá 500 ký tự.');
      return;
    }

    const parsedVal = Number(discountValue);
    if (!isEdit) {
      if (isNaN(parsedVal) || parsedVal <= 0) {
        setFormError('Giá trị chiết khấu phải lớn hơn 0.');
        return;
      }
      if (discountType === 'PERCENTAGE' && parsedVal > 100) {
        setFormError('Chiết khấu phần trăm không được vượt quá 100%.');
        return;
      }
    }

    const parsedMaxDiscount = maxDiscountAmount.trim()
      ? Number(maxDiscountAmount.trim())
      : undefined;
    if (parsedMaxDiscount != null && (isNaN(parsedMaxDiscount) || parsedMaxDiscount < 0)) {
      setFormError('Số tiền giảm tối đa không hợp lệ (phải ≥ 0).');
      return;
    }

    const parsedMinOrder = minOrderAmount.trim()
      ? Number(minOrderAmount.trim())
      : undefined;
    if (parsedMinOrder != null && (isNaN(parsedMinOrder) || parsedMinOrder < 0)) {
      setFormError('Giá trị đơn tối thiểu không hợp lệ (phải ≥ 0).');
      return;
    }

    const parsedUsageLimit = usageLimit.trim()
      ? Number(usageLimit.trim())
      : undefined;
    if (
      parsedUsageLimit != null &&
      (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0)
    ) {
      setFormError('Tổng lượt sử dụng phải là số nguyên dương.');
      return;
    }

    const parsedUserUsageLimit = userUsageLimit.trim()
      ? Number(userUsageLimit.trim())
      : 1;
    if (
      isNaN(parsedUserUsageLimit) ||
      !Number.isInteger(parsedUserUsageLimit) ||
      parsedUserUsageLimit <= 0
    ) {
      setFormError('Giới hạn lượt dùng trên mỗi khách hàng phải là số nguyên ≥ 1.');
      return;
    }

    if (!startDate) {
      setFormError('Vui lòng chọn thời gian bắt đầu.');
      return;
    }
    if (!endDate) {
      setFormError('Vui lòng chọn thời gian kết thúc.');
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (endMs <= startMs) {
      setFormError('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initialVoucher) {
        const updatePayload: UpdateVoucherRequest = {
          name: trimmedName,
          description: trimmedDesc || undefined,
          maxDiscountAmount: parsedMaxDiscount,
          minOrderAmount: parsedMinOrder,
          usageLimit: parsedUsageLimit,
          userUsageLimit: parsedUserUsageLimit,
          endDate: fromDateTimeLocalInput(endDate),
          active,
        };

        const updated = await updateVoucher(initialVoucher.id, updatePayload);
        onSuccess(updated, `Cập nhật voucher ${updated.code} thành công.`);
      } else {
        const createPayload: CreateVoucherRequest = {
          code: trimmedCode,
          name: trimmedName,
          description: trimmedDesc || undefined,
          discountType,
          discountValue: parsedVal,
          maxDiscountAmount: parsedMaxDiscount,
          minOrderAmount: parsedMinOrder,
          usageLimit: parsedUsageLimit,
          userUsageLimit: parsedUserUsageLimit,
          startDate: fromDateTimeLocalInput(startDate),
          endDate: fromDateTimeLocalInput(endDate),
          active,
        };

        const created = await createVoucher(createPayload);
        onSuccess(created, `Tạo mới voucher ${created.code} thành công.`);
      }
    } catch (error) {
      setFormError(
        extractErrorMessage(
          error,
          isEdit ? 'Không thể cập nhật voucher' : 'Không thể tạo mới voucher'
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
      aria-labelledby="voucher-dialog-title"
    >
      <Card className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto border-t-4 border-t-zinc-900 bg-white shadow-xl">
        <CardHeader className="space-y-1.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle id="voucher-dialog-title" className="text-lg font-bold text-zinc-900">
              {isEdit
                ? `Chỉnh sửa voucher #${initialVoucher?.id} (${initialVoucher?.code})`
                : 'Tạo mới Voucher khuyến mãi'}
            </CardTitle>
            <Badge variant="zinc">ADMIN</Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            {isEdit
              ? 'Cập nhật tên, điều kiện đơn tối thiểu, số lượt dùng và thời hạn voucher.'
              : 'Thiết lập mã ưu đãi, loại chiết khấu, thời gian áp dụng và ngân sách phát hành.'}
          </CardDescription>
        </CardHeader>

        <Separator />

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4 pt-4">
            {formError && <AuthAlert variant="error">{formError}</AuthAlert>}

            {/* Code & Name */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="v-code" className="text-xs">
                  Mã Voucher {!isEdit && <span className="text-rose-600">*</span>}
                </Label>
                <Input
                  id="v-code"
                  type="text"
                  placeholder="VD: HE2026, VIP_50K"
                  value={code}
                  disabled={isEdit || submitting}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-9 font-mono text-xs uppercase sm:text-sm"
                  required={!isEdit}
                />
                <p className="text-[10px] text-zinc-500">
                  {isEdit
                    ? 'Mã code không thể thay đổi sau khi tạo.'
                    : 'Gồm chữ cái, số, gạch ngang/dưới (3–50 ký tự).'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-name" className="text-xs">
                  Tên voucher <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="v-name"
                  type="text"
                  placeholder="VD: Ưu đãi chào hè 2026"
                  value={name}
                  disabled={submitting}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="v-desc" className="text-xs">
                Mô tả chi tiết (tùy chọn)
              </Label>
              <Input
                id="v-desc"
                type="text"
                placeholder="VD: Giảm ngay 10% cho tất cả đơn đặt sân từ thứ 2 đến thứ 6..."
                value={description}
                disabled={submitting}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Discount Type & Discount Value */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Cấu hình chiết khấu
              </span>

              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="v-type" className="text-xs">
                    Loại giảm giá
                  </Label>
                  <select
                    id="v-type"
                    value={discountType}
                    disabled={isEdit || submitting}
                    onChange={(e) =>
                      setDiscountType(e.target.value as DiscountType)
                    }
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-2xs focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (Phần trăm %)</option>
                    <option value="FIXED_AMOUNT">FIXED_AMOUNT (Số tiền cố định đ)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="v-val" className="text-xs">
                    Giá trị chiết khấu {discountType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'}
                  </Label>
                  <Input
                    id="v-val"
                    type="number"
                    min="0.01"
                    step={discountType === 'PERCENTAGE' ? '0.1' : '1000'}
                    placeholder={discountType === 'PERCENTAGE' ? 'VD: 10 (%)' : 'VD: 50000 (đ)'}
                    value={discountValue}
                    disabled={isEdit || submitting}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-9 font-sans text-xs font-semibold sm:text-sm"
                  />
                  {isEdit && (
                    <p className="text-[10px] text-zinc-500">
                      Loại và mức chiết khấu được cố định sau khi phát hành.
                    </p>
                  )}
                </div>
              </div>

              {discountType === 'PERCENTAGE' && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="v-max-discount" className="text-xs">
                    Số tiền giảm tối đa (VNĐ, tùy chọn)
                  </Label>
                  <Input
                    id="v-max-discount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="VD: 50000 (để trống nếu không giới hạn trần)"
                    value={maxDiscountAmount}
                    disabled={submitting}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="h-9 text-xs sm:text-sm"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Áp dụng cho voucher %: ngăn số tiền giảm vượt quá hạn mức tối đa cho phép.
                  </p>
                </div>
              )}
            </div>

            {/* Conditions: Min Order & Usage Limits */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-min-order" className="text-xs">
                  Đơn tối thiểu (VNĐ)
                </Label>
                <Input
                  id="v-min-order"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="VD: 100000"
                  value={minOrderAmount}
                  disabled={submitting}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-usage-limit" className="text-xs">
                  Tổng lượt dùng (Toàn hệ thống)
                </Label>
                <Input
                  id="v-usage-limit"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Trống = Vô hạn"
                  value={usageLimit}
                  disabled={submitting}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-user-limit" className="text-xs">
                  Lượt dùng / Khách hàng
                </Label>
                <Input
                  id="v-user-limit"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Mặc định: 1"
                  value={userUsageLimit}
                  disabled={submitting}
                  onChange={(e) => setUserUsageLimit(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* StartDate & EndDate */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="v-start-date" className="text-xs">
                  Thời gian bắt đầu {!isEdit && <span className="text-rose-600">*</span>}
                </Label>
                <Input
                  id="v-start-date"
                  type="datetime-local"
                  value={startDate}
                  disabled={isEdit || submitting}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                  required={!isEdit}
                />
                {isEdit && (
                  <p className="text-[10px] text-zinc-500">
                    Thời gian bắt đầu không thể thay đổi sau khi tạo.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-end-date" className="text-xs">
                  Thời gian kết thúc <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="v-end-date"
                  type="datetime-local"
                  value={endDate}
                  disabled={submitting}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Active Switch/Checkbox */}
            <div className="flex items-center space-x-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <Checkbox
                id="v-active"
                checked={active}
                onCheckedChange={(checked) => setActive(checked === true)}
                disabled={submitting}
              />
              <Label
                htmlFor="v-active"
                className="cursor-pointer text-xs font-semibold text-zinc-800"
              >
                Kích hoạt voucher ngay lập tức (Trạng thái active: Bật)
              </Label>
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
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-9 px-5 text-xs font-semibold"
            >
              {submitting
                ? 'Đang lưu...'
                : isEdit
                ? 'Lưu thay đổi'
                : 'Tạo voucher'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

