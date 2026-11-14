import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentSortParam,
  type PaymentStatus,
} from '@/types/payment';

export type PaymentStatusFilterValue = PaymentStatus | 'ALL';
export type PaymentMethodFilterValue = PaymentMethod | 'ALL';

export interface PaymentHistoryFilterBarProps {
  statusFilter: PaymentStatusFilterValue;
  onStatusChange: (value: PaymentStatusFilterValue) => void;
  methodFilter: PaymentMethodFilterValue;
  onMethodChange: (value: PaymentMethodFilterValue) => void;
  showBookingIdFilter?: boolean;
  bookingIdInput?: string;
  onBookingIdChange?: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  sort: PaymentSortParam;
  onSortChange: (value: PaymentSortParam) => void;
  onReset: () => void;
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-900 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950';

export function PaymentHistoryFilterBar({
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  showBookingIdFilter = false,
  bookingIdInput = '',
  onBookingIdChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  sort,
  onSortChange,
  onReset,
}: PaymentHistoryFilterBarProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">
            Trạng thái GD
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusChange(e.target.value as PaymentStatusFilterValue)
            }
            className={SELECT_CLASS}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">
            Phương thức
          </label>
          <select
            value={methodFilter}
            onChange={(e) =>
              onMethodChange(e.target.value as PaymentMethodFilterValue)
            }
            className={SELECT_CLASS}
          >
            <option value="ALL">Tất cả phương thức</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
              (method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              )
            )}
          </select>
        </div>

        {showBookingIdFilter && onBookingIdChange && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Mã đơn đặt sân
            </label>
            <Input
              type="number"
              min={1}
              placeholder="VD: 12"
              value={bookingIdInput}
              onChange={(e) => onBookingIdChange(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Từ ngày</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Đến ngày</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Sắp xếp</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as PaymentSortParam)}
            className={SELECT_CLASS}
          >
            <option value="createdAt,desc">Mới nhất</option>
            <option value="createdAt,asc">Cũ nhất</option>
            <option value="paidAt,desc">Thanh toán gần nhất</option>
            <option value="amount,desc">Số tiền cao đến thấp</option>
            <option value="amount,asc">Số tiền thấp đến cao</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Đặt lại bộ lọc
        </Button>
      </div>
    </div>
  );
}

