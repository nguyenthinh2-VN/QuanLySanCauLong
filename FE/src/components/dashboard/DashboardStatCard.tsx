import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface StatCardItem {
  label: string;
  value: string;
  unit?: string;
  subtext: string;
  badgeText: string;
  badgeVariant: 'zinc' | 'sky' | 'indigo' | 'amber';
  accentBarClass: string;
}

export interface DashboardStatCardProps {
  stat: StatCardItem;
}

export function DashboardStatCard({ stat }: DashboardStatCardProps) {
  return (
    <Card className="relative overflow-hidden border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className={`h-1 w-full ${stat.accentBarClass}`} />
      <CardHeader className="space-y-3 pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {stat.label}
          </span>
          <Badge variant={stat.badgeVariant} className="shrink-0 whitespace-nowrap">
            {stat.badgeText}
          </Badge>
        </div>
        <div className="flex items-baseline gap-1.5 font-sans">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-900">
            {stat.value}
          </span>
          {stat.unit && (
            <span className="text-sm font-semibold text-slate-500">
              {stat.unit}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <p className="text-xs font-medium text-slate-500">{stat.subtext}</p>
      </CardContent>
    </Card>
  );
}
