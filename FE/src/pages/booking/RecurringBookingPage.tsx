import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { ConfirmRecurringDialog } from '@/components/booking/ConfirmRecurringDialog';
import { RecurringBookingForm } from '@/components/booking/RecurringBookingForm';
import {
  type DayAvailabilityInfo,
  RecurringPreviewTable,
} from '@/components/booking/RecurringPreviewTable';
import { RecurringSuccessCard } from '@/components/booking/RecurringSuccessCard';
import { Skeleton } from '@/components/ui/skeleton';
import { extractErrorMessage } from '@/lib/auth';
import {
  computeRecurringDates,
  DAY_OF_WEEK_OPTIONS,
  estimateSlotTotal,
  extractRecurringConflicts,
  fetchCourtAvailability,
  getTodayIso,
  submitCreateRecurringBooking,
} from '@/lib/booking';
import { getComplexes, getCourts, getTimeSlots } from '@/lib/court';
import type { DayOfWeek, RecurringBookingResponse } from '@/types/booking';
import type { Complex, Court, TimeSlot } from '@/types/court';

export function RecurringBookingPage() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [errorInit, setErrorInit] = useState<string | null>(null);

  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [startDate, setStartDate] = useState<string>(getTodayIso());
  const [weeks, setWeeks] = useState<number>(4);
  const [note, setNote] = useState<string>('');

  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, DayAvailabilityInfo>
  >({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [conflictedDatesFromBackend, setConflictedDatesFromBackend] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdResponse, setCreatedResponse] = useState<RecurringBookingResponse | null>(null);

  // 1. Tải danh mục cụm sân & khung giờ ban đầu
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setLoadingInit(true);
      setErrorInit(null);
      try {
        const [compRes, slots] = await Promise.all([
          getComplexes({ size: 100, sort: 'name,asc' }),
          getTimeSlots(),
        ]);
        if (!isMounted) return;
        setComplexes(compRes.items);
        setTimeSlots(slots);
        if (compRes.items.length > 0 && compRes.items[0]) {
          setSelectedComplexId(compRes.items[0].id);
        }
        if (slots.length > 0 && slots[0]) {
          setSelectedTimeSlotId(slots[0].id);
        }
      } catch (err) {
        if (isMounted) {
          setErrorInit(extractErrorMessage(err, 'Không thể tải dữ liệu khởi tạo'));
        }
      } finally {
        if (isMounted) setLoadingInit(false);
      }
    }
    void loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải danh sách sân con khi cụm sân thay đổi
  useEffect(() => {
    if (!selectedComplexId) {
      setCourts([]);
      setSelectedCourtId(null);
      return;
    }
    let isMounted = true;
    async function loadCourts() {
      try {
        const res = await getCourts({
          complexId: selectedComplexId ?? undefined,
          size: 100,
          sort: 'name,asc',
        });
        if (!isMounted) return;
        setCourts(res.items);
        const firstAvailable = res.items.find((c) => c.status === 'AVAILABLE');
        setSelectedCourtId(firstAvailable ? firstAvailable.id : null);
      } catch (err) {
        if (isMounted) {
          setErrorInit(extractErrorMessage(err, 'Không thể tải danh sách sân con'));
        }
      }
    }
    void loadCourts();
    return () => {
      isMounted = false;
    };
  }, [selectedComplexId]);

  // 3. Tính toán chuỗi ngày lặp lại theo công thức Backend
  const recurringDatesInfo = useMemo(() => {
    return computeRecurringDates(startDate, selectedDayOfWeek, weeks);
  }, [startDate, selectedDayOfWeek, weeks]);

  // Xóa danh sách xung đột cũ khi người dùng thay đổi bất kỳ cấu hình nào
  useEffect(() => {
    setConflictedDatesFromBackend([]);
    setSubmitError(null);
  }, [selectedCourtId, selectedTimeSlotId, selectedDayOfWeek, startDate, weeks]);

  // 4. Kiểm tra tình trạng trống (Availability Preview) cho từng ngày
  const checkAvailability = useCallback(async () => {
    if (!selectedCourtId || !selectedTimeSlotId || recurringDatesInfo.targetDates.length === 0) {
      return;
    }
    setIsCheckingAll(true);
    const newAvailability: Record<string, DayAvailabilityInfo> = {};

    try {
      await Promise.all(
        recurringDatesInfo.targetDates.map(async (dateIso) => {
          try {
            const courtAvails = await fetchCourtAvailability({
              date: dateIso,
              courtId: selectedCourtId,
            });
            const courtData = courtAvails.find((c) => c.courtId === selectedCourtId);
            const slotData = courtData?.slots.find((s) => s.timeSlotId === selectedTimeSlotId);
            newAvailability[dateIso] = {
              status: slotData ? slotData.slotStatus : 'UNKNOWN',
            };
          } catch {
            newAvailability[dateIso] = { status: 'ERROR' };
          }
        })
      );
      setAvailabilityByDate(newAvailability);
    } finally {
      setIsCheckingAll(false);
    }
  }, [selectedCourtId, selectedTimeSlotId, recurringDatesInfo.targetDates]);

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  // 5. Submit tạo chuỗi đặt sân
  async function handleConfirmSubmit() {
    if (!selectedCourtId || !selectedTimeSlotId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitCreateRecurringBooking({
        courtId: selectedCourtId,
        timeSlotId: selectedTimeSlotId,
        dayOfWeek: selectedDayOfWeek,
        startDate,
        weeks,
        note: note.trim() || undefined,
      });
      setCreatedResponse(response);
      setIsConfirmOpen(false);
    } catch (err) {
      const conflicts = extractRecurringConflicts(err);
      if (conflicts.length > 0) {
        setConflictedDatesFromBackend(conflicts);
      }
      setSubmitError(
        extractErrorMessage(
          err,
          'Đặt lịch cố định thất bại. Vui lòng kiểm tra lại ngày xung đột.'
        )
      );
      setIsConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetForm() {
    setCreatedResponse(null);
    setConflictedDatesFromBackend([]);
    setSubmitError(null);
    setWeeks(4);
    setStartDate(getTodayIso());
  }

  const currentComplex = complexes.find((c) => c.id === selectedComplexId);
  const currentCourt = courts.find((c) => c.id === selectedCourtId);
  const currentSlot = timeSlots.find((s) => s.id === selectedTimeSlotId);
  const currentDayOption = DAY_OF_WEEK_OPTIONS.find((d) => d.key === selectedDayOfWeek);

  if (loadingInit) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-zinc-100" />
        <Skeleton className="h-64 w-full bg-zinc-100" />
      </div>
    );
  }

  if (createdResponse) {
    return (
      <RecurringSuccessCard
        response={createdResponse}
        onBookAnother={handleResetForm}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Đặt Lịch Cố Định Hàng Tuần (Recurring)
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Chọn sân, khung giờ và thứ trong tuần để tự động tạo lịch sinh hoạt cố định trong 1 đến 12 tuần
        </p>
      </div>

      {errorInit && <AuthAlert variant="error">{errorInit}</AuthAlert>}
      {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <RecurringBookingForm
            complexes={complexes}
            courts={courts}
            timeSlots={timeSlots}
            selectedComplexId={selectedComplexId}
            onSelectComplexId={setSelectedComplexId}
            selectedCourtId={selectedCourtId}
            onSelectCourtId={setSelectedCourtId}
            selectedTimeSlotId={selectedTimeSlotId}
            onSelectTimeSlotId={setSelectedTimeSlotId}
            selectedDayOfWeek={selectedDayOfWeek}
            onSelectDayOfWeek={setSelectedDayOfWeek}
            startDate={startDate}
            onStartDateChange={setStartDate}
            firstCalculatedDate={recurringDatesInfo.firstDate}
            weeks={weeks}
            onWeeksChange={setWeeks}
            note={note}
            onNoteChange={setNote}
            disabled={submitting}
          />
        </div>

        <div className="lg:col-span-6">
          {currentCourt && currentSlot && currentComplex ? (
            <RecurringPreviewTable
              targetDates={recurringDatesInfo.targetDates}
              courtName={currentCourt.name}
              complexName={currentComplex.name}
              slotName={currentSlot.name}
              slotPricePerHour={currentSlot.pricePerHour}
              startTime={currentSlot.startTime}
              endTime={currentSlot.endTime}
              availabilityByDate={availabilityByDate}
              isCheckingAll={isCheckingAll}
              exceedsHorizon={recurringDatesInfo.exceedsHorizon}
              conflictedDatesFromBackend={conflictedDatesFromBackend}
              onProceed={() => setIsConfirmOpen(true)}
              submitting={submitting}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-400">
              Vui lòng chọn đầy đủ Cụm sân, Sân con và Khung giờ để xem trước chuỗi ngày đặt
            </div>
          )}
        </div>
      </div>

      {currentCourt && currentSlot && currentComplex && (
        <ConfirmRecurringDialog
          open={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSubmit}
          courtName={currentCourt.name}
          complexName={currentComplex.name}
          slotName={currentSlot.name}
          startTime={currentSlot.startTime}
          endTime={currentSlot.endTime}
          dayOfWeekLabel={currentDayOption?.label ?? ''}
          firstDate={recurringDatesInfo.firstDate}
          lastDate={recurringDatesInfo.lastDate}
          weeks={weeks}
          totalAmount={
            recurringDatesInfo.targetDates.length *
            estimateSlotTotal(
              currentSlot.pricePerHour,
              currentSlot.startTime,
              currentSlot.endTime
            )
          }
          submitting={submitting}
        />
      )}
    </div>
  );
}
export default RecurringBookingPage;
