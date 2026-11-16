import { Button } from '@/components/ui/button';

export type CourtTabType = 'COMPLEXES' | 'COURTS' | 'TIME_SLOTS';

export interface CourtSegmentedControlProps {
  activeTab: CourtTabType;
  onChangeTab: (tab: CourtTabType) => void;
  complexCount?: number;
  courtCount?: number;
  slotCount?: number;
}

export function CourtSegmentedControl({
  activeTab,
  onChangeTab,
  complexCount,
  courtCount,
  slotCount,
}: CourtSegmentedControlProps) {
  const tabs: { id: CourtTabType; label: string; count?: number }[] = [
    { id: 'COMPLEXES', label: 'Cụm sân', count: complexCount },
    { id: 'COURTS', label: 'Sân con', count: courtCount },
    { id: 'TIME_SLOTS', label: 'Khung giờ & giá', count: slotCount },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100/80 p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChangeTab(tab.id)}
            className={`h-9 px-4 text-xs font-medium transition-all ${
              isActive
                ? 'bg-zinc-900 text-zinc-50 shadow-xs hover:bg-zinc-800 hover:text-zinc-50'
                : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
