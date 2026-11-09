import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { CourtAvailabilityGrid } from '@/components/booking/CourtAvailabilityGrid';
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
import {
  extractErrorCode,
  fetchCourtAvailability,
  formatShortDateVi,
  formatTimeShort,
  getMaxBookingDateIso,
  getTodayIso,
  shiftDateIso,
  submitUpdateBooking,
} from '@/lib/booking';
import type {
  BookingResponse,
  CourtAvailabilityResponse,
  SelectedBookingSlot,
} from '@/types/booking';

export interface RescheduleBookingDialogProps {
  booking: BookingResponse | null;
  onClose: () => void;
  onRescheduled: (updatedBooking: BookingResponse) => void;
}

export function RescheduleBookingDialog({
  booking,
  onClose,
  onRescheduled,
}: RescheduleBookingDialogProps) {
  const todayIso = getTodayIso();
  const maxDateIso = getMaxBookingDateIso(30);

  const [targetDate, setTargetDate] = useState<string>(todayIso);
  const [courts, setCourts] = useState<CourtAvailabilityResponse[]>([]);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(false);
  const [gridError, setGridError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SelectedBookingSlot | null>(
    null
  );
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadAvailabilityForDate = useCallback(async (dateIso: string) => {
    setLoadingGrid(true);
    setGridError(null);
    try {
      const data = await fetchCourtAvailability({ date: dateIso });
      setCourts(data);
    } catch (error) {
      setCourts([]);
      setGridError(
        extractErrorMessage(
          error,
          'Không thể tải lịch trống cho ngày đã chọn'
        )
      );
    } finally {
      setLoadingGrid(false);
    }
  }, []);

  useEffect(() => {
    if (!booking) return;
    const initialDate =
      booking.bookingDate >= todayIso && booking.bookingDate <= maxDateIso
        ? booking.bookingDate
        : todayIso;
    setTargetDate(initialDate);
    setNote(booking.note ?? '');
    setSelectedSlot(null);
    setSubmitError(null);
    void loadAvailabilityForDate(initialDate);
  }, [booking, todayIso, maxDateIso, loadAvailabilityForDate]);

  if (!booking) return null;

  function handleDateChange(newDate: string) {
    setTargetDate(newDate);
    setSelectedSlot(null);
    setSubmitError(null);
    void loadAvailabilityForDate(newDate);
  }

  async function handleConfirmReschedule() {
    if (!booking) return;

    const targetCourtId = selectedSlot?.courtId ?? booking.courtId;
    const targetTimeSlotId =
      selectedSlot?.slot.timeSlotId ?? booking.timeSlotId;
    const trimmedNote = note.trim();

    const hasCourtChange = targetCourtId !== booking.courtId;
    const hasDateChange = targetDate !== booking.bookingDate;
    const hasSlotChange = targetTimeSlotId !== booking.timeSlotId;
    const hasNoteChange = trimmedNote !== (booking.note ?? '');

    if (!hasCourtChange && !hasDateChange && !hasSlotChange && !hasNoteChange) {
      setSubmitError(
        'Vui lòng chọn một khung giờ/sân/ngày mới hoặc cập nhật ghi chú trước khi lưu.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const updated = await submitUpdateBooking(booking.id, {
        courtId: targetCourtId,
        bookingDate: targetDate,
        timeSlotId: targetTimeSlotId,
        note: trimmedNote,
      });
      onRescheduled(updated);
    } catch (error) {
      setSubmitError(
        extractErrorMessage(
          error,
          'Không thể đổi lịch đơn đặt sân ở trạng thái hiện tại'
        )
      );

      const errorCode = extractErrorCode(error);
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (
        status === 409 ||
        errorCode === 'SLOT_ALREADY_BOOKED' ||
        errorCode === 'COURT_NOT_AVAILABLE'
      ) {
        setSelectedSlot(null);
        await loadAvailabilityForDate(targetDate);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canGoPrev = targetDate > todayIso;
  const canGoNext = targetDate < maxDateIso;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-dialog-title"
    >
      <Card className="flex max-h-[90dvh] w-full max-w-4xl flex-col border-t-4 border-t-amber-600 bg-white shadow-xl">
        <CardHeader className="shrink-0 border-b border-zinc-100 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle
                id="reschedule-dialog-title"
                className="text-base sm:text-lg font-bold text-zinc-900"
              >
                Đổi lịch đặt sân &mdash; Đơn #{booking.id}
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                <span>Lịch hiện tại:</span>
                <strong className="text-zinc-900">{booking.courtName}</strong>
                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  {booking.complexName}
                </span>
                <span>&middot;</span>
                <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[11px] font-bold tabular-nums text-zinc-900">
                  {formatShortDateVi(booking.bookingDate)}
                </span>
                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-sans text-[11px] font-bold tabular-nums text-amber-900">
                  {formatTimeShort(booking.startTime)} &ndash;{' '}
                  {formatTimeShort(booking.endTime)}
                </span>
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}

          {/* Date Selector & Note */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="reschedule-date-input"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                1. Chọn ngày đặt mới
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting || !canGoPrev}
                  onClick={() =>
                    handleDateChange(shiftDateIso(targetDate, -1))
                  }
                >
                  &larr;
                </Button>
                <Input
                  id="reschedule-date-input"
                  type="date"
                  min={todayIso}
                  max={maxDateIso}
                  value={targetDate}
                  disabled={submitting}
                  onChange={(e) => {
                    if (e.target.value) handleDateChange(e.target.value);
                  }}
                  className="h-9 font-sans text-xs tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting || !canGoNext}
                  onClick={() =>
                    handleDateChange(shiftDateIso(targetDate, 1))
                  }
                >
                  &rarr;
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="reschedule-note-input"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                2. Ghi chú cập nhật (tùy chọn)
              </Label>
              <Input
                id="reschedule-note-input"
                type="text"
                maxLength={500}
                value={note}
                disabled={submitting}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú mới nếu cần..."
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Selected New Slot Banner */}
          {selectedSlot && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
              <span className="font-semibold text-amber-800">
                Khung giờ mới đã chọn:{' '}
              </span>
              <strong className="text-zinc-900">
                {selectedSlot.courtName}
              </strong>{' '}
              <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                {selectedSlot.complexName}
              </span>{' '}
              &middot; Ngày{' '}
              <strong className="font-sans tabular-nums text-zinc-900">
                {formatShortDateVi(targetDate)}
              </strong>{' '}
              &middot;{' '}
              <span className="rounded border border-amber-300 bg-white px-1.5 py-0.5 font-sans font-bold tabular-nums text-amber-900">
                {formatTimeShort(selectedSlot.slot.startTime)} &ndash;{' '}
                {formatTimeShort(selectedSlot.slot.endTime)}
              </span>
            </div>
          )}

          {/* Availability Grid (Reused from /booking) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              3. Chọn sân &amp; khung giờ trống mới
            </span>
            <CourtAvailabilityGrid
              courts={courts}
              loading={loadingGrid}
              errorMessage={gridError}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                setSubmitError(null);
              }}
              onRetry={() => void loadAvailabilityForDate(targetDate)}
              compact
            />
          </div>
        </CardContent>

        <CardFooter className="shrink-0 flex justify-end gap-2.5 border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={handleConfirmReschedule}
          >
            {submitting ? 'Đang lưu thay đổi...' : 'Lưu lịch đặt mới'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
