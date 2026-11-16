import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface UserFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  activeStatus: string;
  onActiveStatusChange: (status: string) => void;
  onReset: () => void;
  onCreateClick: () => void;
}

export function UserFilterBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  activeStatus,
  onActiveStatusChange,
  onReset,
  onCreateClick,
}: UserFilterBarProps) {
  const isFiltered =
    search.trim() !== '' || role !== 'ALL' || activeStatus !== 'ALL';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Tìm kiếm tên / email */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Input
            type="text"
            placeholder="Tìm theo họ tên hoặc email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Lọc vai trò */}
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
          aria-label="Lọc theo vai trò"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
          <option value="STAFF">Nhân viên (STAFF)</option>
          <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
        </select>

        {/* Lọc trạng thái hoạt động */}
        <select
          value={activeStatus}
          onChange={(e) => onActiveStatusChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
          aria-label="Lọc theo trạng thái tài khoản"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
        </select>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 text-xs text-zinc-500 hover:text-zinc-900"
          >
            Đặt lại
          </Button>
        )}
      </div>

      <div>
        <Button
          type="button"
          size="sm"
          onClick={onCreateClick}
          className="h-9 bg-zinc-900 px-3.5 text-xs text-zinc-50 shadow-xs hover:bg-zinc-800"
        >
          + Thêm tài khoản
        </Button>
      </div>
    </div>
  );
}
