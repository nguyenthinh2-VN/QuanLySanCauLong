# Tasks Checklist: Module 8 - Dashboard & Revenue Reporting

## Task 1: Repository Query Methods & Aggregation Projections
**Description:** Bổ sung các interface projection và các query JPQL tổng hợp báo cáo vào các Repository hiện có (`PaymentRepository`, `BookingRepository`, `CourtRepository`), sau đó viết kiểm thử `@DataJpaTest` chạy trên H2 database thật để xác minh các câu query JPQL hoạt động chính xác cả trên H2 và MySQL.

**Acceptance criteria:**
- [x] Tạo các interface projections trong `com.badminton.modules.report.repository.projection`:
  - `DailyRevenueProjection`: `LocalDate getReportDate()`, `PaymentStatus getStatus()`, `BigDecimal getTotalAmount()`, `Long getTransactionCount()`.
  - `PaymentMethodRevenueProjection`: `PaymentMethod getPaymentMethod()`, `BigDecimal getTotalAmount()`, `Long getTransactionCount()`.
  - `DailyCourtOccupancyProjection`: `LocalDate getBookingDate()`, `Long getCourtId()`, `Long getBookedCount()`.
- [x] Bổ sung query vào `PaymentRepository`:
  - Query 1: Doanh thu theo ngày nhóm theo trạng thái (SUCCESS, REFUNDED) giữa `paidAt` từ `:fromStart` đến `:toEnd`.
  - Query 2: Breakdown doanh thu theo `paymentMethod` với các thanh toán `SUCCESS` giữa `:fromStart` và `:toEnd`.
- [x] Bổ sung query vào `BookingRepository`:
  - Query 1: Tổng số slot đã đặt theo ngày và sân trong khoảng `:from` đến `:to` với các trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`.
  - Query 2: Tương tự query 1 nhưng lọc thêm theo `:courtId`.
- [x] Bổ sung method vào `CourtRepository`:
  - `long countByStatus(CourtStatus status);`
  - `List<Court> findByStatus(CourtStatus status);`
- [x] Viết test `@DataJpaTest` (`ReportRepositoryDataJpaTest`) trên H2 kiểm thử:
  - Query revenue lấy đúng cả SUCCESS và REFUNDED, bỏ qua FAILED/PENDING.
  - Query breakdown lấy đúng theo PaymentMethod.
  - Query occupancy tính đúng các booking PENDING, CONFIRMED, CHECKED_IN, COMPLETED và loại bỏ CANCELLED.
  - `countByStatus` đếm đúng sân AVAILABLE.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd test -Dtest=ReportRepositoryDataJpaTest`
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/modules/report/repository/projection/DailyRevenueProjection.java`
- `src/main/java/com/badminton/modules/report/repository/projection/PaymentMethodRevenueProjection.java`
- `src/main/java/com/badminton/modules/report/repository/projection/DailyCourtOccupancyProjection.java`
- `src/main/java/com/badminton/modules/payment/repository/PaymentRepository.java`
- `src/main/java/com/badminton/modules/booking/repository/BookingRepository.java`
- `src/main/java/com/badminton/modules/court/repository/CourtRepository.java`
- `src/test/java/com/badminton/modules/report/ReportRepositoryDataJpaTest.java`

**Estimated scope:** Medium: 7 files

---

## Checkpoint 1: Repository Queries & Projections Verified
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Tests pass: `.\mvnw.cmd test -Dtest=ReportRepositoryDataJpaTest`
- [x] Các truy vấn JPQL chạy thành công trên H2 database thật không lỗi cú pháp.

---

## Task 2: DTOs, Enums & Request Validations
**Description:** Tạo enum gom nhóm thời gian `ReportGroupBy`, DTO nhận tham số truy vấn `ReportRangeRequest`, và các DTO/record phản hồi kết quả báo cáo doanh thu (`RevenueReportResponse`) và lấp đầy sân (`OccupancyReportResponse`) cùng các record lồng nhau.

**Acceptance criteria:**
- [x] Tạo enum `ReportGroupBy` trong `com.badminton.modules.report.dto.request`: `DAY`, `WEEK`, `MONTH`.
- [x] Tạo DTO `ReportRangeRequest` trong `com.badminton.modules.report.dto.request`:
  - `from` (`LocalDate`, định dạng `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`).
  - `to` (`LocalDate`, định dạng `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`).
  - `groupBy` (`ReportGroupBy`, mặc định `ReportGroupBy.DAY`).
  - `courtId` (`Long`, optional).
- [x] Tạo DTO responses trong `com.badminton.modules.report.dto.response`:
  - `RevenueTotalsResponse`: `grossRevenue`, `refundedAmount`, `netRevenue`, `transactionCount`.
  - `PaymentMethodBreakdownResponse`: `paymentMethod`, `grossRevenue`, `transactionCount`.
  - `RevenuePeriodBucketResponse`: `period`, `grossRevenue`, `refundedAmount`, `netRevenue`, `transactionCount`.
  - `RevenueReportResponse`: `from`, `to`, `groupBy`, `totals`, `byPaymentMethod`, `timeline`.
  - `CourtOccupancyResponse`: `courtId`, `courtName`, `bookedSlots`, `totalSlots`, `occupancyRate`.
  - `DailyOccupancyResponse`: `date`, `bookedSlots`, `totalSlots`, `occupancyRate`.
  - `OccupancyReportResponse`: `from`, `to`, `overallRate`, `bookedSlots`, `totalSlots`, `byCourt`, `daily`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/modules/report/dto/request/ReportGroupBy.java`
