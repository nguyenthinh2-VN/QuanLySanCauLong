import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Role } from '@/types/auth';

export interface DashboardWelcomeBannerProps {
  fullName?: string;
  primaryRole: Role;
}

export function DashboardWelcomeBanner({
  fullName,
  primaryRole,
}: DashboardWelcomeBannerProps) {
  return (
    <Card className="border-l-4 border-l-zinc-900 border-slate-200/90 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Xin chào, {fullName ?? 'Người dùng'}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-600">
              Chào mừng bạn đến với Hệ thống Quản lý &amp; Đặt Sân Cầu Lông. Dưới đây
              là bảng thông số tổng quan cho vai trò{' '}
              <span className="font-semibold text-zinc-900">
                {primaryRole}
              </span>
              .
            </CardDescription>
          </div>
          <Badge variant="zinc">
            {primaryRole === 'CUSTOMER' ? 'Dữ liệu trực tuyến' : 'Dữ liệu tĩnh Phase 1'}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
