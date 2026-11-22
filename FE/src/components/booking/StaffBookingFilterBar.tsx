import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookingStatus } from '@/types/booking';
import type { Complex, Court } from '@/types/court';

export interface StaffBookingFilterBarProps {
  bookingDate: string;
  onBookingDateChange: (date: string) => void;
  status: BookingStatus | '';
  onStatusChange: (status: BookingStatus | '') => void;
  selectedComplexId: number | null;
  complexes: Complex[];
  onComplexChange: (complexId: number | null) => void;
  selectedCourtId: number | null;
  courts: Court[];
  onCourtChange: (courtId: number | null) => void;
  guestPhone: string;
  onGuestPhoneChange: (val: string) => void;
  userId: string;
  onUserIdChange: (val: string) => void;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
}

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Đã nhận sân' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden disabled:bg-zinc-100 disabled:text-zinc-400';

export function StaffBookingFilterBar({
  bookingDate,
  onBookingDateChange,
  status,
  onStatusChange,
  selectedComplexId,
  complexes,
  onComplexChange,
  selectedCourtId,
  courts,
  onCourtChange,
  guestPhone,
  onGuestPhoneChange,
  userId,
  onUserIdChange,
  onSearch,
  onReset,
  loading,
}: StaffBookingFilterBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Ngày */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-date"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Ngày
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={bookingDate}
            onChange={(e) => {
              if (e.target.value) onBookingDateChange(e.target.value);
            }}
            className="h-9 font-sans text-xs tabular-nums"
          />
        </div>

        {/* Trạng thái */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-status"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Trạng thái
          </Label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as BookingStatus | '')}
            className={SELECT_CLASS}
            aria-label="Lọc trạng thái đơn đặt sân"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cụm sân */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-complex"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Cụm sân
          </Label>
          <select
            id="filter-complex"
            value={selectedComplexId != null ? String(selectedComplexId) : ''}
            onChange={(e) => {
              const val = e.target.value;
              onComplexChange(val === '' ? null : Number(val));
              onCourtChange(null);
            }}
            className={SELECT_CLASS}
            aria-label="Lọc cụm sân"
          >
            <option value="">Tất cả cụm sân</option>
            {complexes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sân con */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-court"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Sân
          </Label>
          <select
            id="filter-court"
            value={selectedCourtId != null ? String(selectedCourtId) : ''}
            disabled={courts.length === 0}
            onChange={(e) => {
              const val = e.target.value;
              onCourtChange(val === '' ? null : Number(val));
            }}
            className={SELECT_CLASS}
            aria-label="Lọc sân con"
          >
            <option value="">Tất cả sân</option>
            {courts.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* SĐT khách */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-phone"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            SĐT khách
          </Label>
          <Input
            id="filter-phone"
            type="text"
            placeholder="Tìm 1 phần SĐT..."
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* ID thành viên */}
        <div className="space-y-1.5">
          <Label
            htmlFor="filter-userid"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            ID thành viên
          </Label>
          <Input
            id="filter-userid"
            type="number"
            placeholder="ID chính xác"
            value={userId}
            min={1}
            onChange={(e) => onUserIdChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Nút hành động: Tìm kiếm & Xóa lọc */}
      <div className="flex items-center justify-end gap-2 border-t border-zinc-200/60 pt-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={onReset}
        >
          Xóa lọc
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-8 px-4 text-xs font-semibold"
          disabled={loading}
        >
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>
      </div>
    </form>
  );
}
