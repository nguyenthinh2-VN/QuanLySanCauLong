import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { BookingDetailDialog } from '@/components/booking/BookingDetailDialog';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { RescheduleBookingDialog } from '@/components/booking/RescheduleBookingDialog';
import { StaffBookingFilterBar } from '@/components/booking/StaffBookingFilterBar';
import { StaffBookingsTable } from '@/components/booking/StaffBookingsTable';
import { extractErrorMessage, getPrimaryRole } from '@/lib/auth';
import {
  checkInBooking,
  fetchBookingById,
  fetchBookings,
  getTodayIso,
} from '@/lib/booking';
import { getComplexes, getCourts } from '@/lib/court';
import { useAuth } from '@/hooks/useAuth';
import type { BookingResponse, BookingStatus } from '@/types/booking';
import type { Complex, Court } from '@/types/court';

const PAGE_SIZE = 10;

export function StaffBookingsPage() {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const isAdmin = primaryRole === 'ADMIN';

  // Filter state
  const [bookingDate, setBookingDate] = useState(getTodayIso());
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [guestPhone, setGuestPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(0);

  // Complexes & Courts for filter
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  // List data
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reschedule / Cancel dialog (ADMIN only)
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingResponse | null>(null);

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load complexes once
  useEffect(() => {
    getComplexes({ size: 100, sort: 'name,asc' })
      .then((r) => setComplexes(r.items))
      .catch(() => setComplexes([]));
  }, []);

  // Load courts when complex changes
  useEffect(() => {
    if (selectedComplexId == null) {
      setCourts([]);
      return;
    }
    getCourts({ complexId: selectedComplexId, size: 100, sort: 'name,asc' })
      .then((r) => setCourts(r.items))
      .catch(() => setCourts([]));
  }, [selectedComplexId]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const result = await fetchBookings({
        bookingDate,
        status: status || undefined,
        courtId: selectedCourtId ?? undefined,
        complexId: selectedComplexId ?? undefined,
        guestPhone: guestPhone.trim() || undefined,
        userId: userId.trim() ? Number(userId.trim()) : undefined,
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      });
      setBookings(result.items);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setPageError(extractErrorMessage(err, 'Không thể tải danh sách đơn đặt sân'));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [bookingDate, status, selectedCourtId, selectedComplexId, guestPhone, userId, page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  function handleFilterChange<T>(setter: (val: T) => void) {
    return (val: T) => {
      setter(val);
      setPage(0);
    };
  }

  function handleReset() {
    setBookingDate(getTodayIso());
    setStatus('');
    setSelectedComplexId(null);
    setSelectedCourtId(null);
    setCourts([]);
    setGuestPhone('');
    setUserId('');
    setPage(0);
  }

  async function handleViewDetail(booking: BookingResponse) {
    setDetailOpen(true);
    setDetailBooking(null);
    setDetailLoading(true);
    try {
      const full = await fetchBookingById(booking.id);
      setDetailBooking(full);
    } catch {
      setDetailBooking(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCheckIn(booking: BookingResponse) {
    try {
      await checkInBooking(booking.id);
      setSuccessMsg(`Check-in đơn #${booking.id} thành công!`);
      setDetailOpen(false);
      void fetchList();
    } catch (err) {
      setPageError(extractErrorMessage(err, 'Check-in thất bại'));
    }
  }

  function handleOpenReschedule(booking: BookingResponse) {
    setDetailOpen(false);
    setRescheduleTarget(booking);
  }

  function handleOpenCancel(booking: BookingResponse) {
    setDetailOpen(false);
    setCancelTarget(booking);
  }

  function handleRescheduled() {
    setRescheduleTarget(null);
    setSuccessMsg('Đổi lịch đặt sân thành công!');
    void fetchList();
  }

  function handleCancelled() {
    setCancelTarget(null);
    setSuccessMsg('Hủy đơn đặt sân thành công!');
    void fetchList();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Quản lý đặt sân</h1>
          <p className="text-xs text-zinc-500">
            Xem và điều phối toàn bộ đơn đặt sân trong ngày
          </p>
        </div>
      </div>

      {successMsg && (
        <AuthAlert variant="success">
          {successMsg}
        </AuthAlert>
      )}
      {pageError && (
        <AuthAlert variant="error">
          {pageError}
        </AuthAlert>
      )}

      <StaffBookingFilterBar
        bookingDate={bookingDate}
        onBookingDateChange={handleFilterChange(setBookingDate)}
        status={status}
        onStatusChange={handleFilterChange(setStatus)}
        selectedComplexId={selectedComplexId}
        complexes={complexes}
        onComplexChange={handleFilterChange(setSelectedComplexId)}
        selectedCourtId={selectedCourtId}
        courts={courts}
        onCourtChange={handleFilterChange(setSelectedCourtId)}
        guestPhone={guestPhone}
        onGuestPhoneChange={handleFilterChange(setGuestPhone)}
        userId={userId}
        onUserIdChange={handleFilterChange(setUserId)}
        onReset={handleReset}
        loading={loading}
      />

      <StaffBookingsTable
        bookings={bookings}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onViewDetail={handleViewDetail}
        onCheckIn={handleCheckIn}
        onReschedule={isAdmin ? handleOpenReschedule : undefined}
        onCancel={isAdmin ? handleOpenCancel : undefined}
        isAdmin={isAdmin}
      />

      <BookingDetailDialog
        open={detailOpen}
        booking={detailBooking}
        loading={detailLoading}
        onClose={() => setDetailOpen(false)}
        onCheckIn={handleCheckIn}
        onReschedule={isAdmin ? handleOpenReschedule : undefined}
        onCancel={isAdmin ? handleOpenCancel : undefined}
        isAdmin={isAdmin}
      />

      {isAdmin && (
        <>
          <RescheduleBookingDialog
            booking={rescheduleTarget}
            onClose={() => setRescheduleTarget(null)}
            onRescheduled={handleRescheduled}
          />
          <CancelBookingDialog
            booking={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onCancelled={handleCancelled}
          />
        </>
      )}
    </div>
  );
}