- `src/main/java/com/badminton/modules/report/dto/request/ReportRangeRequest.java`
- `src/main/java/com/badminton/modules/report/dto/response/RevenueTotalsResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/PaymentMethodBreakdownResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/RevenuePeriodBucketResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/RevenueReportResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/CourtOccupancyResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/DailyOccupancyResponse.java`
- `src/main/java/com/badminton/modules/report/dto/response/OccupancyReportResponse.java`

**Estimated scope:** Medium: 9 files

---

## Task 3: ReportService & ReportServiceImpl (Bucketing & Aggregation Logic)
**Description:** Xây dựng interface `ReportService` và cài đặt `ReportServiceImpl` với đầy đủ các nghiệp vụ tính toán báo cáo: chuẩn hóa khoảng ngày mặc định, các guard kiểm tra ngày tháng, thuật toán gom bucket Java thuần theo Ngày/Tuần/Tháng (tuần bắt đầu từ Thứ Hai), tính doanh thu thuần và tỉ lệ lấp đầy có bảo vệ chia cho 0.

**Acceptance criteria:**
- [x] Tạo interface `ReportService`:
  - `RevenueReportResponse getRevenueReport(ReportRangeRequest request);`
  - `OccupancyReportResponse getOccupancyReport(ReportRangeRequest request);`
- [x] Triển khai `ReportServiceImpl` (`@Service`, `@Transactional(readOnly = true)`, `@RequiredArgsConstructor`):
  - Chuẩn hóa khoảng ngày: nếu `to` null -> `LocalDate.now()`; nếu `from` null -> `to.minusDays(29)`.
  - Guards:
    - Nếu `from.isAfter(to)`: ném `AppException(ErrorCode.BAD_REQUEST, "Ngày bắt đầu không được sau ngày kết thúc")`.
    - Nếu khoảng cách ngày `ChronoUnit.DAYS.between(from, to) + 1 > 366`: ném `AppException(ErrorCode.BAD_REQUEST, "Khoảng thời gian báo cáo không được vượt quá 366 ngày")`.
  - Xử lý Báo cáo Doanh thu:
    - Gọi query `PaymentRepository` lấy aggregation theo ngày và theo payment method.
    - Gom nhóm bucket theo `groupBy`:
      - `DAY`: Mỗi ngày 1 bucket (`period = yyyy-MM-dd`).
      - `WEEK`: Gom theo tuần Thứ Hai–Chủ Nhật (`period = yyyy-MM-dd` của ngày Thứ Hai).
      - `MONTH`: Gom theo tháng (`period = yyyy-MM`).
    - Dải bucket được sinh đầy đủ từ `from` đến `to` (ngày/tuần/tháng không có phát sinh giao dịch thì các giá trị = 0, đảm bảo biểu đồ liền mạch).
    - `netRevenue = grossRevenue - refundedAmount`.
    - Tính tổng hợp toàn kỳ `totals` và danh sách `byPaymentMethod`.
  - Xử lý Báo cáo Lấp đầy sân:
    - Nếu có `courtId`: kiểm tra court tồn tại qua `courtRepository.findById(courtId)`, nếu không tìm thấy ném `AppException(ErrorCode.COURT_NOT_FOUND)`.
    - Mẫu số: `(số sân AVAILABLE hoặc 1 nếu có courtId) × số TimeSlot × số ngày trong kỳ`.
    - Bảo vệ chia 0: nếu mẫu số = 0 -> `overallRate = 0.00`, `daily.occupancyRate = 0.00`.
    - Tính tỉ lệ phần trăm làm tròn 2 chữ số thập phân (`RoundingMode.HALF_UP`).
    - Sinh danh sách `daily` đủ mọi ngày trong kỳ (ngày không có booking thì `bookedSlots = 0`, `occupancyRate = 0.00`).
    - Xây dựng danh sách `byCourt` cho các sân (hoặc sân được chọn).

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `src/main/java/com/badminton/modules/report/service/ReportService.java`
- `src/main/java/com/badminton/modules/report/service/impl/ReportServiceImpl.java`

