import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTimeVi, formatTimeShort, formatVnd } from '@/lib/court';
import type { TimeSlot } from '@/types/court';

export interface TimeSlotTableProps {
  timeSlots: TimeSlot[];
  loading: boolean;
  onCreateClick: () => void;
  onEdit: (slot: TimeSlot) => void;
}

export function TimeSlotTable({
  timeSlots,
  loading,
  onCreateClick,
  onEdit,
}: TimeSlotTableProps) {
  return (
    <div className="space-y-3">
      {/* Thanh toolbar trên cùng */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Khung Giờ & Bảng Giá Chuẩn
          </h3>
          <p className="text-xs text-zinc-500">
            Quy định các khung giờ mở cửa trong ngày và giá thuê áp dụng theo giờ
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onCreateClick}
          className="h-9 self-start sm:self-auto bg-zinc-900 px-3.5 text-xs text-zinc-50 shadow-xs hover:bg-zinc-800"
        >
          + Thêm khung giờ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
          <Skeleton className="h-10 w-full bg-zinc-100" />
          <Skeleton className="h-12 w-full bg-zinc-100" />
          <Skeleton className="h-12 w-full bg-zinc-100" />
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-zinc-900">Chưa có khung giờ nào</p>
          <p className="mt-1 text-xs text-zinc-500">
            Hãy bấm "+ Thêm khung giờ" để thiết lập bảng giờ chơi cho hệ thống.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Tên khung giờ</th>
                  <th className="px-4 py-3">Giờ bắt đầu – kết thúc</th>
                  <th className="px-4 py-3">Đơn giá / giờ</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {timeSlots.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-800">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold">
                        {formatTimeShort(item.startTime)} – {formatTimeShort(item.endTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatVnd(item.pricePerHour)} / giờ
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDateTimeVi(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-7 px-2 text-[11px] text-zinc-600 hover:text-zinc-900"
                      >
                        Sửa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-500">
            Tổng cộng <span className="font-semibold text-zinc-900">{timeSlots.length}</span> khung giờ (được sắp xếp theo thứ tự thời gian trong ngày)
          </div>
        </div>
      )}
    </div>
  );
}
