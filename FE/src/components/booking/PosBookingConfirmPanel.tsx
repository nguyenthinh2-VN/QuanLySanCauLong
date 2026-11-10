import React, { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { extractErrorMessage } from '@/lib/auth';
import {
  calculateSlotHours,
  estimateSlotTotal,
  fetchAdminUserById,
  formatCurrencyVnd,
  formatShortDateVi,
  formatTimeShort,
} from '@/lib/booking';
import type { User } from '@/types/auth';
import type {
  CreatePosBookingRequest,
  PosCustomerMode,
  SelectedBookingSlot,
} from '@/types/booking';

export interface PosBookingConfirmPanelProps {
  selectedDate: string;
  selectedSlot: SelectedBookingSlot | null;
  isAdmin: boolean;
  submitting: boolean;
  submitError: string | null;
  onClearSelection: () => void;
  onSubmitPosBooking: (payload: CreatePosBookingRequest) => Promise<void>;
}

export function PosBookingConfirmPanel({
  selectedDate,
  selectedSlot,
  isAdmin,
  submitting,
  submitError,
  onClearSelection,
  onSubmitPosBooking,
}: PosBookingConfirmPanelProps) {
  const [customerMode, setCustomerMode] = useState<PosCustomerMode>('GUEST');
  const [memberUserIdInput, setMemberUserIdInput] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const [checkingMember, setCheckingMember] = useState<boolean>(false);
  const [checkedMember, setCheckedMember] = useState<User | null>(null);
  const [memberCheckError, setMemberCheckError] = useState<string | null>(null);

  function handleSwitchMode(nextMode: PosCustomerMode) {
    setCustomerMode(nextMode);
    setValidationError(null);
    setMemberCheckError(null);
    if (nextMode === 'MEMBER') {
      setGuestName('');
      setGuestPhone('');
    } else {
      setMemberUserIdInput('');
      setCheckedMember(null);
    }
  }

  async function handleCheckMember() {
    setMemberCheckError(null);
    setValidationError(null);
    setCheckedMember(null);

    const trimmed = memberUserIdInput.trim();
    const parsedId = Number(trimmed);
    if (!trimmed || !Number.isInteger(parsedId) || parsedId <= 0) {
      setMemberCheckError('Vui lòng nhập ID thành viên là số nguyên dương');
      return;
    }

    setCheckingMember(true);
    try {
      const foundUser = await fetchAdminUserById(parsedId);
      setCheckedMember(foundUser);
    } catch (error) {
      setMemberCheckError(
        extractErrorMessage(
          error,
          `Không tìm thấy thành viên có ID #${parsedId}`
        )
      );
    } finally {
      setCheckingMember(false);
    }
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    if (!selectedSlot) {
      setValidationError('Vui lòng chọn một khung giờ còn trống trên lưới sân');
      return;
    }

    const trimmedUserId = memberUserIdInput.trim();
    const trimmedGuestName = guestName.trim();
    const trimmedGuestPhone = guestPhone.trim();
    const trimmedNote = note.trim();

    if (customerMode === 'MEMBER') {
      if (trimmedGuestName || trimmedGuestPhone) {
        setValidationError(
          'Quy tắc XOR: Chỉ được nhập ID khách thành viên HOẶC thông tin khách vãng lai, không được nhập cả hai.'
        );
        return;
      }

      const parsedId = Number(trimmedUserId);
      if (!trimmedUserId || !Number.isInteger(parsedId) || parsedId <= 0) {
        setValidationError(
          'Vui lòng nhập mã ID khách thành viên hợp lệ (số nguyên dương).'
        );
        return;
      }

      await onSubmitPosBooking({
        courtId: selectedSlot.courtId,
        bookingDate: selectedDate,
        timeSlotId: selectedSlot.slot.timeSlotId,
        userId: parsedId,
        note: trimmedNote || undefined,
      });
      return;
    }

    // customerMode === 'GUEST'
    if (trimmedUserId) {
      setValidationError(
        'Quy tắc XOR: Chỉ được nhập thông tin khách vãng lai HOẶC ID thành viên, không được nhập cả hai.'
      );
      return;
    }

    if (!trimmedGuestName || !trimmedGuestPhone) {
      setValidationError(
        'Khách vãng lai bắt buộc phải nhập đầy đủ cả Họ tên và Số điện thoại.'
      );
      return;
    }

    if (trimmedGuestName.length > 100) {
      setValidationError(
        'Tên khách vãng lai không được vượt quá 100 ký tự.'
      );
      return;
    }

    if (trimmedGuestPhone.length > 20) {
      setValidationError(
        'Số điện thoại khách vãng lai không được vượt quá 20 ký tự.'
      );
      return;
    }

    await onSubmitPosBooking({
      courtId: selectedSlot.courtId,
      bookingDate: selectedDate,
      timeSlotId: selectedSlot.slot.timeSlotId,
      guestName: trimmedGuestName,
      guestPhone: trimmedGuestPhone,
      note: trimmedNote || undefined,
    });
  }

  if (!selectedSlot) {
    return (
      <Card
        id="pos-confirm-panel"
        className="border-zinc-200/90 bg-white shadow-xs"
      >
        <CardHeader className="px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-zinc-900">
              Phiếu đặt sân tại quầy (POS)
            </CardTitle>
            <Badge variant="zinc">Tại quầy</Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Chọn một khung giờ còn trống ở bảng bên trái để nhập thông tin khách
            và tạo đơn xác nhận ngay (`CONFIRMED`).
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-5">
          {submitError && (
            <div className="mb-4">
              <AuthAlert variant="error">{submitError}</AuthAlert>
            </div>
          )}
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 p-5 text-center">
            <Badge variant="amber" className="mb-2 font-semibold">
              Chưa chọn khung giờ
            </Badge>
            <p className="text-xs leading-relaxed text-zinc-600">
              Bấm vào một ô khung giờ có trạng thái{' '}
              <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-semibold text-zinc-900">
                Còn trống
              </span>{' '}
              để chọn đối tượng khách (Thành viên / Vãng lai) và xuất phiếu đặt
              sân tại quầy.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { courtName, complexName, slot } = selectedSlot;
  const durationHours = calculateSlotHours(slot.startTime, slot.endTime);
  const estimatedTotal = estimateSlotTotal(
    slot.pricePerHour,
    slot.startTime,
    slot.endTime
  );

  return (
    <Card
      id="pos-confirm-panel"
      className="border-t-4 border-t-zinc-900 border-zinc-200/90 bg-white shadow-sm lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto"
    >
      <CardHeader className="px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-zinc-900">
            Phiếu đặt sân tại quầy (POS)
          </CardTitle>
          <Badge variant="sky" className="font-semibold">
            Trạng thái tạo: CONFIRMED
          </Badge>
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Đơn đặt tại quầy được xác nhận ngay lập tức cho khách thành viên hoặc
          khách vãng lai.
        </CardDescription>
      </CardHeader>

      <Separator />

      <form onSubmit={handleFormSubmit} noValidate>
        <CardContent className="space-y-4 px-5 py-4">
          {validationError && (
            <AuthAlert variant="error">{validationError}</AuthAlert>
          )}
          {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}

          {/* Selected Slot Summary */}
          <div className="space-y-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3 text-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Sân &amp; Cụm sân đã chọn
              </span>
              <p className="text-sm sm:text-base font-bold text-zinc-900">
                {courtName}
              </p>
              <div>
                <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {complexName}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Ngày đặt
              </span>
              <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-zinc-900">
                {formatShortDateVi(selectedDate)} ({selectedDate})
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Khung giờ chơi
              </span>
              <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-amber-900">
                {formatTimeShort(slot.startTime)} &ndash;{' '}
                {formatTimeShort(slot.endTime)} ({durationHours} giờ)
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Đơn giá khung giờ
              </span>
              <span className="font-sans text-xs font-bold tabular-nums text-indigo-700">
                {formatCurrencyVnd(slot.pricePerHour)} / giờ
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  Tạm tính tại quầy
                </span>
                <span className="font-sans text-base sm:text-lg font-bold tabular-nums text-zinc-900">
                  {formatCurrencyVnd(estimatedTotal)}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                * Tổng tiền chính thức do hệ thống Backend tính toán khi tạo đơn.
              </p>
            </div>
          </div>

          {/* Customer Type Toggle (Strict XOR) */}
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Đối tượng khách hàng (Chọn 1 trong 2)
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                Quy tắc XOR
              </Badge>
            </div>

            <div
              role="group"
              aria-label="Chọn đối tượng khách hàng"
              className="grid grid-cols-2 gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100/80 p-1"
            >
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSwitchMode('GUEST')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  customerMode === 'GUEST'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Khách vãng lai
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSwitchMode('MEMBER')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  customerMode === 'MEMBER'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Khách thành viên
              </button>
            </div>

            {customerMode === 'GUEST' ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="pos-guest-name" className="text-xs">
                    Họ và tên khách vãng lai{' '}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="pos-guest-name"
                    type="text"
                    maxLength={100}
                    placeholder="VD: Nguyễn Văn Khách"
                    value={guestName}
                    disabled={submitting}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pos-guest-phone" className="text-xs">
                    Số điện thoại liên hệ{' '}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="pos-guest-phone"
                    type="tel"
                    maxLength={20}
                    placeholder="VD: 0912345678"
                    value={guestPhone}
                    disabled={submitting}
                    onChange={(e) => {
                      setGuestPhone(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="pos-member-id" className="text-xs">
                    Mã ID khách thành viên (`userId`){' '}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pos-member-id"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="VD: 5"
                      value={memberUserIdInput}
                      disabled={submitting || checkingMember}
                      onChange={(e) => {
                        setMemberUserIdInput(e.target.value);
                        setCheckedMember(null);
                        setMemberCheckError(null);
                        if (validationError) setValidationError(null);
                      }}
                      className="h-9 text-xs sm:text-sm font-mono tabular-nums"
                    />
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          submitting ||
                          checkingMember ||
                          !memberUserIdInput.trim()
                        }
                        onClick={() => void handleCheckMember()}
                        className="h-9 shrink-0 px-3 text-xs font-semibold"
                      >
                        {checkingMember ? 'Đang tra cứu...' : 'Kiểm tra'}
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {isAdmin
                      ? 'Bạn đang đăng nhập quyền ADMIN: có thể bấm "Kiểm tra" để xem trước tên & email thành viên.'
                      : 'Nhập mã ID thành viên (số). Hệ thống Backend sẽ xác thực tài khoản khi tạo đơn.'}
                  </p>
                </div>

                {memberCheckError && (
                  <AuthAlert variant="error">{memberCheckError}</AuthAlert>
                )}

                {checkedMember && (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        Thành viên #{checkedMember.id}: {checkedMember.fullName}
                      </span>
                      <Badge
                        variant={
                          checkedMember.active ? 'zinc' : 'destructive'
                        }
                      >
                        {checkedMember.active ? 'Đang hoạt động' : 'Đã khóa'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-zinc-600">
                      Email: {checkedMember.email} &middot; SĐT:{' '}
                      {checkedMember.phone}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <Label htmlFor="pos-note-input" className="text-xs">
              Ghi chú đơn tại quầy (tùy chọn)
            </Label>
            <Input
              id="pos-note-input"
              type="text"
              maxLength={500}
              placeholder="VD: Khách đã thanh toán tiền mặt tại quầy..."
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" className="h-9 w-full" disabled={submitting}>
              {submitting
                ? 'Đang tạo đơn tại quầy...'
                : 'Xác nhận đặt sân tại quầy (POS)'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              disabled={submitting}
              onClick={onClearSelection}
            >
              Bỏ chọn khung giờ
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
