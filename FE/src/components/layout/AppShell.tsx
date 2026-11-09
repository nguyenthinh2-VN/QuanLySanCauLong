import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/ui/sidebar';

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-zinc-50/70 text-zinc-900">
        <Sidebar />
        <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
