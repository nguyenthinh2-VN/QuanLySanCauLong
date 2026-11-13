import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { ActiveVoucherCard } from '@/components/voucher/ActiveVoucherCard';
import { ApplyVoucherForm } from '@/components/voucher/ApplyVoucherForm';
import { ApplyVoucherResultCard } from '@/components/voucher/ApplyVoucherResultCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { extractErrorMessage } from '@/lib/auth';
import { getActiveVouchers } from '@/lib/voucher';
import type { PageResponse } from '@/types/booking';
import type { ApplyVoucherResponse, Voucher } from '@/types/voucher';

export function CustomerVouchersView() {
  const [page, setPage] = useState<number>(0);
  const [pageData, setPageData] = useState<PageResponse<Voucher> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCode, setSelectedCode] = useState<string>('');
  const [appliedResult, setAppliedResult] =
    useState<ApplyVoucherResponse | null>(null);

  const loadActiveVouchers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getActiveVouchers({
        page: targetPage,
        size: 6,
        sort: 'createdAt,desc',
      });
      setPageData(data);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể tải danh sách ưu đãi đang áp dụng'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveVouchers(page);
  }, [page, loadActiveVouchers]);

  function handleSelectCode(code: string) {
    setSelectedCode(code);
    setAppliedResult(null);

    // Scroll to the apply voucher form
    const el = document.getElementById('apply-voucher-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const items = pageData?.items ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const totalElements = pageData?.totalElements ?? items.length;
  const isFirst = pageData?.first ?? page === 0;
  const isLast = pageData?.last ?? page >= totalPages - 1;

  return (
    <div className="space-y-6">
      {/* Introduction banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              Chương trình Ưu đãi &amp; Mã giảm giá
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Khám phá các voucher đang hoạt động và áp dụng vào đơn đặt sân chờ thanh toán (PENDING) của bạn.
            </p>
          </div>
          <Badge variant="zinc">Ưu đãi thành viên</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left column: Active Vouchers List (7 cols on lg) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
              Mã ưu đãi đang mở ({totalElements})
            </h3>
            <span className="text-xs text-zinc-400">Tự động cập nhật</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-zinc-200 bg-white p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-4 w-48" />
                  <Skeleton className="mt-4 h-12 w-full rounded-lg" />
                  <Skeleton className="mt-4 h-8 w-full" />
                </Card>
              ))}
            </div>
          ) : errorMessage ? (
            <Card className="border-zinc-200 bg-white">
              <CardContent className="space-y-3 p-6 text-center">
                <AuthAlert variant="error">{errorMessage}</AuthAlert>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadActiveVouchers(page)}
                >
                  Thử tải lại
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border-zinc-200 bg-white">
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-semibold text-zinc-700">
                  Hiện chưa có mã ưu đãi nào đang mở
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Hãy quay lại sau hoặc theo dõi các chương trình khuyến mãi mới nhất từ sân cầu lông nhé!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((voucher) => (
                  <ActiveVoucherCard
                    key={voucher.id}
                    voucher={voucher}
                    onApplyCode={handleSelectCode}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-500">
                  <span>
                    Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isFirst}
                      onClick={() => setPage(page - 1)}
                      className="h-8 px-2.5 text-xs font-semibold"
                    >
                      &larr; Trang trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLast}
                      onClick={() => setPage(page + 1)}
                      className="h-8 px-2.5 text-xs font-semibold"
                    >
                      Trang sau &rarr;
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right column: Apply Voucher Form / Result (5 cols on lg) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4">
          {appliedResult ? (
            <ApplyVoucherResultCard
              result={appliedResult}
              onApplyAnother={() => {
                setAppliedResult(null);
                setSelectedCode('');
              }}
            />
          ) : (
            <ApplyVoucherForm
              initialCode={selectedCode}
              onCodeApplied={(result) => setAppliedResult(result)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

