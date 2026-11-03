# Implementation Plan: Module 8 - Dashboard & Revenue Reporting (Báo cáo Thống kê)

## 1. Overview
Module 8 là module cuối cùng của backend hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong`. Module này cung cấp 2 REST API thống kê chuyên biệt dành riêng cho Quản trị viên (`ADMIN`):
1. `GET /api/v1/reports/revenue`: Báo cáo doanh thu thuần (Net Revenue = Doanh thu gộp - Hoàn tiền), tổng hợp toàn kỳ, phân rã theo phương thức thanh toán và theo dòng thời gian (Ngày / Tuần / Tháng).
2. `GET /api/v1/reports/occupancy`: Báo cáo tỉ lệ lấp đầy sân (Occupancy Rate) theo kỳ và theo sân, tính toán dựa trên các booking thực tế (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`), tự động sinh dải dữ liệu liền mạch cho biểu đồ Frontend.

Module hoạt động theo nguyên tắc **Read-Only** (`@Transactional(readOnly = true)`), không tạo Entity mới, không sửa đổi logic hiện có của Module 1–7, chỉ bổ sung các query JPQL tổng hợp vào các repository sẵn có (`PaymentRepository`, `BookingRepository`, `CourtRepository`, `TimeSlotRepository`).

---

## 2. Architecture Decisions & Rationale

### Quyết định 1: Tính Doanh thu thuần (Net Revenue) thay vì chỉ Doanh thu gộp (Gross Revenue)
- **Bối cảnh:** Khi khách hàng hủy lịch đặt sân theo chính sách hoàn tiền ở Module 6, giao dịch hoàn tiền tạo ra bản ghi `Payment` với trạng thái `REFUNDED`.
- **Giải pháp:** Báo cáo doanh thu lọc tất cả các giao dịch thanh toán trong kỳ có trạng thái `SUCCESS` (ghi nhận doanh thu gộp `grossRevenue`) và `REFUNDED` (ghi nhận số tiền hoàn trả `refundedAmount`). Doanh thu thực tế của cụm sân là `netRevenue = grossRevenue - refundedAmount`.
- **Lý do:** Đảm bảo số liệu tài chính phản ánh đúng dòng tiền thực thu của chủ sân, không bị thổi phồng doanh thu ảo do các đơn đã hoàn tiền. Các payment ở trạng thái `FAILED` hoặc `PENDING` bị loại bỏ hoàn toàn. Thời điểm ghi nhận dựa trên `paidAt` (thời điểm dòng tiền phát sinh), không dùng `createdAt`.

### Quyết định 2: Định nghĩa Lấp đầy sân (Occupancy) bao gồm cả trạng thái `COMPLETED`
- **Bối cảnh:** Module 4 định nghĩa "active booking" chỉ gồm `PENDING`, `CONFIRMED`, `CHECKED_IN` để phục vụ việc kiểm tra trùng lịch trong tương lai.
- **Giải pháp:** Khi lập báo cáo thống kê công suất sân (nhìn về quá khứ), trạng thái `COMPLETED` đại diện cho các slot sân đã được khách hàng sử dụng thực tế. Vì vậy, tập trạng thái tính lấp đầy là `{PENDING, CONFIRMED, CHECKED_IN, COMPLETED}`. Trạng thái `CANCELLED` luôn bị loại bỏ.
- **Mẫu số công suất:** Mẫu số = `Số sân AVAILABLE (hoặc 1 nếu chỉ định courtId) × Tổng số TimeSlot × Số ngày trong kỳ`. Trạng thái sân `MAINTENANCE` không được tính vào mẫu số (giới hạn đã biết: báo cáo theo trạng thái sân hiện tại, không phục dựng lịch sử bảo trì).

