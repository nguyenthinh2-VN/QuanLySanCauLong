import { useAuth } from '@/hooks/useAuth';
import { getPrimaryRole } from '@/lib/auth';
import { DashboardWelcomeBanner } from '@/components/dashboard/DashboardWelcomeBanner';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { DashboardChartPlaceholder } from '@/components/dashboard/DashboardChartPlaceholder';
import type { Role } from '@/types/auth';

export function DashboardPage() {
  const { user } = useAuth();
  const primaryRole: Role = user ? getPrimaryRole(user.roles) : 'CUSTOMER';

  return (
    <div className="space-y-6">
      <DashboardWelcomeBanner
        fullName={user?.fullName}
        primaryRole={primaryRole}
      />
      <DashboardStatsGrid primaryRole={primaryRole} />
      <DashboardChartPlaceholder />
    </div>
  );
}
