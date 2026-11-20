import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  estimateSlotTotal,
  formatCurrencyVnd,
  formatDateVietnamese,
  formatShortDateVi,
  formatTimeShort,
} from '@/lib/booking';
import type { SlotStatus } from '@/types/booking';

export interface DayAvailabilityInfo {
  status: SlotStatus | 'CHECKING' | 'ERROR' | 'UNKNOWN';
}

export interface RecurringPreviewTableProps {
  targetDates: string[];
  courtName: string;
  complexName: string;
  slotName: string;
  slotPricePerHour: number;
  startTime: string;
  endTime: string;
  availabilityByDate: Record<string, DayAvailabilityInfo>;
  isCheckingAll: boolean;
  exceedsHorizon: boolean;
  conflictedDatesFromBackend?: string[];
  onProceed: () => void;
  submitting?: boolean;
}

export function RecurringPreviewTable({
  targetDates,
  courtName,
  complexName,
  slotName,
  slotPricePerHour,
  startTime,
  endTime,
  availabilityByDate,
  isCheckingAll,
  exceedsHorizon,
  conflictedDatesFromBackend = [],
  onProceed,
  submitting = false,
}: RecurringPreviewTableProps) {
  const pricePerSlot = estimateSlotTotal(slotPricePerHour, startTime, endTime);
  const totalAmount = targetDates.length * pricePerSlot;

  // Kiểm tra xem có ngày nào bị trùng hay không
  const hasClientConflict = targetDates.some((date) => {
    const info = availabilityByDate[date];
    return (
      info?.status === 'BOOKED' ||
      info?.status === 'PASSED' ||
      info?.status === 'UNAVAILABLE' ||
      conflictedDatesFromBackend.includes(date)
    );
  });

  const hasBackendConflict = conflictedDatesFromBackend.length > 0;
  const isBlocked = exceedsHorizon || hasClientConflict || hasBackendConflict;

  return (
    <Card className="border-zinc-200 bg-white shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-900">
            Xem trước chuỗi ngày đặt ({targetDates.length} buổi)
          </CardTitle>
          <p className="mt-0.5 text-xs text-zinc-500">
            {courtName} ({complexName}) • Khung giờ: {slotName} (
            {formatTimeShort(startTime)} - {formatTimeShort(endTime)})
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-zinc-500">Tổng tiền tạm tính</div>
          <div className="text-base font-bold text-zinc-900">
            {formatCurrencyVnd(totalAmount)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Cảnh báo vượt giới hạn 90 ngày */}
        {exceedsHorizon && (
          <div className="rounded-md border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            <span className="font-semibold">Lỗi vượt giới hạn thời gian (90 ngày):</span> Ngày kết thúc chuỗi vượt quá 90 ngày tính từ hôm nay. Vui lòng giảm số tuần hoặc chọn ngày bắt đầu sớm hơn.
          </div>
        )}

        {/* Cảnh báo lỗi 409 xung đột từ Backend */}
        {hasBackendConflict && (
          <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
            <p className="font-semibold">
              Xung đột lịch đặt (All-or-Nothing): Không có đơn nào được tạo!
            </p>
            <p className="text-rose-700">
              Các ngày sau đây đã có khách đặt trước tại khung giờ này:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {conflictedDatesFromBackend.map((d) => (
                <span
                  key={d}
                  className="rounded bg-rose-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-900"
                >
                  {formatShortDateVi(d)}
                </span>
              ))}
            </div>
            <p className="pt-1 text-[11px] text-zinc-600">
              Gợi ý: Quý khách hãy thử đổi sang khung giờ khác, thứ khác trong tuần hoặc giảm số tuần.
            </p>
          </div>
        )}

        {/* Bảng danh sách các buổi */}
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-3.5 py-2.5">Buổi</th>
                <th className="px-3.5 py-2.5">Thứ &amp; Ngày thi đấu</th>
                <th className="px-3.5 py-2.5">Khung giờ</th>
                <th className="px-3.5 py-2.5">Tình trạng slot</th>
                <th className="px-3.5 py-2.5 text-right">Tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {targetDates.map((dateIso, idx) => {
                const info = availabilityByDate[dateIso];
                const isBackendConflicted =
                  conflictedDatesFromBackend.includes(dateIso);

                const isBooked =
                  info?.status === 'BOOKED' || isBackendConflicted;
                const isPassed = info?.status === 'PASSED';
                const isUnavailable = info?.status === 'UNAVAILABLE';
                const isChecking = info?.status === 'CHECKING' || isCheckingAll;
                const isFree = info?.status === 'FREE';

                return (
                  <tr
                    key={dateIso}
                    className={`transition-colors ${
                      isBooked || isUnavailable
                        ? 'bg-rose-50/40'
                        : 'hover:bg-zinc-50/50'
                    }`}
                  >
                    <td className="px-3.5 py-2 font-medium text-zinc-900">
                      Buổi {idx + 1}
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="font-medium text-zinc-800">
                        {formatDateVietnamese(dateIso)}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        {dateIso}
                      </div>
                    </td>
                    <td className="px-3.5 py-2 font-mono text-zinc-600">
                      {formatTimeShort(startTime)} - {formatTimeShort(endTime)}
                    </td>
                    <td className="px-3.5 py-2">
                      {isChecking ? (
                        <span className="text-[11px] text-zinc-400 animate-pulse">
                          Đang kiểm tra...
                        </span>
                      ) : isBooked ? (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-rose-700 font-semibold"
                        >
                          Đã có người đặt
                        </Badge>
                      ) : isPassed ? (
                        <Badge
                          variant="outline"
                          className="border-zinc-200 bg-zinc-100 text-zinc-500"
                        >
                          Đã qua giờ
                        </Badge>
                      ) : isUnavailable ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          Không khả dụng
                        </Badge>
                      ) : isFree ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          Còn trống
                        </Badge>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right font-medium text-zinc-900">
                      {formatCurrencyVnd(pricePerSlot)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lưu ý thanh toán độc lập */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Lưu ý quan trọng khi đặt lịch cố định:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
            <li>
              Hệ thống sẽ tạo <strong>{targetDates.length} đơn đặt sân riêng biệt</strong> ở trạng thái PENDING.
            </li>
            <li>
              <strong>Thanh toán từng đơn:</strong> Quý khách thanh toán cho từng buổi tại trang <em>"Lịch đặt của tôi"</em>. Không hỗ trợ thanh toán gộp toàn bộ chuỗi một lần.
            </li>
            <li>
              Hủy hoặc thay đổi 1 buổi không làm ảnh hưởng đến các buổi còn lại trong chuỗi.
            </li>
          </ul>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            onClick={onProceed}
            disabled={isBlocked || submitting || isCheckingAll}
            className="h-9 bg-zinc-900 px-4 text-xs font-semibold text-zinc-50 shadow-xs hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting
              ? 'Đang tạo chuỗi đơn...'
              : `Xác nhận đặt lịch (${targetDates.length} buổi)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
