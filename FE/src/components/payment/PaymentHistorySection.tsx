import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import {
  PaymentHistoryFilterBar,
  type PaymentMethodFilterValue,
  type PaymentStatusFilterValue,
} from '@/components/payment/PaymentHistoryFilterBar';
import { PaymentHistoryTable } from '@/components/payment/PaymentHistoryTable';
import { PaymentInvoiceDialog } from '@/components/payment/PaymentInvoiceDialog';
import { extractErrorMessage } from '@/lib/auth';
import { getMyPayments, getPayments } from '@/lib/payment';
import type { PageResponse } from '@/types/booking';
import type { PaymentResponse, PaymentSortParam } from '@/types/payment';

export interface PaymentHistorySectionProps {
  mode: 'staff' | 'customer';
  refreshTrigger?: number;
  onSelectRefund?: (paymentId: number) => void;
}

export function PaymentHistorySection({
  mode,
  refreshTrigger = 0,
  onSelectRefund,
}: PaymentHistorySectionProps) {
  const [statusFilter, setStatusFilter] =
    useState<PaymentStatusFilterValue>('ALL');
  const [methodFilter, setMethodFilter] =
    useState<PaymentMethodFilterValue>('ALL');
  const [bookingIdInput, setBookingIdInput] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sort, setSort] = useState<PaymentSortParam>('createdAt,desc');
  const [page, setPage] = useState<number>(0);

  const [pageData, setPageData] =
    useState<PageResponse<PaymentResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null
  );

  const loadPayments = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setErrorMessage('Ngày bắt đầu không được sau ngày kết thúc.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const parsedBookingId = parseInt(bookingIdInput.trim(), 10);
      const query = {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        paymentMethod: methodFilter === 'ALL' ? undefined : methodFilter,
        bookingId:
          mode === 'staff' && !isNaN(parsedBookingId) && parsedBookingId > 0
            ? parsedBookingId
            : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: 10,
        sort,
      };
      const data =
        mode === 'staff' ? await getPayments(query) : await getMyPayments(query);
      setPageData(data);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể tải lịch sử giao dịch thanh toán')
      );
    } finally {
      setLoading(false);
    }
  }, [
    mode,
    statusFilter,
    methodFilter,
    bookingIdInput,
    fromDate,
    toDate,
    page,
    sort,
    refreshTrigger,
  ]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  function handleReset() {
    setStatusFilter('ALL');
    setMethodFilter('ALL');
    setBookingIdInput('');
    setFromDate('');
    setToDate('');
    setSort('createdAt,desc');
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <PaymentHistoryFilterBar
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(0);
        }}
        methodFilter={methodFilter}
        onMethodChange={(val) => {
          setMethodFilter(val);
          setPage(0);
        }}
        showBookingIdFilter={mode === 'staff'}
        bookingIdInput={bookingIdInput}
        onBookingIdChange={(val) => {
          setBookingIdInput(val);
          setPage(0);
        }}
        fromDate={fromDate}
        onFromDateChange={(val) => {
          setFromDate(val);
          setPage(0);
        }}
        toDate={toDate}
        onToDateChange={(val) => {
          setToDate(val);
          setPage(0);
        }}
        sort={sort}
        onSortChange={(val) => {
          setSort(val);
          setPage(0);
        }}
        onReset={handleReset}
      />

      {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

      <PaymentHistoryTable
        payments={pageData?.items ?? []}
        loading={loading}
        onViewInvoice={(id) => setSelectedInvoiceId(id)}
        onSelectRefund={onSelectRefund}
        page={pageData?.page ?? 0}
        totalPages={pageData?.totalPages ?? 1}
        totalElements={pageData?.totalElements ?? 0}
        onPageChange={setPage}
      />

      <PaymentInvoiceDialog
        paymentId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}

