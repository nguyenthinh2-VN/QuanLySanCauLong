import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateVi } from '@/lib/user';
import type { Role, User } from '@/types/user';

export interface UserTableProps {
  users: User[];
  currentUserId?: number;
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onEdit: (user: User) => void;
  onManageRoles: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserTable({
  users,
  currentUserId,
  loading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onEdit,
  onManageRoles,
  onToggleStatus,
  onDelete,
}: UserTableProps) {
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

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-zinc-900">Không tìm thấy người dùng nào</p>
        <p className="mt-1 text-xs text-zinc-500">
          Hãy thử đổi từ khóa tìm kiếm hoặc điều kiện lọc vai trò / trạng thái.
        </p>
      </div>
    );
  }

  function renderRoleBadge(role: Role) {
    switch (role) {
      case 'ADMIN':
        return (
          <Badge
            key={role}
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[10px] font-semibold text-purple-700"
          >
            ADMIN
          </Badge>
        );
      case 'STAFF':
        return (
          <Badge
            key={role}
            variant="outline"
            className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700"
          >
            STAFF
          </Badge>
        );
      case 'CUSTOMER':
      default:
        return (
          <Badge
            key={role}
            variant="outline"
            className="border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-600"
          >
            CUSTOMER
          </Badge>
        );
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-700">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Họ và tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.map((item) => {
              const isSelf = Boolean(currentUserId && item.id === currentUserId);

              return (
                <tr key={item.id} className="transition-colors hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <span>{item.fullName}</span>
                      {isSelf && (
                        <span className="rounded bg-zinc-900 px-1.5 py-0.2 text-[10px] font-bold text-zinc-50">
                          (Bạn)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600">
                    {item.email}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600">
                    {item.phone || '--'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {item.roles.map((r) => renderRoleBadge(r))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.active ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700"
                      >
                        Đã khóa
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDateVi(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Nút Sửa */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-7 px-2 text-[11px] text-zinc-600 hover:text-zinc-900"
                      >
                        Sửa
                      </Button>

                      {/* Nút Vai trò */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageRoles(item)}
                        className="h-7 px-2 text-[11px] text-zinc-600 hover:text-zinc-900"
                      >
                        Vai trò
                      </Button>

                      {/* Nút Khóa / Mở khóa (Guard tự khóa) */}
                      {isSelf ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Không thể tự khóa tài khoản của chính mình"
                          className="h-7 cursor-not-allowed px-2 text-[11px] text-zinc-300"
                        >
                          Khóa
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(item)}
                          className={`h-7 px-2 text-[11px] ${
                            item.active
                              ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {item.active ? 'Khóa' : 'Mở khóa'}
                        </Button>
                      )}

                      {/* Nút Xóa (Guard tự xóa) */}
                      {isSelf ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Không thể tự xóa tài khoản của chính mình"
                          className="h-7 cursor-not-allowed px-2 text-[11px] text-zinc-300"
                        >
                          Xóa
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
        <div>
          Tổng số <span className="font-medium text-zinc-900">{totalElements}</span> tài khoản
          {totalPages > 1 && <span> (Trang {page + 1}/{totalPages})</span>}
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
