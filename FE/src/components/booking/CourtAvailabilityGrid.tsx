import { AuthAlert } from '@/components/auth/AuthAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrencyVnd,
  formatTimeShort,
  getSlotStatusLabel,
} from '@/lib/booking';
import { cn } from '@/lib/utils';
import type {
  CourtAvailabilityResponse,
  SelectedBookingSlot,
  TimeSlotAvailability,
} from '@/types/booking';

export interface CourtAvailabilityGridProps {
  courts: CourtAvailabilityResponse[];
  loading: boolean;
  errorMessage: string | null;
  selectedSlot: SelectedBookingSlot | null;
  onSelectSlot: (selection: SelectedBookingSlot) => void;
  onRetry: () => void;
  compact?: boolean;
}

interface SlotSessionGroup {
  key: 'MORNING' | 'AFTERNOON' | 'EVENING';
  label: string;
  timeHint: string;
  slots: TimeSlotAvailability[];
}

function groupSlotsBySession(slots: TimeSlotAvailability[]): SlotSessionGroup[] {
  const morning: TimeSlotAvailability[] = [];
  const afternoon: TimeSlotAvailability[] = [];
  const evening: TimeSlotAvailability[] = [];

  slots.forEach((slot) => {
    const startHour = Number(slot.startTime.split(':')[0] ?? 0);
    if (startHour < 12) {
      morning.push(slot);
    } else if (startHour < 18) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });

  const groups: SlotSessionGroup[] = [
    {
      key: 'MORNING',
      label: 'Sáng',
      timeHint: 'Trước 12:00',
      slots: morning,
    },
    {
      key: 'AFTERNOON',
      label: 'Chiều',
      timeHint: '12:00 – 18:00',
      slots: afternoon,
    },
    {
      key: 'EVENING',
      label: 'Tối',
      timeHint: 'Sau 18:00',
      slots: evening,
    },
  ];

  return groups.filter((group) => group.slots.length > 0);
}

