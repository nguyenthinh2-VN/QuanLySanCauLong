import { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { extractErrorMessage } from '@/lib/auth';
import { formatDateTimeVi, getComplexById } from '@/lib/court';
import type { ComplexDetail } from '@/types/court';

export interface ComplexDetailDialogProps {
  complexId: number | null;
  onClose: () => void;
}

export function ComplexDetailDialog({
  complexId,
  onClose,
}: ComplexDetailDialogProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ComplexDetail | null>(null);

  useEffect(() => {
    if (!complexId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    getComplexById(complexId)
      .then((data) => {
        if (mounted) setDetail(data);
      })
      .catch((err) => {
        if (mounted) {
          setError(extractErrorMessage(err, 'Không thể tải chi tiết cụm sân'));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [complexId]);

  if (!complexId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900">
                Chi tiết Cụm Sân
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Thông tin cụm sân và danh sách các sân trực thuộc
              </CardDescription>
            </div>
            {detail && (
              <Badge
                variant="outline"
                className={
                  detail.status === 'ACTIVE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                }
              >
                {detail.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 text-xs">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          {loading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-3/4 bg-zinc-100" />
              <Skeleton className="h-4 w-1/2 bg-zinc-100" />
              <Skeleton className="h-16 w-full bg-zinc-100" />
            </div>
          ) : detail ? (
            <>
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3">
                <div>
                  <span className="text-[11px] text-zinc-500">Tên cụm sân:</span>
                  <p className="font-semibold text-zinc-900">{detail.name}</p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Số điện thoại:</span>
                  <p className="font-mono text-zinc-800">{detail.phone || '--'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-500">Địa chỉ:</span>
                  <p className="text-zinc-800">{detail.address}</p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Ngày tạo:</span>
                  <p className="text-zinc-700">{formatDateTimeVi(detail.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Cập nhật lần cuối:</span>
                  <p className="text-zinc-700">{formatDateTimeVi(detail.updatedAt)}</p>
                </div>
              </div>

              {/* Danh sách sân con */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-900">
                    Danh sách sân trực thuộc ({detail.courts?.length ?? 0})
                  </h4>
                </div>

                {detail.courts && detail.courts.length > 0 ? (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-zinc-200 p-2">
                    {detail.courts.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-sm bg-zinc-50 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium text-zinc-800">{c.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            c.status === 'AVAILABLE'
                              ? 'border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-[10px] text-amber-700'
                          }
                        >
                          {c.status === 'AVAILABLE' ? 'Đang trống' : 'Bảo trì'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-500">
                    Cụm sân này hiện chưa có sân con nào
                  </p>
                )}
              </div>
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Đóng
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
