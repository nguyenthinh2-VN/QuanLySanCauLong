# ĐẶC TẢ CHI TIẾT FE PHASE 6: BÁO CÁO DOANH THU & CÔNG SUẤT SÂN (MODULE 8)

> **Mục tiêu Phase 6:**
> 1. Hoàn thiện màn hình **Báo cáo Doanh thu & Công suất sân (`/reports` — `ReportsPage.tsx`)** dành riêng cho vai trò **`ADMIN`**.
> 2. Kết nối trực tiếp 2 endpoint quản trị của Module 8 (`GET /api/v1/reports/revenue` và `GET /api/v1/reports/occupancy`) cùng danh sách sân khả dụng (`GET /api/v1/courts?status=AVAILABLE&size=100`).
> 3. Tuân thủ đúng ngữ nghĩa nghiệp vụ của Backend: **Doanh thu thuần (Net Revenue = Gross − Refunded)** và **Công suất sân (loại `CANCELLED`, mẫu số chỉ tính sân `AVAILABLE`)**.

---

## 1. Phân Quyền & Bộ Lọc Chung (`/reports`)

- **Phân quyền:** Route `/reports` nằm trong `RoleRoute allowed={['ADMIN']}`. Tài khoản `STAFF` hoặc `CUSTOMER` truy cập sẽ bị chuyển hướng về `/403 Forbidden`.
- **Thanh lọc (`ReportFilterBar.tsx`):**
  - `from` & `to`: Mặc định 30 ngày gần nhất (`to` = hôm nay, `from` = `to - 29 ngày`). Validate phía client trước khi gọi API: `from <= to` và khoảng thời gian không vượt quá **366 ngày**.
  - `groupBy` (`DAY` | `WEEK` | `MONTH`, mặc định `DAY`): **Chỉ áp dụng cho khu vực Doanh thu** (có ghi chú rõ ngay dưới select).
  - `courtId` (`ALL` hoặc ID sân `AVAILABLE`): **Chỉ áp dụng cho khu vực Công suất sân** (có ghi chú rõ ngay dưới select). Nếu gặp lỗi `404 COURT_NOT_FOUND`, UI hiển thị nguyên văn thông báo server và tự động reset về `"Tất cả sân"`.

---

## 2. Khu Vực 1: Báo Cáo Doanh Thu (`GET /api/v1/reports/revenue`)

### 2.1. Ngữ Nghĩa Nghiệp Vụ
- **Mốc thời gian:** Lọc theo `paidAt` (thời điểm tiền thực sự về hoặc hoàn trả), **không** dùng `createdAt`.
- **Công thức Doanh thu thuần:**
  - `netRevenue = grossRevenue - refundedAmount`
  - `grossRevenue`: Tổng tiền các giao dịch có trạng thái `SUCCESS`.
  - `refundedAmount`: Tổng tiền các giao dịch có trạng thái `REFUNDED`.
  - Giao dịch `PENDING` và `FAILED` **không tính** vào báo cáo.
- **Tổng số giao dịch (`transactionCount`):** Chỉ đếm các giao dịch `SUCCESS` (không cộng giao dịch hoàn tiền).

### 2.2. Thành Phần Giao Diện
- **4 Thẻ KPI (`RevenueKpiGrid.tsx`):** Tái sử dụng `DashboardStatCard` hiển thị Doanh thu thuần, Doanh thu gộp, Tiền đã hoàn và Tổng giao dịch thành công.
- **Bảng theo phương thức thanh toán (`PaymentMethodBreakdownCard.tsx`):** Luôn hiển thị đủ 3 dòng (`CASH`, `BANK_TRANSFER`, `E_WALLET`). Vì Backend chỉ trả về phương thức có phát sinh giao dịch `SUCCESS` trong kỳ, FE tự động bù `0đ` / `0` giao dịch cho phương thức vắng mặt.
- **Biểu đồ dòng thời gian (`RevenueTimelineChart.tsx`):**
  - **Giới hạn kỹ thuật:** Vẽ bằng **CSS thuần (`div`)** theo tông Zinc (không cài thêm thư viện biểu đồ ngoài).
  - Hiển thị liền mạch toàn bộ dải kỳ do Backend trả về, bao gồm cả các mốc `0đ` / `0` giao dịch.
  - Chế độ `WEEK` gom Thứ Hai–Chủ Nhật (nhãn là ngày Thứ Hai đầu tuần); chế độ `MONTH` hiển thị theo tháng `MM/yyyy`.