### Quyết định 3: Gom nhóm Thời gian (Bucketing DAY/WEEK/MONTH) bằng Java thuần thay vì SQL
- **Bối cảnh:** Cú pháp xử lý ngày tuần (`WEEK()`, `DATE_FORMAT()`, `DATE_TRUNC()`) có sự khác biệt lớn giữa MySQL trong môi trường production và H2 Database trong môi trường kiểm thử unit/integration.
- **Giải pháp:** Repository chỉ thực thi tổng hợp dữ liệu theo từng ngày (`DATE(p.paidAt)` hoặc `CAST(p.paidAt AS LocalDate)`). Tầng Service (`ReportServiceImpl`) sử dụng các tiện ích chuẩn của Java Date-Time API (`LocalDate`, `YearMonth`, `TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)`) để gom bucket.
- **Lý do:**
  1. Đảm bảo tính khả chuyển 100% giữa MySQL và H2.
  2. Dễ dàng kiểm thử độc lập (unit test) logic gom nhóm và xử lý tuần/tháng với Mockito.
  3. Tự động sinh đầy đủ các bucket rỗng (giá trị = 0) cho những khoảng thời gian không phát sinh giao dịch, giúp biểu đồ Frontend hiển thị liên tục không bị đứt đoạn.

### Quyết định 4: Sử dụng `ErrorCode.BAD_REQUEST` và Bảo vệ phép chia 0
- **Bối cảnh:** Người dùng có thể truyền tham số `from` sau `to`, hoặc kỳ dài hơn 366 ngày, hoặc hệ thống chưa cấu hình sân `AVAILABLE` / khung giờ nào.
- **Giải pháp:**
  - Tái sử dụng `ErrorCode.BAD_REQUEST` kèm thông điệp tiếng Việt cụ thể qua `AppException(ErrorCode.BAD_REQUEST, message)` (không tạo mã lỗi mới theo yêu cầu spec).
  - Phép tính tỉ lệ lấp đầy luôn được guard mẫu số = 0; nếu mẫu số = 0 thì tỉ lệ mặc định là `0.00` (không gây lỗi `ArithmeticException`). Tỉ lệ được làm tròn 2 chữ số thập phân bằng `RoundingMode.HALF_UP`.

---

## 3. Task List

### Phase 1: JPA Projections & Repository Extensions
- [x] **Task 1: Repository Query Methods & Aggregation Projections**
  - Tạo các Interface Projections cho Spring Data JPA: `DailyRevenueProjection`, `PaymentMethodRevenueProjection`, `DailyCourtOccupancyProjection`.
  - Bổ sung các query method tổng hợp vào `PaymentRepository`, `BookingRepository`, `CourtRepository`.
  - Tạo bộ test tích hợp `@DataJpaTest` trên H2 (`ReportRepositoryDataJpaTest`) kiểm tra query hoạt động chính xác.

### Checkpoint 1: Repository Queries Verified on H2
- [x] Tất cả các truy vấn JPQL mới biên dịch sạch và pass 100% trên H2 qua `@DataJpaTest`.

### Phase 2: DTOs & Core Service Implementation
- [x] **Task 2: DTOs, Enums & Request Validations**
  - Tạo enum `ReportGroupBy` (`DAY`, `WEEK`, `MONTH`).
  - Tạo DTO request `ReportRangeRequest` (hỗ trợ `from`, `to`, `groupBy`, `courtId`).
  - Tạo DTO response: `RevenueReportResponse`, `OccupancyReportResponse` và các record con (`RevenueTotalsResponse`, `PaymentMethodBreakdownResponse`, `RevenuePeriodBucketResponse`, `CourtOccupancyResponse`, `DailyOccupancyResponse`).
- [x] **Task 3: ReportService & ReportServiceImpl (Bucketing & Aggregation Logic)**
  - Xây dựng interface `ReportService`.
  - Triển khai `ReportServiceImpl` (`@Transactional(readOnly = true)`):
    - Xử lý giá trị mặc định cho `from`/`to` (30 ngày gần nhất, `to` = hôm nay).
    - Guard `from > to` và kỳ > 366 ngày (ném `AppException(ErrorCode.BAD_REQUEST, ...)`).
    - Thuật toán bucketing Java thuần cho `DAY`, `WEEK` (Thứ Hai), `MONTH` (`yyyy-MM`).
    - Tính toán `netRevenue`, `overallRate`, `dailyRate` kèm guard chia 0.

