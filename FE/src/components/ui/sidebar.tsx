import * as React from 'react';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'sidebar:state';
const MOBILE_BREAKPOINT = 768;

interface SidebarContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  const [open, setOpenState] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Ignore storage access errors
    }
    return defaultOpen;
  });

  const [openMobile, setOpenMobile] = React.useState<boolean>(false);

  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setOpenState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        try {
          window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // Ignore storage access errors
        }
        return next;
      });
    },
    []
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) {
        setOpenMobile(false);
      }
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile, setOpen]);

  // Keyboard shortcut: Ctrl+B or Cmd+B (standard shadcn/ui sidebar shortcut)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === 'b' &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  SidebarTriggerProps
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();
  const isExpanded = isMobile ? openMobile : open;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={isExpanded ? 'Thu gọn thanh điều hướng' : 'Mở thanh điều hướng'}
      aria-expanded={isExpanded}
      title="Đóng/mở menu điều hướng (Ctrl+B)"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20',
        className
      )}
      {...props}
    >
      {/* shadcn/ui PanelLeft icon */}
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
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
      <span className="sr-only">Đóng/mở menu</span>
    </button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';
