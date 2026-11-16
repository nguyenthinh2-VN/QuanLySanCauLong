import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ComplexFilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  onCreateClick: () => void;
}

export function ComplexFilterBar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  onReset,
  onCreateClick,
}: ComplexFilterBarProps) {
  const isFiltered = query.trim() !== '' || status !== 'ALL';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Tìm kiếm */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Input
            type="text"
            placeholder="Tìm theo tên hoặc địa chỉ..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Lọc trạng thái */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
          aria-label="Lọc theo trạng thái cụm sân"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
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
          + Thêm cụm sân
        </Button>
      </div>
    </div>
  );
}
