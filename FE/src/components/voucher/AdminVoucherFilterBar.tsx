import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type VoucherActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface AdminVoucherFilterBarProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  activeFilter: VoucherActiveFilter;
  onActiveFilterChange: (filter: VoucherActiveFilter) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  disabled?: boolean;
}

const ACTIVE_TABS: { value: VoucherActiveFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang bật' },
  { value: 'INACTIVE', label: 'Đã tắt' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt,desc', label: 'Mới tạo gần nhất (createdAt ↓)' },
  { value: 'createdAt,asc', label: 'Tạo cũ nhất (createdAt ↑)' },
  { value: 'code,asc', label: 'Mã voucher (A → Z)' },
  { value: 'name,asc', label: 'Tên voucher (A → Z)' },
  { value: 'discountValue,desc', label: 'Mức giảm cao nhất (discountValue ↓)' },
  { value: 'discountValue,asc', label: 'Mức giảm thấp nhất (discountValue ↑)' },
  { value: 'usedCount,desc', label: 'Dùng nhiều nhất (usedCount ↓)' },
  { value: 'endDate,asc', label: 'Sắp hết hạn trước (endDate ↑)' },
];

export function AdminVoucherFilterBar({
  keyword,
  onKeywordChange,
  activeFilter,
  onActiveFilterChange,
  sort,
  onSortChange,
  onResetFilters,
  onOpenCreate,
  disabled = false,
}: AdminVoucherFilterBarProps) {
  const [searchInput, setSearchInput] = useState(keyword);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onKeywordChange(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput('');
    onKeywordChange('');
  }

  const hasActiveFilters =
    Boolean(keyword) || activeFilter !== 'ALL' || sort !== 'createdAt,desc';

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Top bar: Search Input + Create Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Tìm theo mã code hoặc tên voucher..."
                value={searchInput}
                disabled={disabled}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 pr-8 text-xs sm:text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 hover:text-zinc-600"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={disabled}
              className="h-9 shrink-0 px-3 text-xs font-semibold"
            >
              Tìm kiếm
            </Button>
          </form>

          <Button
            type="button"
            size="sm"
            onClick={onOpenCreate}
            disabled={disabled}
            className="h-9 shrink-0 gap-1.5 px-4 font-semibold shadow-xs"
          >
            + Tạo voucher mới
          </Button>
        </div>

        {/* Bottom bar: Active status filter tabs + Sort dropdown + Reset filters */}
        <div className="flex flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
          {/* Active status filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-zinc-500">
              Trạng thái:
            </span>
            {ACTIVE_TABS.map((tab) => {
              const active = activeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onActiveFilterChange(tab.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort selection & reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-500">
                Sắp xếp:
              </span>
              <select
                value={sort}
                disabled={disabled}
                onChange={(e) => onSortChange(e.target.value)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-zinc-400 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  setSearchInput('');
                  onResetFilters();
                }}
                className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-900"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

