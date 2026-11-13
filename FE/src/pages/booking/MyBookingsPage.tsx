import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import {
  MyBookingsFilterBar,
  type StatusFilterValue,
} from '@/components/booking/MyBookingsFilterBar';
import { MyBookingsTable } from '@/components/booking/MyBookingsTable';
import { RescheduleBookingDialog } from '@/components/booking/RescheduleBookingDialog';
import { PaymentDialog } from '@/components/payment/PaymentDialog';
import { PaymentResultCard } from '@/components/payment/PaymentResultCard';
import { extractErrorMessage } from '@/lib/auth';
import { fetchMyBookings } from '@/lib/booking';
import type {
  BookingResponse,
  BookingSortParam,
  PageResponse,
} from '@/types/booking';
import type { PaymentResponse } from '@/types/payment';

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
  const [payingBooking, setPayingBooking] =
    useState<BookingResponse | null>(null);
  const [paymentSuccess, setPaymentSuccess] =
    useState<PaymentResponse | null>(null);

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
      {paymentSuccess && (
        <PaymentResultCard
          payment={paymentSuccess}
          title="Thanh toán đơn đặt sân thành công"
          description={`Giao dịch đã được ghi nhận. Đơn đặt sân #${paymentSuccess.bookingId} đã chuyển sang trạng thái CONFIRMED.`}
          onDone={() => setPaymentSuccess(null)}
          doneLabel="Đóng biên nhận"
        />
      )}

      {feedbackBanner && (
        <AuthAlert variant="success">{feedbackBanner}</AuthAlert>
      )}

      <MyBookingsFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={(next) => {
          setStatusFilter(next);
          setPage(0);
          setFeedbackBanner(null);
          setPaymentSuccess(null);
        }}
        fromDate={fromDate}
        onFromDateChange={(next) => {
          setFromDate(next);
          setPage(0);
          setFeedbackBanner(null);
          setPaymentSuccess(null);
        }}
        toDate={toDate}
        onToDateChange={(next) => {
          setToDate(next);
          setPage(0);
          setFeedbackBanner(null);
          setPaymentSuccess(null);
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(0);
          setFeedbackBanner(null);
          setPaymentSuccess(null);
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
        onOpenPayment={(booking) => {
          setFeedbackBanner(null);
          setPaymentSuccess(null);
          setPayingBooking(booking);
        }}
        onOpenCancel={(booking) => {
          setFeedbackBanner(null);
          setPaymentSuccess(null);
          setCancellingBooking(booking);
        }}
        onOpenReschedule={(booking) => {
          setFeedbackBanner(null);
          setPaymentSuccess(null);
          setReschedulingBooking(booking);
        }}
      />

      <PaymentDialog
        booking={payingBooking}
        open={Boolean(payingBooking)}
        onClose={() => setPayingBooking(null)}
        onSuccess={(payment) => {
          setPayingBooking(null);
          setPaymentSuccess(payment);
          setFeedbackBanner(null);
          void loadBookings();
        }}
        onNeedRefresh={() => void loadBookings()}
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

