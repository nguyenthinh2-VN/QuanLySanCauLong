import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookingDateToolbar } from '@/components/booking/BookingDateToolbar';
import { CourtAvailabilityGrid } from '@/components/booking/CourtAvailabilityGrid';
import { PosBookingConfirmPanel } from '@/components/booking/PosBookingConfirmPanel';
import { PosBookingSuccessCard } from '@/components/booking/PosBookingSuccessCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/auth';
import {
  createPosBooking,
  estimateSlotTotal,
  extractErrorCode,
  fetchCourtAvailability,
  formatCurrencyVnd,
  formatTimeShort,
  getTodayIso,
} from '@/lib/booking';
import type {
  BookingResponse,
  CourtAvailabilityResponse,
  CreatePosBookingRequest,
  SelectedBookingSlot,
} from '@/types/booking';

export function PosBookingPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIso());
  const [selectedComplex, setSelectedComplex] = useState<string>('ALL');
  const [courts, setCourts] = useState<CourtAvailabilityResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SelectedBookingSlot | null>(
    null
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(
    null
  );

  const loadAvailability = useCallback(async (dateIso: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCourtAvailability({ date: dateIso });
      setCourts(data);
    } catch (error) {
      setCourts([]);
      setLoadError(
        extractErrorMessage(
          error,
          'Không thể tải danh sách sân trống cho ngày đã chọn'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailability(selectedDate);
  }, [selectedDate, loadAvailability]);

  const complexOptions = useMemo(() => {
    const names = new Set<string>();
    courts.forEach((c) => {
      if (c.complexName) names.add(c.complexName);
    });
    return Array.from(names);
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (selectedComplex === 'ALL') return courts;
    return courts.filter((c) => c.complexName === selectedComplex);
  }, [courts, selectedComplex]);

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    setSubmitError(null);
  }

  function handleSelectSlot(selection: SelectedBookingSlot) {
    setSelectedSlot(selection);
    setSubmitError(null);
  }

  function scrollToConfirmPanel() {
    const el = document.getElementById('pos-confirm-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleSubmitPosBooking(payload: CreatePosBookingRequest) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createPosBooking(payload);
      setCreatedBooking(result);
      setSelectedSlot(null);
    } catch (error) {
      const message = extractErrorMessage(
        error,
        'Đặt sân tại quầy thất bại, vui lòng kiểm tra lại thông tin'
      );
      setSubmitError(message);

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
        await loadAvailability(selectedDate);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (createdBooking) {
    return (
      <div className="py-4">
        <PosBookingSuccessCard
          booking={createdBooking}
          onBookAnother={() => {
            setCreatedBooking(null);
            setSubmitError(null);
            void loadAvailability(selectedDate);
          }}
        />
      </div>
    );
  }

  const mobileEstimatedTotal = selectedSlot
    ? estimateSlotTotal(
        selectedSlot.slot.pricePerHour,
        selectedSlot.slot.startTime,
        selectedSlot.slot.endTime
      )
    : 0;

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <BookingDateToolbar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        complexOptions={complexOptions}
        selectedComplex={selectedComplex}
        onComplexChange={setSelectedComplex}
        disabled={submitting}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <CourtAvailabilityGrid
            courts={filteredCourts}
            loading={loading}
            errorMessage={loadError}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            onRetry={() => void loadAvailability(selectedDate)}
          />
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-0">
          <PosBookingConfirmPanel
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            isAdmin={isAdmin}
            submitting={submitting}
            submitError={submitError}
            onClearSelection={() => {
              setSelectedSlot(null);
              setSubmitError(null);
            }}
            onSubmitPosBooking={handleSubmitPosBooking}
          />
        </div>
      </div>

      {/* Mobile Floating Quick-Confirm Bar (< lg) */}
      {selectedSlot && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-bold text-zinc-900">
                  {selectedSlot.courtName}
                </span>
                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {selectedSlot.complexName}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-sans font-bold tabular-nums text-amber-800">
                  {formatTimeShort(selectedSlot.slot.startTime)} &ndash;{' '}
                  {formatTimeShort(selectedSlot.slot.endTime)}
                </span>
                <span className="text-zinc-300">|</span>
                <span className="font-sans font-bold tabular-nums text-zinc-900">
                  {formatCurrencyVnd(mobileEstimatedTotal)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={scrollToConfirmPanel}
              className="shrink-0"
            >
              Nhập khách POS &darr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

