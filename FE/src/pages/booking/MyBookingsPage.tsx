import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import {
  MyBookingsFilterBar,
  type StatusFilterValue,
} from '@/components/booking/MyBookingsFilterBar';
import { MyBookingsTable } from '@/components/booking/MyBookingsTable';
import { RescheduleBookingDialog } from '@/components/booking/RescheduleBookingDialog';
import { extractErrorMessage } from '@/lib/auth';
import { fetchMyBookings } from '@/lib/booking';
import type {
  BookingResponse,
  BookingSortParam,
  PageResponse,
} from '@/types/booking';

export function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sort, setSort] = useState<BookingSortParam>('createdAt,desc');
  const [page, setPage] = useState<number>(0);

  const [pageData, setPageData] =
    useState<PageResponse<BookingResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const [cancellingBooking, setCancellingBooking] =
    useState<BookingResponse | null>(null);
  const [reschedulingBooking, setReschedulingBooking] =
    useState<BookingResponse | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchMyBookings({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: 10,
        sort,
      });
      setPageData(data);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể tải danh sách lịch đặt của bạn')
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate, page, sort]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  function handleResetFilters() {
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setSort('createdAt,desc');
    setPage(0);
  }

  return (
    <div className="space-y-6">
      {feedbackBanner && (
        <AuthAlert variant="success">{feedbackBanner}</AuthAlert>
      )}

      <MyBookingsFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={(next) => {
          setStatusFilter(next);
          setPage(0);
          setFeedbackBanner(null);
        }}
        fromDate={fromDate}
        onFromDateChange={(next) => {
          setFromDate(next);
          setPage(0);
          setFeedbackBanner(null);
        }}
        toDate={toDate}
        onToDateChange={(next) => {
          setToDate(next);
          setPage(0);
          setFeedbackBanner(null);
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(0);
          setFeedbackBanner(null);
        }}
        onResetFilters={handleResetFilters}
        disabled={loading}
      />

      <MyBookingsTable
        pageData={pageData}
        loading={loading}
        errorMessage={errorMessage}
        onRetry={() => void loadBookings()}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          setFeedbackBanner(null);
        }}
        onOpenCancel={(booking) => {
          setFeedbackBanner(null);
          setCancellingBooking(booking);
        }}
        onOpenReschedule={(booking) => {
          setFeedbackBanner(null);
          setReschedulingBooking(booking);
        }}
      />

      <CancelBookingDialog
        booking={cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        onCancelled={(updated) => {
          setCancellingBooking(null);
          setFeedbackBanner(
            `Đã hủy đơn đặt sân #${updated.id} thành công (Trạng thái: CANCELLED).`
          );
          void loadBookings();
        }}
      />

      <RescheduleBookingDialog
        booking={reschedulingBooking}
        onClose={() => setReschedulingBooking(null)}
        onRescheduled={(updated) => {
          setReschedulingBooking(null);
          setFeedbackBanner(
            `Đã đổi lịch đơn đặt sân #${updated.id} sang ${updated.courtName} ngày ${updated.bookingDate} (${updated.startTime.slice(0, 5)} – ${updated.endTime.slice(0, 5)}).`
          );
          void loadBookings();
        }}
      />
    </div>
  );
}

