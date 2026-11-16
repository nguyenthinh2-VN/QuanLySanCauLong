import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Complex } from '@/types/court';

export interface CourtFilterBarProps {
  complexes: Complex[];
  selectedComplexId: string;
  onComplexChange: (id: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onReset: () => void;
  onCreateClick: () => void;
}

export function CourtFilterBar({
  complexes,
  selectedComplexId,
  onComplexChange,
  status,
  onStatusChange,
  query,
  onQueryChange,
  onReset,
  onCreateClick,
}: CourtFilterBarProps) {
  const isFiltered =
    selectedComplexId !== 'ALL' || status !== 'ALL' || query.trim() !== '';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Tìm kiếm tên sân */}
        <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
          <Input
            type="text"
            placeholder="Tìm theo tên sân..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Lọc cụm sân */}
        <select
          value={selectedComplexId}
          onChange={(e) => onComplexChange(e.target.value)}
          className="h-9 max-w-[200px] rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
          aria-label="Lọc theo cụm sân"
        >
          <option value="ALL">Tất cả cụm sân</option>
          {complexes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Lọc trạng thái sân */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
          aria-label="Lọc theo trạng thái sân"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Đang trống (Sẵn sàng)</option>
          <option value="MAINTENANCE">Đang bảo trì</option>
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
          + Thêm sân con
        </Button>
      </div>
    </div>
  );
}
