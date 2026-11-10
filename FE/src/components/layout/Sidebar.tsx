import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPrimaryRole } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import type { Role } from '@/types/auth';

export type NavIconName =
  | 'dashboard'
  | 'calendar-plus'
  | 'calendar-check'
  | 'court'
  | 'users'
  | 'credit-card'
  | 'ticket'
  | 'chart'
  | 'pos'
  | 'user-check';

export interface NavItem {
  label: string;
  to: string;
  icon: NavIconName;
  end?: boolean;
  badge?: string;
}

function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const baseClass = cn('h-4 w-4 shrink-0', className);
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case 'calendar-plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M10 16h4" />
          <path d="M12 14v4" />
        </svg>
      );
    case 'calendar-check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );
    case 'court':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M12 5v14" />
          <path d="M2 12h20" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'credit-card':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case 'ticket':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      );
    case 'pos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'user-check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={baseClass} aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
  }
}

const MENU_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Tổng quan', to: '/', icon: 'dashboard', end: true },
    { label: 'Quản lý đặt sân', to: '/bookings', icon: 'calendar-check' },
    { label: 'Đặt sân tại quầy (POS)', to: '/pos', icon: 'pos' },
    { label: 'Check-in khách đến', to: '/check-in', icon: 'user-check' },
    { label: 'Quản lý sân', to: '/courts', icon: 'court' },
    { label: 'Người dùng', to: '/users', icon: 'users' },
    { label: 'Thanh toán', to: '/payments', icon: 'credit-card' },
    { label: 'Voucher ưu đãi', to: '/vouchers', icon: 'ticket' },
    { label: 'Báo cáo thống kê', to: '/reports', icon: 'chart' },
  ],
  STAFF: [
    { label: 'Tổng quan', to: '/', icon: 'dashboard', end: true },
    { label: 'Đặt sân tại quầy (POS)', to: '/pos', icon: 'pos' },
    { label: 'Check-in khách đến', to: '/check-in', icon: 'user-check' },
    { label: 'Thanh toán', to: '/payments', icon: 'credit-card' },
  ],
  CUSTOMER: [
    { label: 'Tổng quan', to: '/', icon: 'dashboard', end: true },
    { label: 'Đặt sân trực tuyến', to: '/booking', icon: 'calendar-plus' },
    { label: 'Lịch đặt của tôi', to: '/my-bookings', icon: 'calendar-check' },
    { label: 'Ưu đãi & Voucher', to: '/vouchers', icon: 'ticket' },
  ],
};

const ROLE_SUBTITLE: Record<Role, string> = {
  ADMIN: 'Hệ thống Quản trị',
  STAFF: 'Nghiệp vụ Quầy & Sân',
  CUSTOMER: 'Cổng Đặt sân Trực tuyến',
};

interface SidebarContentProps {
  primaryRole: Role;
  menuItems: NavItem[];
  onCloseMobile?: () => void;
}

function SidebarContent({
  primaryRole,
  menuItems,
  onCloseMobile,
}: SidebarContentProps) {
  return (
    <div className="flex h-full w-full flex-col bg-white select-none">
      {/* Brand Header (AdminCN style circle emblem + title + subtitle) */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
              aria-hidden="true"
            >
              <path d="M12 2v6" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="M2 12h6" />
              <path d="m4.93 19.07 4.24-4.24" />
              <path d="M12 16v6" />
              <path d="m19.07 19.07-4.24-4.24" />
              <path d="M16 12h6" />
              <path d="m19.07 4.93-4.24 4.24" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-zinc-900">
              Sân Cầu Lông
            </span>
            <span className="text-[11px] font-medium text-zinc-500">
              {ROLE_SUBTITLE[primaryRole]}
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      <Separator />

      {/* Independently Scrollable Navigation Section */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Danh mục &amp; Tiện ích
        </div>
        <nav className="space-y-1" aria-label="Menu điều hướng chính">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-zinc-100/95 font-semibold text-zinc-900'
                    : 'font-medium text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-900'
                )
              }
            >
              {({ isActive }) => (
                <span className="flex items-center gap-2.5 truncate">
                  <NavIcon
                    name={item.icon}
                    className={cn(
                      'transition-colors',
                      isActive
                        ? 'text-zinc-900'
                        : 'text-zinc-500 group-hover:text-zinc-900'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="shrink-0 border-t border-zinc-100 p-4">
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-xs font-semibold text-zinc-900">
              Hệ thống Đặt sân v2.0
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Mẹo nhanh: Nhấn{' '}
            <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-sans text-[10px] font-semibold text-zinc-800">
              Ctrl+B
            </kbd>{' '}
            để đóng/mở nhanh thanh menu.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { open, openMobile, setOpenMobile } = useSidebar();

  const primaryRole: Role = user ? getPrimaryRole(user.roles) : 'CUSTOMER';
  const menuItems = MENU_BY_ROLE[primaryRole];

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!openMobile) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMobile(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [openMobile, setOpenMobile]);

  return (
    <>
      {/* Desktop Collapsible Sidebar (Independent height h-dvh, smooth 300ms width transition) */}
      <aside
        aria-label="Thanh điều hướng máy tính"
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(
          'hidden md:flex h-dvh shrink-0 flex-col bg-white transition-[width] duration-300 ease-in-out overflow-hidden',
          open ? 'w-64 border-r border-zinc-200' : 'w-0 border-r-0'
        )}
      >
        <div className="h-full w-64">
          <SidebarContent primaryRole={primaryRole} menuItems={menuItems} />
        </div>
      </aside>

      {/* Mobile Slide-Over Sheet / Drawer (Always mounted for smooth 300ms slide + fade transition) */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          openMobile ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        role="dialog"
        aria-modal={openMobile}
        aria-hidden={!openMobile}
        aria-label="Menu điều hướng di động"
      >
        {/* Blurred Backdrop with smooth opacity transition */}
        <div
          className={cn(
            'fixed inset-0 bg-zinc-950/45 backdrop-blur-xs transition-opacity duration-300 ease-in-out',
            openMobile ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpenMobile(false)}
        />

        {/* Slide-out Panel with smooth translate-x transition */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[82vw] flex-col border-r border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out',
            openMobile ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent
            primaryRole={primaryRole}
            menuItems={menuItems}
            onCloseMobile={() => setOpenMobile(false)}
          />
        </aside>
      </div>
    </>
  );
}
