import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role } from '@/types/auth';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Tổng quan hệ thống',
  '/bookings': 'Quản lý đặt sân',
  '/courts': 'Quản lý sân cầu lông',
  '/users': 'Quản lý người dùng',
  '/payments': 'Quản lý thanh toán',
  '/vouchers': 'Chương trình ưu đãi & Voucher',
  '/reports': 'Báo cáo doanh thu & công suất',
  '/pos': 'Đặt sân tại quầy (POS)',
  '/check-in': 'Check-in khách đến sân',
  '/booking': 'Đặt sân trực tuyến',
  '/my-bookings': 'Lịch đặt của tôi',
  '/profile': 'Hồ sơ cá nhân',
};

const ROLE_BADGE_VARIANT: Record<Role, 'emerald' | 'sky' | 'indigo'> = {
  ADMIN: 'emerald',
  STAFF: 'sky',
  CUSTOMER: 'indigo',
};

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileNotice, setProfileNotice] = useState(false);

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Sân Cầu Lông';
  const initials = getInitials(user?.fullName);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleOpenProfile = () => {
    setProfileNotice(true);
    window.setTimeout(() => setProfileNotice(false), 3000);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      {/* Left: Dynamic Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
        {profileNotice && (
          <Badge variant="amber" className="animate-fade-in">
            Màn hình Hồ sơ cá nhân sẽ mở ở Phase 2
          </Badge>
        )}
      </div>

      {/* Right: Role Badge + User Name + Avatar Dropdown (Zero Icons) */}
      <div className="flex items-center gap-3.5">
        {user && (
          <div className="flex items-center gap-2">
            {user.roles.map((role) => (
              <Badge key={role} variant={ROLE_BADGE_VARIANT[role]}>
                {role}
              </Badge>
            ))}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/70 py-1 pl-3 pr-1.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <span className="max-w-[160px] truncate text-sm font-medium text-slate-800">
                {user?.fullName ?? 'Người dùng'}
              </span>
              <Avatar className="h-8 w-8 border border-emerald-200">
                <AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-slate-900">
                  {user?.fullName}
                </p>
                <p className="text-xs leading-none text-slate-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleOpenProfile}
              className="cursor-pointer"
            >
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
