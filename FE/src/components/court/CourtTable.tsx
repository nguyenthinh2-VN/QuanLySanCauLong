import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTimeVi } from '@/lib/court';
import type { Court } from '@/types/court';

export interface CourtTableProps {
  courts: Court[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onEdit: (court: Court) => void;
  onDelete: (court: Court) => void;
}

export function CourtTable({
  courts,
  loading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onEdit,
  onDelete,
}: CourtTableProps) {
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

  if (courts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-zinc-900">Không tìm thấy sân con nào</p>
        <p className="mt-1 text-xs text-zinc-500">
          Hãy thử đổi bộ lọc hoặc thêm sân con mới vào cụm sân.
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
              <th className="px-4 py-3">Tên sân</th>
              <th className="px-4 py-3">Thuộc cụm sân</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {courts.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {item.complexName}
                </td>
                <td className="px-4 py-3">
                  {item.status === 'AVAILABLE' ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Đang trống
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      Bảo trì
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {formatDateTimeVi(item.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
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
          Tổng số <span className="font-medium text-zinc-900">{totalElements}</span> sân con
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
