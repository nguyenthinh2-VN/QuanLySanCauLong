import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { ComplexDetailDialog } from '@/components/court/ComplexDetailDialog';
import { ComplexFilterBar } from '@/components/court/ComplexFilterBar';
import { ComplexFormDialog } from '@/components/court/ComplexFormDialog';
import { ComplexTable } from '@/components/court/ComplexTable';
import { CourtFilterBar } from '@/components/court/CourtFilterBar';
import { CourtFormDialog } from '@/components/court/CourtFormDialog';
import { CourtSegmentedControl, type CourtTabType } from '@/components/court/CourtSegmentedControl';
import { CourtTable } from '@/components/court/CourtTable';
import { DeleteComplexDialog } from '@/components/court/DeleteComplexDialog';
import { DeleteCourtDialog } from '@/components/court/DeleteCourtDialog';
import { TimeSlotFormDialog } from '@/components/court/TimeSlotFormDialog';
import { TimeSlotTable } from '@/components/court/TimeSlotTable';
import { extractErrorMessage } from '@/lib/auth';
import {
  getComplexes,
  getCourts,
  getTimeSlots,
} from '@/lib/court';
import type {
  Complex,
  ComplexStatus,
  Court,
  CourtStatus,
  TimeSlot,
} from '@/types/court';