---

## 3. Khu Vực 2: Báo Cáo Công Suất Sân (`GET /api/v1/reports/occupancy`)

### 3.1. Ngữ Nghĩa Nghiệp Vụ
- **Slot đã đặt (Tử số `bookedSlots`):** Tính các booking có trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`. Đơn **`CANCELLED`** luôn bị loại bỏ.
- **Tổng slot khả dụng (Mẫu số `totalSlots`):** `Số sân AVAILABLE × Số TimeSlot × Số ngày trong kỳ` (hoặc `1 × Số TimeSlot × Số ngày` khi lọc 1 sân).
- **Giới hạn đã biết:** Sân đang ở trạng thái **`MAINTENANCE`** không tính vào mẫu số (Backend dùng trạng thái sân hiện tại, không phục dựng lịch sử bảo trì). Nếu chưa có sân `AVAILABLE` hoặc chưa cấu hình `TimeSlot`, tỉ lệ mặc định bằng `0,00%`.

### 3.2. Thành Phần Giao Diện
- **Tổng quan công suất (`OccupancyOverviewCard.tsx`):** Hiển thị `overallRate` (2 chữ số thập phân, ví dụ `62,50%`), tỉ số `bookedSlots / totalSlots` và thanh tiến trình CSS.
- **Bảng theo từng sân (`CourtOccupancyTable.tsx`):** Tên sân, số slot đã đặt / tổng slot, tỉ lệ % + thanh progress CSS.
- **Bảng theo từng ngày (`DailyOccupancyTable.tsx`):** Ngày (`dd/MM/yyyy`), số slot đã đặt / tổng slot, tỉ lệ % + thanh progress CSS (với vùng cuộn dọc cho kỳ dài).

---

## 4. Danh Mục Component Phân Tách (`FE/src/components/report/`)

| STT | Tên Component | Vai trò & Trách nhiệm |
|:---:|---|---|
| 1 | `ReportFilterBar.tsx` | Thanh lọc `from`, `to`, `groupBy`, `courtId` kèm ghi chú phạm vi và cảnh báo validate. |
| 2 | `RevenueKpiGrid.tsx` | Lưới 4 thẻ KPI doanh thu (tái sử dụng `DashboardStatCard`). |
| 3 | `PaymentMethodBreakdownCard.tsx` | Bảng phân rã theo 3 phương thức thanh toán (tự bù 0đ cho phương thức vắng mặt). |
| 4 | `RevenueTimelineChart.tsx` | Biểu đồ cột CSS thuần vẽ dòng thời gian liên tục (kèm dải xem chi tiết từng mốc). |
| 5 | `RevenueReportSection.tsx` | Điều phối hiển thị khu vực Báo cáo Doanh thu (header, skeleton, error, KPI, bảng, chart). |
| 6 | `OccupancyOverviewCard.tsx` | Thẻ hiển thị tỉ lệ lấp đầy chung `overallRate` và thanh tiến trình. |
| 7 | `CourtOccupancyTable.tsx` | Bảng tỉ lệ lấp đầy theo từng sân `byCourt`. |
| 8 | `DailyOccupancyTable.tsx` | Bảng tỉ lệ lấp đầy theo từng ngày `daily`. |
| 9 | `OccupancyReportSection.tsx` | Điều phối hiển thị khu vực Báo cáo Công suất sân. |
| 10 | `ReportsPage.tsx` | Page Composer mỏng tại `src/pages/report/ReportsPage.tsx` gọi song song 2 API báo cáo. |

