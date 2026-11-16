import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complex } from '@/types/court';

export interface ComplexTableProps {
  complexes: Complex[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (complex: Complex) => void;
  onEdit: (complex: Complex) => void;
  onDelete: (complex: Complex) => void;
}

export function ComplexTable({
  complexes,
  loading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
}: ComplexTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
        <Skeleton className="h-10 w-full bg-zinc-100" />
        <Skeleton className="h-12 w-full bg-zinc-100" />
        <Skeleton className="h-12 w-full bg-zinc-100" />
        <Skeleton className="h-12 w-full bg-zinc-100" />
      </div>
    );
  }

  if (complexes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-zinc-900">Không tìm thấy cụm sân nào</p>
        <p className="mt-1 text-xs text-zinc-500">
          Hãy thử đổi bộ lọc hoặc thêm cụm sân mới vào hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-700">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Tên cụm sân</th>
              <th className="px-4 py-3">Địa chỉ</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3 text-center">Số sân</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {complexes.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewDetail(item)}
                    className="font-medium text-zinc-900 hover:underline text-left cursor-pointer"
                  >
                    {item.name}
                  </button>
                </td>
                <td className="px-4 py-3 max-w-[240px] truncate text-zinc-600" title={item.address}>
                  {item.address}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-600">
                  {item.phone || '--'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-800">
                    {item.totalCourts}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.status === 'ACTIVE' ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Đang hoạt động
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-zinc-300 bg-zinc-100 text-zinc-600">
                      Ngừng hoạt động
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(item)}
                      className="h-7 px-2 text-[11px] text-zinc-600 hover:text-zinc-900"
                    >
                      Xem
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-7 px-2 text-[11px] text-zinc-600 hover:text-zinc-900"
                    >
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
        <div>
          Tổng số <span className="font-medium text-zinc-900">{totalElements}</span> cụm sân
          {totalPages > 1 && (
            <span> (Trang {page + 1}/{totalPages})</span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              className="h-7 px-2.5 text-xs"
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="h-7 px-2.5 text-xs"
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
