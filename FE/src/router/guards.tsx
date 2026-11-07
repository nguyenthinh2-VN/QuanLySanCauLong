import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth';
import { Skeleton } from '@/components/ui/skeleton';

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-50">
      <div className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="space-y-2.5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

interface RoleRouteProps {
  allowed: Role[];
  children?: React.ReactNode;
}

export function RoleRoute({ allowed, children }: RoleRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasPermission = user.roles.some((role) => allowed.includes(role));
  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