### Checkpoint 2: Core Business Logic & Bucketing Verified
- [x] Toàn bộ logic gom bucket, tính toán tỉ lệ và xử lý ngoại lệ biên dịch thành công.

### Phase 3: REST Controller & Security Authorization
- [x] **Task 4: ReportController & Security Authorization**
  - Xây dựng `ReportController` (`@RestController`, `@RequestMapping("/api/v1/reports")`, `@Tag(name = "Reports")`).
  - Endpoint `GET /api/v1/reports/revenue`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`.
  - Endpoint `GET /api/v1/reports/occupancy`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`.
  - Swagger documentation với `@Operation`, `@SecurityRequirement(name = "BearerAuth")`.

### Checkpoint 3: Endpoints & Security Ready
- [x] API routes được bảo vệ chặt chẽ, biên dịch sạch không lỗi.

### Phase 4: Comprehensive Testing
- [x] **Task 5: Comprehensive Unit & Security Integration Tests**
  - Unit tests với Mockito (`ReportServiceTest`): kiểm thử đủ kịch bản `DAY`, `WEEK`, `MONTH`, bucket rỗng, netRevenue, guard ngày tháng, court không tồn tại, mẫu số 0.
  - Controller Security tests (`ReportControllerTest`): kiểm thử 401 khi không token, 403 khi là CUSTOMER/STAFF, 200 khi là ADMIN.

### Checkpoint 4: 100% Tests Pass & No Regressions
- [x] `./mvnw.cmd clean test` vượt qua 100% test suites (cả Module 1-7 và Module 8).

### Phase 5: Documentation Synchronization & Review
- [x] **Task 6: Documentation Synchronization & Open Code Review**
  - Soạn tài liệu API [`docs/api/module-8-reports.md`](../docs/api/module-8-reports.md).
  - Soạn tài liệu kiến trúc [`docs/architecture/modules/module-8-reports.md`](../docs/architecture/modules/module-8-reports.md).
  - Cập nhật [`docs/architecture/README.md`](../docs/architecture/README.md) và rà soát [`docs/architecture/rbac-matrix.md`](../docs/architecture/rbac-matrix.md).
  - Đánh giá mã nguồn qua công cụ OCR.

---

## 4. Risks & Mitigations
| Nguy cơ (Risk) | Mức độ | Biện pháp xử lý (Mitigation) |
| :--- | :---: | :--- |
| **Không tương thích JPQL DATE function giữa MySQL & H2** | Trung bình | Sử dụng `CAST(p.paidAt AS LocalDate)` hoặc hàm trích xuất ngày chuẩn của JPA/Hibernate 6, kiểm chứng ngay bằng `@DataJpaTest` trên H2. |
| **Lỗi chia cho 0 khi tính occupancy rate** | Cao | Kiểm tra trước mẫu số: nếu `totalSlots == 0` lập tức gán `occupancyRate = BigDecimal.ZERO.setScale(2)`. |
| **Thiếu ngày/tuần/tháng trong biểu đồ Frontend** | Trung bình | Tầng Service sinh dải thời gian liên tục từ `from` đến `to`, điền các bucket rỗng với giá trị 0 thay vì chỉ trả về những ngày có dữ liệu từ DB. |
| **Truy vấn khoảng thời gian quá dài gây quá tải DB** | Thấp | Giới hạn tối đa 366 ngày, chặn ngay tại guard đầu vào trả mã 400. |
| **Lệch múi giờ khi lưu và tính toán** | Thấp | Hệ thống dùng `LocalDateTime` không timezone; tính toán dựa trên ngày giờ của server và ghi chú rõ ràng trong tài liệu. |

---

## 5. Definition of Done (Hoàn tất Module 8)
- [ ] 2 endpoints `GET /api/v1/reports/revenue` và `GET /api/v1/reports/occupancy` chạy chính xác theo đặc tả.
- [ ] 100% test suites pass (bao gồm tests mới của Module 8 và tất cả tests cũ của Module 1-7).
- [ ] Không có cảnh báo MapStruct, không hard-code chuỗi `"ADMIN"`.
- [ ] Tài liệu API, Architecture và RBAC Matrix được đồng bộ đầy đủ.
