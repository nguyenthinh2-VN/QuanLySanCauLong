import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPrimaryRole } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Role } from '@/types/auth';

export interface NavItem {
  label: string;
  to: string;
  end?: boolean;
}

const MENU_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Tổng quan', to: '/', end: true },
    { label: 'Đặt sân', to: '/bookings' },
    { label: 'Quản lý sân', to: '/courts' },
    { label: 'Người dùng', to: '/users' },
    { label: 'Thanh toán', to: '/payments' },
    { label: 'Voucher', to: '/vouchers' },
    { label: 'Báo cáo', to: '/reports' },
  ],
  STAFF: [
    { label: 'Tổng quan', to: '/', end: true },
    { label: 'Đặt sân (POS)', to: '/pos' },
    { label: 'Check-in', to: '/check-in' },
    { label: 'Thanh toán', to: '/payments' },
  ],
  CUSTOMER: [
    { label: 'Đặt sân', to: '/booking' },
    { label: 'Lịch đặt của tôi', to: '/my-bookings' },
    { label: 'Ưu đãi', to: '/vouchers' },
  ],
};

const ROLE_SUBTITLE: Record<Role, string> = {
  ADMIN: 'Hệ thống Quản trị',
  STAFF: 'Nghiệp vụ Quầy & Sân',
  CUSTOMER: 'Cổng Đặt sân Trực tuyến',
};

export function Sidebar() {
  const { user } = useAuth();
  const primaryRole: Role = user ? getPrimaryRole(user.roles) : 'CUSTOMER';
  const menuItems = MENU_BY_ROLE[primaryRole];

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white select-none">
      {/* Brand Header (Pure Typography + Monogram Pill, Zero Icons) */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold tracking-wider text-white shadow-sm shadow-emerald-600/20">
          SCL
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900">
            Sân Cầu Lông
          </span>
          <span className="text-[11px] font-medium text-emerald-700">
            {ROLE_SUBTITLE[primaryRole]}
          </span>
        </div>
      </div>

      <Separator />

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Danh mục chính
        </div>
        <nav className="space-y-1" aria-label="Menu điều hướng chính">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center rounded-lg px-3.5 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-50/90 font-semibold text-emerald-800 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-emerald-600'
                    : 'font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-100 p-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-3">
          <p className="text-xs font-semibold text-emerald-900">
            Phiên bản Phase 1
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700/90">
            Xác thực &amp; Khung điều hướng phân quyền theo vai trò.
          </p>
        </div>
      </div>
    </aside>
  );
}

