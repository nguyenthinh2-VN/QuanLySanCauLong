import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import {
  AdminVoucherFilterBar,
  type VoucherActiveFilter,
} from '@/components/voucher/AdminVoucherFilterBar';
import { AdminVoucherTable } from '@/components/voucher/AdminVoucherTable';
import { DeleteVoucherDialog } from '@/components/voucher/DeleteVoucherDialog';
import { VoucherFormDialog } from '@/components/voucher/VoucherFormDialog';
import { extractErrorMessage } from '@/lib/auth';
import { getVouchers, toggleVoucherStatus } from '@/lib/voucher';
import type { PageResponse } from '@/types/booking';
import type { Voucher } from '@/types/voucher';

export function AdminVouchersView() {
  const [keyword, setKeyword] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<VoucherActiveFilter>('ALL');
  const [sort, setSort] = useState<string>('createdAt,desc');
  const [page, setPage] = useState<number>(0);

  const [pageData, setPageData] = useState<PageResponse<Voucher> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const activeParam =
        activeFilter === 'ALL'
          ? undefined
          : activeFilter === 'ACTIVE'
          ? true
          : false;

      const data = await getVouchers({
        keyword: keyword || undefined,
        active: activeParam,
        page,
        size: 10,
        sort,
      });
      setPageData(data);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể tải danh sách voucher quản trị'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [keyword, activeFilter, sort, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggleStatus(voucher: Voucher) {
    setTogglingId(voucher.id);
    setFeedbackBanner(null);
    try {
      const updated = await toggleVoucherStatus(voucher.id);
      setFeedbackBanner(
        `Đã ${updated.active ? 'bật' : 'tắt'} voucher ${updated.code} thành công.`
      );
      // Optimistically update local item in pageData
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === updated.id ? updated : item
          ),
        };
      });
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          `Không thể thay đổi trạng thái voucher ${voucher.code}`
        )
      );
    } finally {
      setTogglingId(null);
    }
  }

  function handleResetFilters() {
    setKeyword('');
    setActiveFilter('ALL');
    setSort('createdAt,desc');
    setPage(0);
    setFeedbackBanner(null);
  }

  return (
    <div className="space-y-6">
      {feedbackBanner && (
        <AuthAlert variant="success">{feedbackBanner}</AuthAlert>
      )}

      <AdminVoucherFilterBar
        keyword={keyword}
        onKeywordChange={(val) => {
          setKeyword(val);
          setPage(0);
          setFeedbackBanner(null);
        }}
        activeFilter={activeFilter}
        onActiveFilterChange={(val) => {
          setActiveFilter(val);
          setPage(0);
          setFeedbackBanner(null);
        }}
        sort={sort}
        onSortChange={(val) => {
          setSort(val);
          setPage(0);
          setFeedbackBanner(null);
        }}
        onResetFilters={handleResetFilters}
        onOpenCreate={() => {
          setEditingVoucher(null);
          setFormDialogOpen(true);
          setFeedbackBanner(null);
        }}
        disabled={loading}
      />

      <AdminVoucherTable
        pageData={pageData}
        loading={loading}
        errorMessage={errorMessage}
        togglingId={togglingId}
        onRetry={() => void loadData()}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          setFeedbackBanner(null);
        }}
        onToggleStatus={(voucher) => void handleToggleStatus(voucher)}
        onEdit={(voucher) => {
          setEditingVoucher(voucher);
          setFormDialogOpen(true);
          setFeedbackBanner(null);
        }}
        onDelete={(voucher) => {
          setDeletingVoucher(voucher);
          setFeedbackBanner(null);
        }}
      />

      <VoucherFormDialog
        open={formDialogOpen}
        initialVoucher={editingVoucher}
        onClose={() => {
          setFormDialogOpen(false);
          setEditingVoucher(null);
        }}
        onSuccess={(_saved, message) => {
          setFormDialogOpen(false);
          setEditingVoucher(null);
          setFeedbackBanner(message);
          void loadData();
        }}
      />

      <DeleteVoucherDialog
        voucher={deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        onDeleted={(_voucher, message) => {
          setDeletingVoucher(null);
          setFeedbackBanner(message);
          void loadData();
        }}
      />
    </div>
  );
}

