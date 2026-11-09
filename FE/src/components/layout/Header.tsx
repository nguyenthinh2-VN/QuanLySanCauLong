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
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
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

const ROLE_BADGE_VARIANT: Record<Role, 'zinc' | 'amber' | 'indigo'> = {
  ADMIN: 'zinc',
  STAFF: 'amber',
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
    <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3.5 sm:px-6">
      {/* Left: Sidebar Toggle Button ([|]) + Vertical Divider + Breadcrumb / Page Title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4 bg-zinc-200" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden text-zinc-400 sm:inline">Hệ thống</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hidden h-3.5 w-3.5 shrink-0 text-zinc-400 sm:inline"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <h1 className="truncate text-sm sm:text-base font-semibold tracking-tight text-zinc-900">
            {pageTitle}
          </h1>
        </nav>

        {profileNotice && (
          <Badge variant="amber" className="hidden lg:inline-flex">
            Màn hình Hồ sơ cá nhân sẽ mở ở Phase sau
          </Badge>
        )}
      </div>

      {/* Right: Role Badge + User Name + Avatar Dropdown */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        {user && (
          <div className="hidden sm:flex items-center gap-1.5">
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
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 py-1 pl-1.5 sm:pl-3 pr-1.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            >
              <span className="hidden md:inline max-w-[150px] truncate text-xs sm:text-sm font-medium text-zinc-800">
                {user?.fullName ?? 'Người dùng'}
              </span>
              <Avatar className="h-8 w-8 border border-zinc-200">
                <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-zinc-900">
                  {user?.fullName}
                </p>
                <p className="text-xs leading-none text-zinc-500">
                  {user?.email}
                </p>
                {user && (
                  <div className="flex flex-wrap gap-1 pt-1.5 sm:hidden">
                    {user.roles.map((role) => (
                      <Badge key={role} variant={ROLE_BADGE_VARIANT[role]}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleOpenProfile}
              className="cursor-pointer"
            >
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