export function CourtsPage() {
  const [activeTab, setActiveTab] = useState<CourtTabType>('COMPLEXES');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Danh sách cụm sân đầy đủ (size=100) để cấp cho dropdowns
  // Giả định: số lượng cụm sân trong hệ thống thường ít (<100), 1 trang là đủ để chọn
  const [allComplexes, setAllComplexes] = useState<Complex[]>([]);

  const loadAllComplexesDropdown = useCallback(async () => {
    try {
      const res = await getComplexes({ size: 100, sort: 'name,asc' });
      setAllComplexes(res.items);
    } catch {
      // Bỏ qua lỗi phụ
    }
  }, []);

  useEffect(() => {
    void loadAllComplexesDropdown();
  }, [loadAllComplexesDropdown]);

  // ==========================================
  // TAB 1: CỤM SÂN (COMPLEXES)
  // ==========================================
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [complexQuery, setComplexQuery] = useState('');
  const [complexStatus, setComplexStatus] = useState<string>('ALL');
  const [complexPage, setComplexPage] = useState(0);
  const [complexTotalPages, setComplexTotalPages] = useState(0);
  const [complexTotalElements, setComplexTotalElements] = useState(0);
  const [complexLoading, setComplexLoading] = useState(false);
  const [complexError, setComplexError] = useState<string | null>(null);

  const [detailComplexId, setDetailComplexId] = useState<number | null>(null);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [isCreateComplexOpen, setIsCreateComplexOpen] = useState(false);
  const [deletingComplex, setDeletingComplex] = useState<Complex | null>(null);

  const fetchComplexesData = useCallback(async () => {
    setComplexLoading(true);
    setComplexError(null);
    try {
      const res = await getComplexes({
        q: complexQuery.trim() || undefined,
        status: complexStatus !== 'ALL' ? (complexStatus as ComplexStatus) : undefined,
        page: complexPage,
        size: 10,
        sort: 'createdAt,desc',
      });
      setComplexes(res.items);
      setComplexTotalPages(res.totalPages);
      setComplexTotalElements(res.totalElements);
    } catch (err) {
      setComplexError(extractErrorMessage(err, 'Không thể tải danh sách cụm sân'));
      setComplexes([]);
    } finally {
      setComplexLoading(false);
    }
  }, [complexQuery, complexStatus, complexPage]);

  useEffect(() => {
    void fetchComplexesData();
  }, [fetchComplexesData]);

  function handleComplexFilterReset() {
    setComplexQuery('');
    setComplexStatus('ALL');
    setComplexPage(0);
  }

  // ==========================================
  // TAB 2: SÂN CON (COURTS)
  // ==========================================
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtComplexId, setCourtComplexId] = useState<string>('ALL');
  const [courtStatus, setCourtStatus] = useState<string>('ALL');
  const [courtQuery, setCourtQuery] = useState('');
  const [courtPage, setCourtPage] = useState(0);
  const [courtTotalPages, setCourtTotalPages] = useState(0);
  const [courtTotalElements, setCourtTotalElements] = useState(0);
  const [courtLoading, setCourtLoading] = useState(false);
  const [courtError, setCourtError] = useState<string | null>(null);

  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isCreateCourtOpen, setIsCreateCourtOpen] = useState(false);
  const [deletingCourt, setDeletingCourt] = useState<Court | null>(null);

  const fetchCourtsData = useCallback(async () => {
    setCourtLoading(true);
    setCourtError(null);
    try {
      const parsedComplexId =
        courtComplexId !== 'ALL' && !isNaN(Number(courtComplexId))
          ? Number(courtComplexId)
          : undefined;

      const res = await getCourts({
        complexId: parsedComplexId,
        status: courtStatus !== 'ALL' ? (courtStatus as CourtStatus) : undefined,
        q: courtQuery.trim() || undefined,
        page: courtPage,
        size: 10,
        sort: 'createdAt,desc',
      });
      setCourts(res.items);
      setCourtTotalPages(res.totalPages);
      setCourtTotalElements(res.totalElements);
    } catch (err) {
      setCourtError(extractErrorMessage(err, 'Không thể tải danh sách sân con'));
      setCourts([]);
    } finally {
      setCourtLoading(false);
    }
  }, [courtComplexId, courtStatus, courtQuery, courtPage]);

  useEffect(() => {
    void fetchCourtsData();
  }, [fetchCourtsData]);

  function handleCourtFilterReset() {
    setCourtComplexId('ALL');
    setCourtStatus('ALL');
    setCourtQuery('');
    setCourtPage(0);
  }

  // ==========================================
  // TAB 3: KHUNG GIỜ & BẢNG GIÁ (TIME SLOTS)
  // ==========================================
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);

  const fetchTimeSlotsData = useCallback(async () => {
    setSlotLoading(true);
    setSlotError(null);
    try {
      const data = await getTimeSlots();
      setTimeSlots(data);
    } catch (err) {
      setSlotError(extractErrorMessage(err, 'Không thể tải bảng khung giờ'));
      setTimeSlots([]);
    } finally {
      setSlotLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTimeSlotsData();
  }, [fetchTimeSlotsData]);

  return (
    <div className="space-y-4">
      {/* Header trang */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Quản Lý Cụm Sân & Khung Giờ
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Thiết lập danh mục cụm sân, sân cầu lông con và bảng giá thuê theo từng khung giờ
        </p>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="relative">
          <AuthAlert variant="success">{successMessage}</AuthAlert>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="absolute right-3 top-3 text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Segmented Control 3 Tab */}
      <CourtSegmentedControl
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        complexCount={complexTotalElements}
        courtCount={courtTotalElements}
        slotCount={timeSlots.length}
      />

      {/* Nội dung Tab Cụm sân */}
      {activeTab === 'COMPLEXES' && (
        <div className="space-y-3">
          {complexError && <AuthAlert variant="error">{complexError}</AuthAlert>}

          <ComplexFilterBar
            query={complexQuery}
            onQueryChange={(q) => {
              setComplexQuery(q);
              setComplexPage(0);
            }}
            status={complexStatus}
            onStatusChange={(st) => {
              setComplexStatus(st);
              setComplexPage(0);
            }}
            onReset={handleComplexFilterReset}
            onCreateClick={() => setIsCreateComplexOpen(true)}
          />

          <ComplexTable
            complexes={complexes}
            loading={complexLoading}
            page={complexPage}
            totalPages={complexTotalPages}
            totalElements={complexTotalElements}
            onPageChange={setComplexPage}
            onViewDetail={(c) => setDetailComplexId(c.id)}
            onEdit={(c) => setEditingComplex(c)}
            onDelete={(c) => setDeletingComplex(c)}
          />
        </div>
      )}

      {/* Nội dung Tab Sân con */}
      {activeTab === 'COURTS' && (
        <div className="space-y-3">
          {courtError && <AuthAlert variant="error">{courtError}</AuthAlert>}

          <CourtFilterBar
            complexes={allComplexes}
            selectedComplexId={courtComplexId}
            onComplexChange={(id) => {
              setCourtComplexId(id);
              setCourtPage(0);
            }}
            status={courtStatus}
            onStatusChange={(st) => {
              setCourtStatus(st);
              setCourtPage(0);
            }}
            query={courtQuery}
            onQueryChange={(q) => {
              setCourtQuery(q);
              setCourtPage(0);
            }}
            onReset={handleCourtFilterReset}
            onCreateClick={() => setIsCreateCourtOpen(true)}
          />

          <CourtTable
            courts={courts}
            loading={courtLoading}
            page={courtPage}
            totalPages={courtTotalPages}
            totalElements={courtTotalElements}
            onPageChange={setCourtPage}
            onEdit={(c) => setEditingCourt(c)}
            onDelete={(c) => setDeletingCourt(c)}
          />
        </div>
      )}

      {/* Nội dung Tab Khung giờ & giá */}
      {activeTab === 'TIME_SLOTS' && (
        <div className="space-y-3">
          {slotError && <AuthAlert variant="error">{slotError}</AuthAlert>}

          <TimeSlotTable
            timeSlots={timeSlots}
            loading={slotLoading}
            onCreateClick={() => setIsCreateSlotOpen(true)}
            onEdit={(s) => setEditingSlot(s)}
          />
        </div>
      )}

      {/* Modals Cụm sân */}
      <ComplexDetailDialog
        complexId={detailComplexId}
        onClose={() => setDetailComplexId(null)}
      />

      <ComplexFormDialog
        open={isCreateComplexOpen || Boolean(editingComplex)}
        initialData={editingComplex}
        onClose={() => {
          setIsCreateComplexOpen(false);
          setEditingComplex(null);
        }}
        onSaved={(_item, msg) => {
          setSuccessMessage(msg);
          void fetchComplexesData();
          void loadAllComplexesDropdown();
        }}
      />

      <DeleteComplexDialog
        complex={deletingComplex}
        onClose={() => setDeletingComplex(null)}
        onDeleted={(_item, msg) => {
          setSuccessMessage(msg);
          void fetchComplexesData();
          void loadAllComplexesDropdown();
        }}
      />

      {/* Modals Sân con */}
      <CourtFormDialog
        open={isCreateCourtOpen || Boolean(editingCourt)}
        initialData={editingCourt}
        complexes={allComplexes}
        defaultComplexId={courtComplexId !== 'ALL' ? Number(courtComplexId) : undefined}
        onClose={() => {
          setIsCreateCourtOpen(false);
          setEditingCourt(null);
        }}
        onSaved={(_item, msg) => {
          setSuccessMessage(msg);
          void fetchCourtsData();
          void fetchComplexesData(); // Cập nhật lại totalCourts của cụm
          void loadAllComplexesDropdown();
        }}
      />

      <DeleteCourtDialog
        court={deletingCourt}
        onClose={() => setDeletingCourt(null)}
        onDeleted={(_item, msg) => {
          setSuccessMessage(msg);
          void fetchCourtsData();
          void fetchComplexesData(); // Cập nhật lại totalCourts của cụm
          void loadAllComplexesDropdown();
        }}
      />

      {/* Modals Khung giờ */}
      <TimeSlotFormDialog
        open={isCreateSlotOpen || Boolean(editingSlot)}
        initialData={editingSlot}
        onClose={() => {
          setIsCreateSlotOpen(false);
          setEditingSlot(null);
        }}
        onSaved={(_item, msg) => {
          setSuccessMessage(msg);
          void fetchTimeSlotsData();
        }}
      />
    </div>
  );
}
