import React, { useEffect, useState } from 'react';
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
import { extractErrorMessage } from '@/lib/auth';
import { fetchMyBookings, formatCurrencyVnd, formatShortDateVi, formatTimeShort } from '@/lib/booking';
import { applyVoucher } from '@/lib/voucher';
import type { BookingResponse } from '@/types/booking';
import type { ApplyVoucherResponse } from '@/types/voucher';
import { ConfirmApplyVoucherDialog } from '@/components/voucher/ConfirmApplyVoucherDialog';

export interface ApplyVoucherFormProps {
  initialCode: string;
  onCodeApplied: (result: ApplyVoucherResponse) => void;
}

export function ApplyVoucherForm({
  initialCode,
  onCodeApplied,
}: ApplyVoucherFormProps) {
  const [bookingIdInput, setBookingIdInput] = useState<string>('');
  const [code, setCode] = useState<string>(initialCode);

  const [pendingBookings, setPendingBookings] = useState<BookingResponse[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  // Sync external initialCode when user clicks "Áp dụng ngay" on a voucher card
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setValidationError(null);
    }
  }, [initialCode]);

  // Load user's PENDING bookings to offer quick selection
  useEffect(() => {
    let mounted = true;
    async function loadPending() {
      setLoadingBookings(true);
      try {
        const res = await fetchMyBookings({ status: 'PENDING', size: 10 });
        if (mounted) {
          setPendingBookings(res.items);
          if (res.items.length > 0 && !bookingIdInput) {
            setBookingIdInput(String(res.items[0].id));
          }
        }
      } catch {
        // Non-blocking: user can still enter booking ID manually
      } finally {
        if (mounted) setLoadingBookings(false);
      }
    }
    void loadPending();
    return () => {
      mounted = false;
    };
  }, []);

  function handleStartApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);
    setErrorMessage(null);

    const trimmedId = bookingIdInput.trim();
    const parsedId = Number(trimmedId);
    if (!trimmedId || !Number.isInteger(parsedId) || parsedId <= 0) {
      setValidationError('Vui lòng nhập hoặc chọn mã đơn đặt sân hợp lệ (số nguyên dương).');
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setValidationError('Vui lòng nhập mã voucher ưu đãi.');
      return;
    }

    setConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    setErrorMessage(null);

    const parsedId = Number(bookingIdInput.trim());
    const trimmedCode = code.trim().toUpperCase();

    try {
      const result = await applyVoucher({
        bookingId: parsedId,
        code: trimmedCode,
      });
      setConfirmOpen(false);
      onCodeApplied(result);
    } catch (error) {
      setConfirmOpen(false);
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể áp dụng voucher cho đơn đặt sân này'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card id="apply-voucher-section" className="border-t-4 border-t-zinc-900 border-zinc-200/90 bg-white shadow-sm">
      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-zinc-900">
            Áp dụng mã ưu đãi vào đơn đặt sân
          </CardTitle>
          <Badge variant="zinc">CUSTOMER</Badge>
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Nhập mã voucher hoặc chọn từ danh sách bên trái để nhận chiết khấu trực tiếp cho đơn đặt sân của bạn.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleStartApply} noValidate>
        <CardContent className="space-y-4 pt-1">
          {validationError && (
            <AuthAlert variant="error">{validationError}</AuthAlert>
          )}
          {errorMessage && (
            <AuthAlert variant="error">{errorMessage}</AuthAlert>
          )}

          {/* Quick select from user's PENDING bookings */}
          {pendingBookings.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Gợi ý đơn chờ thanh toán của bạn (PENDING)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pendingBookings.map((b) => {
                  const isSelected = bookingIdInput === String(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setBookingIdInput(String(b.id));
                        setValidationError(null);
                        setErrorMessage(null);
                      }}
                      className={`rounded-md px-2.5 py-1 text-left text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Đơn #{b.id} &middot; {b.courtName} ({formatShortDateVi(b.bookingDate)} {formatTimeShort(b.startTime)}-{formatTimeShort(b.endTime)}) &middot; {formatCurrencyVnd(b.totalAmount)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Booking ID Input */}
          <div className="space-y-1.5">
            <Label htmlFor="apply-booking-id" className="text-xs font-semibold">
              Mã đơn đặt sân (Booking ID) <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="apply-booking-id"
              type="number"
              min={1}
              step={1}
              placeholder="VD: 15 (chọn từ gợi ý ở trên hoặc nhập mã số)"
              value={bookingIdInput}
              disabled={submitting}
              onChange={(e) => {
                setBookingIdInput(e.target.value);
                setValidationError(null);
              }}
              className="h-9 font-mono text-xs tabular-nums sm:text-sm"
              required
            />
            {/* Guard PENDING Explanation */}
            <p className="text-[11px] leading-relaxed text-amber-900 bg-amber-50 rounded-md border border-amber-200 p-2">
              <strong>Quy định bắt buộc:</strong> Voucher chỉ áp dụng cho đơn ở trạng thái{' '}
              <span className="font-bold underline">PENDING (chờ thanh toán)</span>. Các đơn đặt tại quầy (POS đã CONFIRMED) hoặc đơn đã hoàn thành/hủy không thể áp mã.
            </p>
          </div>

          {/* Voucher Code Input */}
          <div className="space-y-1.5">
            <Label htmlFor="apply-voucher-code" className="text-xs font-semibold">
              Mã ưu đãi (Voucher Code) <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="apply-voucher-code"
              type="text"
              placeholder="VD: HE2026, VIP50K..."
              value={code}
              disabled={submitting}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setValidationError(null);
              }}
              className="h-9 font-mono text-xs uppercase font-bold sm:text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || loadingBookings}
            className="h-9 w-full font-semibold shadow-xs"
          >
            {submitting ? 'Đang kiểm tra & áp mã...' : 'Áp dụng ưu đãi vào đơn'}
          </Button>
        </CardContent>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmApplyVoucherDialog
        open={confirmOpen}
        bookingId={bookingIdInput.trim() ? Number(bookingIdInput.trim()) : null}
        code={code.trim().toUpperCase()}
        submitting={submitting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmSubmit()}
      />
    </Card>
  );
}