export function CourtAvailabilityGrid({
  courts,
  loading,
  errorMessage,
  selectedSlot,
  onSelectSlot,
  onRetry,
  compact = false,
}: CourtAvailabilityGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="border-zinc-200/90 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-1.5 h-5 w-64" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="space-y-4 p-6">
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Thử tải lại lịch trống
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courts.length === 0) {
    return (
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">
            Không tìm thấy sân cầu lông nào trong ngày này
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Vui lòng chọn ngày khác hoặc đổi bộ lọc cụm sân.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {courts.map((court) => {
        const isMaintenance = court.courtStatus === 'MAINTENANCE';
        const freeCount = isMaintenance
          ? 0
          : court.slots.filter((s) => s.slotStatus === 'FREE').length;
        const sessionGroups = groupSlotsBySession(court.slots);

        return (
          <Card
            key={court.courtId}
            className={cn(
              'overflow-hidden border-zinc-200/90 bg-white shadow-xs transition-colors',
              isMaintenance && 'border-amber-200/80 bg-amber-50/15'
            )}
          >
            <CardHeader
              className={cn(
                'border-b border-zinc-100 bg-zinc-50/50 pb-3.5',
                compact && 'p-4 pb-3'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-4 w-1 shrink-0 rounded-full',
                        isMaintenance ? 'bg-amber-500' : 'bg-zinc-900'
                      )}
                      aria-hidden="true"
                    />
                    <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-900">
                      {court.courtName}
                    </CardTitle>
                  </div>

                  {/* Highlighted Complex / Address Badge in Indigo */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 shrink-0 text-indigo-600"
                        aria-hidden="true"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {court.complexName}
                    </span>

                    {!isMaintenance && (
                      <span className="text-xs font-medium text-zinc-500">
                        &middot; Còn{' '}
                        <strong className="font-semibold tabular-nums text-amber-700">
                          {freeCount}
                        </strong>{' '}
                        khung giờ trống
                      </span>
                    )}
                  </div>
                </div>

                {isMaintenance ? (
                  <Badge variant="amber">Đang bảo trì</Badge>
                ) : (
                  <Badge variant="zinc" className="font-semibold">
                    Sẵn sàng
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className={cn('space-y-4 pt-4', compact && 'p-4 pt-3')}>
              {isMaintenance && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Sân hiện đang bảo trì, toàn bộ khung giờ tạm ngưng nhận đặt chỗ.
                </p>
              )}

              {sessionGroups.map((session) => (
                <div key={session.key} className="space-y-2">
                  {/* Session Heading: Sáng / Chiều / Tối */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        aria-hidden="true"
                      />
                      {session.label}:
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      ({session.timeHint})
                    </span>
                    <div className="h-px flex-1 bg-zinc-100" />
                  </div>

                  {/* Compact Slot Cards (Only Time + Price + Status) */}
                  <div
                    className={cn(
                      'grid grid-cols-1 gap-2.5 sm:grid-cols-2',
                      compact ? 'lg:grid-cols-2' : 'xl:grid-cols-3'
                    )}
                  >
                    {session.slots.map((slot) => {
                      const isFree =
                        !isMaintenance && slot.slotStatus === 'FREE';
                      const isBooked =
                        !isMaintenance && slot.slotStatus === 'BOOKED';
                      const isSelected =
                        selectedSlot?.courtId === court.courtId &&
                        selectedSlot?.slot.timeSlotId === slot.timeSlotId;

                      const effectiveStatus = isMaintenance
                        ? 'UNAVAILABLE'
                        : slot.slotStatus;

                      const statusLabel = isMaintenance
                        ? 'Bảo trì'
                        : getSlotStatusLabel(effectiveStatus);

                      return (
                        <button
                          key={slot.timeSlotId}
                          type="button"
                          disabled={!isFree}
                          onClick={() =>
                            onSelectSlot({
                              courtId: court.courtId,
                              courtName: court.courtName,
                              complexName: court.complexName,
                              slot,
                            })
                          }
                          className={cn(
                            'group flex flex-col justify-between rounded-xl border px-3.5 py-3 text-left transition-all',
                            isFree && !isSelected
                              ? 'cursor-pointer border-zinc-200 bg-white hover:border-amber-500 hover:bg-amber-50/25 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 active:scale-[0.99]'
                              : '',
                            isSelected
                              ? 'cursor-pointer border-2 border-amber-600 bg-amber-50/55 shadow-xs ring-2 ring-amber-500/20'
                              : '',
                            isBooked
                              ? 'cursor-not-allowed border-red-200 bg-red-50/60'
                              : '',
                            !isFree && !isBooked
                              ? 'cursor-not-allowed border-zinc-200/80 bg-zinc-100/75 text-zinc-400 opacity-75'
                              : ''
                          )}
                        >
                          {/* Row 1: Time + Status Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-sans text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap',
                                isSelected
                                  ? 'border-amber-400 bg-amber-100 text-amber-950'
                                  : isFree
                                    ? 'border-amber-200 bg-amber-50 text-amber-900 group-hover:border-amber-300 group-hover:bg-amber-100/80'
                                    : isBooked
                                      ? 'border-red-200 bg-white text-red-700 line-through'
                                      : 'border-zinc-200 bg-zinc-200/50 text-zinc-400'
                              )}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0',
                                  isSelected
                                    ? 'text-amber-700'
                                    : isFree
                                      ? 'text-amber-600'
                                      : isBooked
                                        ? 'text-red-600'
                                        : 'text-zinc-400'
                                )}
                                aria-hidden="true"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>
                                {formatTimeShort(slot.startTime)} &ndash;{' '}
                                {formatTimeShort(slot.endTime)}
                              </span>
                            </div>

                            <span
                              className={cn(
                                'shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold',
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : isFree
                                    ? 'border border-zinc-200 bg-zinc-100 text-zinc-800 group-hover:border-amber-300 group-hover:bg-amber-100 group-hover:text-amber-900'
                                    : isBooked
                                      ? 'bg-red-600 text-white'
                                      : 'bg-zinc-200/80 text-zinc-500'
                              )}
                            >
                              {isSelected ? 'Đang chọn' : statusLabel}
                            </span>
                          </div>

                          {/* Row 2: Price */}
                          <div
                            className={cn(
                              'mt-2.5 flex items-center justify-between gap-2 border-t pt-2',
                              isSelected
                                ? 'border-amber-200/80'
                                : isFree
                                  ? 'border-zinc-100'
                                  : isBooked
                                    ? 'border-red-200/60'
                                    : 'border-zinc-200/60'
                            )}
                          >
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                isSelected
                                  ? 'text-amber-900/80'
                                  : isFree
                                    ? 'text-zinc-500'
                                    : isBooked
                                      ? 'text-red-800/70'
                                      : 'text-zinc-400'
                              )}
                            >
                              Đơn giá
                            </span>

                            <span
                              className={cn(
                                'whitespace-nowrap font-sans text-xs sm:text-sm font-bold tabular-nums',
                                isSelected
                                  ? 'text-indigo-700'
                                  : isFree
                                    ? 'text-indigo-700'
                                    : isBooked
                                      ? 'text-zinc-500'
                                      : 'text-zinc-400'
                              )}
                            >
                              {formatCurrencyVnd(slot.pricePerHour)}/giờ
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
