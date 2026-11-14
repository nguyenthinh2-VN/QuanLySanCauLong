import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTimeVi, formatVnd, formatVoucherDiscount } from '@/lib/voucher';
import type { PageResponse } from '@/types/booking';
import type { Voucher } from '@/types/voucher';

export interface AdminVoucherTableProps {
  pageData: PageResponse<Voucher> | null;
  loading: boolean;
  errorMessage: string | null;
  togglingId: number | null;
  onRetry: () => void;
  onPageChange: (newPage: number) => void;
  onToggleStatus: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
}

export function AdminVoucherTable({
  pageData,
  loading,
  errorMessage,
  togglingId,
  onRetry,
  onPageChange,
  onToggleStatus,
  onEdit,
  onDelete,
}: AdminVoucherTableProps) {
  if (loading) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-1.5 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="space-y-4 p-6">
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Thử tải lại danh sách voucher
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = pageData?.items ?? [];

  if (items.length === 0) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            Chưa có voucher nào
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
            Không tìm thấy voucher phù hợp với bộ lọc hiện tại. Bấm nút "+ Tạo voucher mới" để phát hành chương trình ưu đãi đầu tiên.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPage = pageData?.page ?? 0;
  const totalPages = pageData?.totalPages ?? 1;
  const totalElements = pageData?.totalElements ?? items.length;
  const isFirst = pageData?.first ?? currentPage === 0;
  const isLast = pageData?.last ?? currentPage >= totalPages - 1;

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Danh mục Voucher khuyến mãi
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Tổng số {totalElements} mã giảm giá trong hệ thống
            </CardDescription>
          </div>
          <Badge variant="zinc">ADMIN Quản trị</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-y border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Mã &amp; Tên Voucher</th>
                <th className="px-3 py-3">Mức giảm giá</th>
                <th className="px-3 py-3">Đơn tối thiểu</th>
                <th className="px-3 py-3 text-center">Lượt dùng</th>
                <th className="px-3 py-3">Thời gian hiệu lực</th>
                <th className="px-3 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((voucher) => {
                const isExhausted =
                  voucher.usageLimit != null &&
                  voucher.usedCount >= voucher.usageLimit;
                const isToggling = togglingId === voucher.id;

                return (
                  <tr
                    key={voucher.id}
                    className="transition-colors hover:bg-zinc-50/70"
                  >
                    {/* Code & Name */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-900">
                            {voucher.code}
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-900">
                          {voucher.name}
                        </p>
                        {voucher.description && (
                          <p className="max-w-xs truncate text-[11px] text-zinc-500">
                            {voucher.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Discount value & max discount */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-sans font-bold text-zinc-800">
                          {formatVoucherDiscount(
                            voucher.discountType,
                            voucher.discountValue,
                            voucher.maxDiscountAmount
                          )}
                        </span>
                        <div className="text-[11px] text-zinc-500">
                          {voucher.discountType === 'PERCENTAGE'
                            ? 'Giảm theo phần trăm'
                            : 'Giảm số tiền cố định'}
                        </div>
                      </div>
                    </td>

                    {/* Min order amount & user limit */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="space-y-1">
                        <span className="font-sans font-medium tabular-nums text-zinc-800">
                          {voucher.minOrderAmount != null &&
                          voucher.minOrderAmount > 0
                            ? formatVnd(voucher.minOrderAmount)
                            : 'Không yêu cầu'}
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          Tối đa {voucher.userUsageLimit} lượt/khách
                        </p>
                      </div>
                    </td>

                    {/* Usage count / usage limit */}
                    <td className="px-3 py-3.5 align-top text-center">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold tabular-nums text-zinc-900">
                          {voucher.usedCount} /{' '}
                          {voucher.usageLimit != null
                            ? voucher.usageLimit
                            : '∞'}
                        </span>
                        <div>
                          {isExhausted ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Hết lượt
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-zinc-500">
                              Lượt áp dụng
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* StartDate - EndDate */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="space-y-1 font-sans text-xs tabular-nums text-zinc-700">
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-400">
                            Từ:
                          </span>{' '}
                          {formatDateTimeVi(voucher.startDate)}
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-400">
                            Đến:
                          </span>{' '}
                          {formatDateTimeVi(voucher.endDate)}
                        </div>
                      </div>
                    </td>

                    {/* Active Status Badge */}
                    <td className="px-3 py-3.5 align-top text-center">
                      <Badge variant={voucher.active ? 'success' : 'secondary'}>
                        {voucher.active ? 'Đang bật' : 'Đã tắt'}
                      </Badge>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Active button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isToggling}
                          onClick={() => onToggleStatus(voucher)}
                          className="h-7 px-2 text-[11px] font-semibold"
                          title={
                            voucher.active ? 'Tắt voucher này' : 'Bật voucher này'
                          }
                        >
                          {isToggling
                            ? '...'
                            : voucher.active
                            ? 'Tắt'
                            : 'Bật'}
                        </Button>

                        {/* Edit button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(voucher)}
                          className="h-7 px-2 text-[11px] font-semibold text-zinc-700"
                        >
                          Sửa
                        </Button>

                        {/* Delete button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(voucher)}
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-zinc-500">
            Trang <strong className="text-zinc-900">{currentPage + 1}</strong> /{' '}
            <strong className="text-zinc-900">{totalPages}</strong> (Hiển thị{' '}
            {items.length} trên tổng {totalElements} voucher)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFirst}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              &larr; Trang trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLast}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              Trang sau &rarr;
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

