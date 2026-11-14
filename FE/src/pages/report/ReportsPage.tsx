import { useCallback, useEffect, useMemo, useState } from 'react';
import { OccupancyReportSection } from '@/components/report/OccupancyReportSection';
import { ReportFilterBar } from '@/components/report/ReportFilterBar';
import { RevenueReportSection } from '@/components/report/RevenueReportSection';
import { extractErrorMessage } from '@/lib/auth';
import { extractErrorCode } from '@/lib/booking';
import {
  REPORT_MAX_RANGE_DAYS,
  diffDaysInclusive,
  getAvailableCourts,
  getDefaultReportRange,
  getOccupancyReport,
  getRevenueReport,
} from '@/lib/report';
import type {
  CourtOption,
  OccupancyReportResponse,
  ReportGroupBy,
  RevenueReportResponse,
} from '@/types/report';

export function ReportsPage() {
  const defaultRange = useMemo(() => getDefaultReportRange(), []);
  const [from, setFrom] = useState<string>(defaultRange.from);
  const [to, setTo] = useState<string>(defaultRange.to);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('DAY');
  const [courtId, setCourtId] = useState<string>('ALL');

  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [courtsLoading, setCourtsLoading] = useState<boolean>(true);

  const [revenueReport, setRevenueReport] =
    useState<RevenueReportResponse | null>(null);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [occupancyReport, setOccupancyReport] =
    useState<OccupancyReportResponse | null>(null);
  const [occupancyLoading, setOccupancyLoading] = useState<boolean>(true);
  const [occupancyError, setOccupancyError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!from || !to) return 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.';
    if (from > to) return 'Ngày bắt đầu không được sau ngày kết thúc';
    const days = diffDaysInclusive(from, to);
    if (isNaN(days) || days > REPORT_MAX_RANGE_DAYS) {
      return 'Khoảng thời gian báo cáo không được vượt quá 366 ngày';
    }
    return null;
  }, [from, to]);

  useEffect(() => {
    let active = true;
    setCourtsLoading(true);
    getAvailableCourts()
      .then((list) => {
        if (active) setCourts(list);
      })
      .catch(() => {
        if (active) setCourts([]);
      })
      .finally(() => {
        if (active) setCourtsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchReports = useCallback(async () => {
    if (validationError) return;

    setRevenueLoading(true);
    setOccupancyLoading(true);
    setRevenueError(null);

    const parsedCourtId =
      courtId !== 'ALL' && !isNaN(Number(courtId)) ? Number(courtId) : undefined;

    const [revResult, occResult] = await Promise.allSettled([
      getRevenueReport({ from, to, groupBy }),
      getOccupancyReport({ from, to, courtId: parsedCourtId }),
    ]);

    if (revResult.status === 'fulfilled') {
      setRevenueReport(revResult.value);
    } else {
      setRevenueError(
        extractErrorMessage(revResult.reason, 'Không thể tải báo cáo doanh thu')
      );
    }
    setRevenueLoading(false);

    if (occResult.status === 'fulfilled') {
      setOccupancyReport(occResult.value);
    } else {
      const code = extractErrorCode(occResult.reason);
      const msg = extractErrorMessage(
        occResult.reason,
        'Không thể tải báo cáo công suất sân'
      );
      setOccupancyError(msg);
      if (code === 'COURT_NOT_FOUND') {
        setCourtId('ALL');
      }
    }
    setOccupancyLoading(false);
  }, [from, to, groupBy, courtId, validationError]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  function handleResetDefault() {
    const fresh = getDefaultReportRange();
    setFrom(fresh.from);
    setTo(fresh.to);
    setGroupBy('DAY');
    setCourtId('ALL');
    setOccupancyError(null);
  }

  const selectedCourtName =
    courtId === 'ALL'
      ? undefined
      : courts.find((c) => String(c.id) === courtId)?.name;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              Báo cáo Doanh thu &amp; Công suất sân
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Theo dõi doanh thu thuần thực thu (Net Revenue) và tỉ lệ lấp đầy sân cầu lông theo kỳ.
            </p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800">
            Quản trị viên (ADMIN)
          </span>
        </div>
      </div>

      <ReportFilterBar
        from={from}
        to={to}
        groupBy={groupBy}
        courtId={courtId}
        courts={courts}
        courtsLoading={courtsLoading}
        validationError={validationError}
        loading={revenueLoading || occupancyLoading}
        onFromChange={(val) => {
          setOccupancyError(null);
          setFrom(val);
        }}
        onToChange={(val) => {
          setOccupancyError(null);
          setTo(val);
        }}
        onGroupByChange={setGroupBy}
        onCourtIdChange={(val) => {
          setOccupancyError(null);
          setCourtId(val);
        }}
        onResetDefault={handleResetDefault}
      />

      <RevenueReportSection
        report={revenueReport}
        loading={revenueLoading}
        errorMessage={revenueError}
      />

      <OccupancyReportSection
        report={occupancyReport}
        loading={occupancyLoading}
        errorMessage={occupancyError}
        selectedCourtName={selectedCourtName}
      />
    </div>
  );
}