**Estimated scope:** Small: 2 files

---

## Checkpoint 2: Core Business Logic Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Toàn bộ logic gom bucket, tính toán tỉ lệ và các guard được cài đặt đầy đủ.

---

## Task 4: REST Controller & Security Authorization
**Description:** Xây dựng `ReportController` phục vụ 2 endpoints báo cáo, gắn annotation OpenAPI Swagger, bọc kết quả trả về trong `ApiResponse<T>`, và áp dụng phân quyền ADMIN-only bằng `RoleConstants` thông qua SpEL `@PreAuthorize`.

**Acceptance criteria:**
- [x] Tạo `ReportController` trong `com.badminton.modules.report.controller`:
  - `@RestController`, `@RequestMapping("/api/v1/reports")`.
  - `@Tag(name = "Reports", description = "APIs Thống kê & Báo cáo Quản trị (Admin Dashboard)")`.
  - `@SecurityRequirement(name = "BearerAuth")`.
- [x] Endpoint 1: `GET /api/v1/reports/revenue`
  - `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`.
  - `@Operation(summary = "Báo cáo doanh thu theo kỳ", description = "Thống kê doanh thu gộp, hoàn tiền, doanh thu thuần và phân rã theo ngày/tuần/tháng")`.
  - Nhận tham số qua `@ModelAttribute @Valid ReportRangeRequest request`.
  - Trả về `ApiResponse<RevenueReportResponse>`.
- [x] Endpoint 2: `GET /api/v1/reports/occupancy`
  - `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`.
  - `@Operation(summary = "Báo cáo tỉ lệ lấp đầy sân", description = "Thống kê công suất sử dụng sân theo kỳ, chi tiết theo sân và theo ngày")`.
  - Nhận tham số qua `@ModelAttribute @Valid ReportRangeRequest request`.
  - Trả về `ApiResponse<OccupancyReportResponse>`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 3

**Files likely touched:**
- `src/main/java/com/badminton/modules/report/controller/ReportController.java`

**Estimated scope:** Small: 1 file

---

## Checkpoint 3: Endpoints & Security Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Cả 2 endpoints đã được đăng ký và bảo vệ bằng SpEL an toàn kiểu.

---

## Task 5: Comprehensive Unit & Security Integration Tests
**Description:** Viết bộ kiểm thử toàn diện bao gồm Mockito unit tests cho `ReportServiceImpl` (kiểm tra đầy đủ các logic gom nhóm, ngày mặc định, bucket rỗng, guard lỗi, bảo vệ chia 0) và WebMvcTest / SpringBootTest cho `ReportController` (kiểm tra phân quyền: không token -> 401, CUSTOMER/STAFF -> 403, ADMIN -> 200).

**Acceptance criteria:**
- [x] Tạo `ReportServiceTest` (`src/test/java/com/badminton/modules/report/ReportServiceTest.java`):
  - Test `getRevenueReport_defaultDates`: Mặc định 30 ngày kết thúc vào hôm nay.
  - Test `getRevenueReport_groupByDay`: Sinh đủ tất cả các ngày, bucket rỗng có giá trị 0, `netRevenue = gross - refunded`.
  - Test `getRevenueReport_groupByWeek`: Label tuần là ngày Thứ Hai (`yyyy-MM-dd`), tổng hợp đúng các giao dịch trong tuần.
  - Test `getRevenueReport_groupByMonth`: Label tháng là `yyyy-MM`, tổng hợp đúng các giao dịch trong tháng.
  - Test `getRevenueReport_invalidDates_fromAfterTo`: Ném 400 `ErrorCode.BAD_REQUEST`.
  - Test `getRevenueReport_invalidDates_exceed366Days`: Ném 400 `ErrorCode.BAD_REQUEST`.
  - Test `getOccupancyReport_allCourts`: Tính toán đúng tổng slot, slot đã đặt, tỉ lệ lấp đầy; tính cả COMPLETED, bỏ qua CANCELLED.
  - Test `getOccupancyReport_singleCourt`: Lọc đúng theo sân chỉ định.
  - Test `getOccupancyReport_courtNotFound`: Ném 404 `ErrorCode.COURT_NOT_FOUND`.
  - Test `getOccupancyReport_zeroAvailableCourts_noDivisionByZero`: Khi không có sân khả dụng hoặc không có time slot, tỉ lệ trả về 0.00 không phát sinh lỗi chia cho 0.
- [x] Tạo `ReportControllerSecurityTest` (`src/test/java/com/badminton/modules/report/ReportControllerSecurityTest.java`):
  - Không truyền Bearer token -> 401 Unauthorized.
  - Đăng nhập với vai trò `CUSTOMER` -> 403 Forbidden.
  - Đăng nhập với vai trò `STAFF` -> 403 Forbidden.
  - Đăng nhập với vai trò `ADMIN` -> 200 OK.
- [x] Toàn bộ kiểm thử hệ thống từ Module 1 đến Module 8 pass 100%.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd test`
- [x] Build succeeds: `.\mvnw.cmd clean compile`

**Dependencies:** Task 4

**Files likely touched:**
- `src/test/java/com/badminton/modules/report/ReportServiceTest.java`
- `src/test/java/com/badminton/modules/report/ReportControllerSecurityTest.java`

**Estimated scope:** Medium: 2 files

---

## Checkpoint 4: 100% Tests Pass & Zero Regression
- [x] Tests pass: `.\mvnw.cmd test`
- [x] Toàn bộ 131+ tests của hệ thống đều pass xanh (153/153 tests pass).

---

## Task 6: Documentation Synchronization & Review
**Description:** Cập nhật tài liệu API chi tiết (`docs/api/module-8-reports.md`), tài liệu kiến trúc chuyên sâu (`docs/architecture/modules/module-8-reports.md`), cập nhật `docs/architecture/README.md`, rà soát `docs/architecture/rbac-matrix.md`, và thực hiện review mã nguồn.

**Acceptance criteria:**
- [x] Tạo `docs/api/module-8-reports.md`: Chi tiết 2 endpoints, mô tả query params, các mẫu JSON response đầy đủ, danh sách mã lỗi (400, 401, 403, 404).
- [x] Tạo `docs/architecture/modules/module-8-reports.md`: Kiến trúc Module 8, giải thích 3 quyết định thiết kế cốt lõi (Net revenue vs refunded, Occupancy tính COMPLETED vs Availability, Bucketing Java vs SQL), bảng tuân thủ SOLID.
- [x] Cập nhật `docs/architecture/README.md`: Đọc từng dòng, đánh dấu Module 8 đã hoàn thành kèm link, rà soát tránh drift vị trí file.
- [x] Cập nhật `docs/architecture/rbac-matrix.md`: Rà soát dòng 28-29 mục VI, đảm bảo khớp cấu hình SpEL.

**Verification:**
- [x] Manual review: Toàn bộ markdown links hoạt động chính xác.
- [x] Clean build: `.\mvnw.cmd clean compile` pass không warning.

**Dependencies:** Task 5

**Files likely touched:**
- `docs/api/module-8-reports.md`
- `docs/architecture/modules/module-8-reports.md`
- `docs/architecture/README.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 files

---

## Checkpoint 5: Module 8 Complete & Ready to Ship
- [x] Hoàn thành trọn vẹn backend Module 8 và toàn bộ dự án QuanLySanCauLong.
- [x] Toàn bộ checklist tự kiểm tra đều pass.
