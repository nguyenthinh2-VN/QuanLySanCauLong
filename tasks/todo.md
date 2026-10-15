# Tasks Checklist: Module 3 - Courts, TimeSlots & Pricing

## Task 1: Foundation - Error Codes, SecurityConfig & Sort Whitelist Validator
**Description:** Bổ sung các mã lỗi nghiệp vụ mới của Module 3 vào `ErrorCode.java`, cấu hình mở quyền truy cập công khai (permitAll) cho các endpoint GET của Module 3 trong `SecurityConfig.java`, và xây dựng tiện ích `SortUtils` để kiểm tra whitelist các trường sắp xếp nhằm chặn lỗi 500 khi client gửi sort không hợp lệ.

**Acceptance criteria:**
- [x] `ErrorCode.java` được bổ sung các mã lỗi mới: `COMPLEX_NOT_FOUND`, `COURT_NOT_FOUND`, `TIMESLOT_NOT_FOUND`, `COMPLEX_HAS_COURTS`, `DUPLICATE_COURT_NAME`, `DUPLICATE_COMPLEX_NAME`, `INVALID_TIME_RANGE`, `OVERLAPPING_TIME_SLOT`, `INVALID_SORT_FIELD`.
- [x] `SecurityConfig.java` cho phép truy cập công khai không cần token (`permitAll`) cho các request: `GET /api/v1/complexes/**`, `GET /api/v1/courts/**`, `GET /api/v1/time-slots/**`.
- [x] `SortUtils` kiểm tra whitelist cho tham số sort; nếu property không thuộc whitelist thì ném `AppException(ErrorCode.INVALID_SORT_FIELD)` trả về HTTP 400.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/security/SecurityConfig.java`
- `src/main/java/com/badminton/shared/util/SortUtils.java`

**Estimated scope:** Medium: 3 files

---

## Task 2: CourtComplex Subsystem (Entities, Repositories, DTOs, Mapper, Service, Controller)
**Description:** Xây dựng đầy đủ resource Cụm sân (`CourtComplex`) với 5 REST API endpoints: danh sách cụm sân (phân trang, tìm kiếm `q`, lọc `status`, sort whitelist), chi tiết cụm sân kèm danh sách sân con tóm tắt, tạo cụm sân (ADMIN, 201), cập nhật cụm sân (ADMIN), và xóa cụm sân (ADMIN, Guard: còn sân con -> 400 `COMPLEX_HAS_COURTS`).

**Acceptance criteria:**
- [x] Tạo `ComplexStatus` enum (`ACTIVE`, `INACTIVE`) và Entity `CourtComplex` (tên unique, `@NotBlank`, max 150 ký tự).
- [x] `CourtComplexRepository` kế thừa `JpaRepository` và `JpaSpecificationExecutor`.
- [x] Tạo đầy đủ các DTO: `CreateComplexRequest`, `UpdateComplexRequest`, `ComplexResponse`, `ComplexDetailResponse`, `CourtSummaryResponse`.
- [x] Tạo `CourtComplexMapper` MapStruct mapping chuẩn xác giữa Entity và DTOs.
- [x] `CourtComplexServiceImpl` triển khai đầy đủ logic phân trang tìm kiếm và Guard chặn xóa khi còn sân con.
- [x] `CourtComplexController` cung cấp 5 endpoints (`/api/v1/complexes`), cấu hình `@PreAuthorize` bằng SpEL `RoleConstants.ADMIN` cho POST/PUT/DELETE, gán tag `@Tag(name = "Courts")`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/court/entity/ComplexStatus.java`
- `src/main/java/com/badminton/modules/court/entity/CourtComplex.java`
- `src/main/java/com/badminton/modules/court/repository/CourtComplexRepository.java`
- `src/main/java/com/badminton/modules/court/dto/request/CreateComplexRequest.java`
- `src/main/java/com/badminton/modules/court/dto/request/UpdateComplexRequest.java`
- `src/main/java/com/badminton/modules/court/dto/response/ComplexResponse.java`
- `src/main/java/com/badminton/modules/court/dto/response/ComplexDetailResponse.java`
- `src/main/java/com/badminton/modules/court/dto/response/CourtSummaryResponse.java`
- `src/main/java/com/badminton/modules/court/mapper/CourtComplexMapper.java`
- `src/main/java/com/badminton/modules/court/service/CourtComplexService.java`
- `src/main/java/com/badminton/modules/court/service/impl/CourtComplexServiceImpl.java`
- `src/main/java/com/badminton/modules/court/CourtComplexController.java`

**Estimated scope:** Large: 12 files

---

## Checkpoint 1: Foundation & CourtComplex Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Các thành phần CourtComplex biên dịch trơn tru, không có lỗi ánh xạ MapStruct.

---

## Task 3: Court Subsystem (Entity, Repository, DTOs, Mapper, Service, Controller)
**Description:** Xây dựng resource Sân con (`Court`) với 5 REST API endpoints: danh sách sân con (phân trang, lọc `complexId`, `status`, tìm kiếm `q`, sort whitelist), chi tiết sân con, tạo sân con (ADMIN, 201, Guard: cụm sân phải tồn tại, trùng tên trong cùng cụm -> 409), cập nhật sân con (ADMIN, Guard: trùng tên trong cùng cụm), và xóa sân con (ADMIN).

**Acceptance criteria:**
- [x] Tạo `CourtStatus` enum (`AVAILABLE`, `MAINTENANCE`) và Entity `Court` gắn quan hệ `@ManyToOne` với `CourtComplex` (join column `complex_id`, non-null), có ràng buộc unique composite `(complex_id, name)`.
- [x] `CourtRepository` hỗ trợ Specification và các phương thức kiểm tra trùng tên theo cụm: `existsByComplexIdAndName`, `existsByComplexIdAndNameAndIdNot`, `countByComplexId`.
- [x] Tạo đầy đủ các DTO: `CreateCourtRequest`, `UpdateCourtRequest`, `CourtResponse`.
- [x] Tạo `CourtMapper` MapStruct ánh xạ Entity sang `CourtResponse` (bao gồm `complexId` và `complexName`).
- [x] `CourtServiceImpl` kiểm tra complexId hợp lệ và bảo đảm Guard chống trùng tên sân trong cùng cụm (ném `DUPLICATE_COURT_NAME` - 409).
- [x] `CourtController` cung cấp 5 endpoints (`/api/v1/courts`), bảo vệ POST/PUT/DELETE bằng `@PreAuthorize` SpEL `RoleConstants.ADMIN`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 2

**Files likely touched:**
- `src/main/java/com/badminton/modules/court/entity/CourtStatus.java`
- `src/main/java/com/badminton/modules/court/entity/Court.java`
- `src/main/java/com/badminton/modules/court/repository/CourtRepository.java`
- `src/main/java/com/badminton/modules/court/dto/request/CreateCourtRequest.java`
- `src/main/java/com/badminton/modules/court/dto/request/UpdateCourtRequest.java`
- `src/main/java/com/badminton/modules/court/dto/response/CourtResponse.java`
- `src/main/java/com/badminton/modules/court/mapper/CourtMapper.java`
- `src/main/java/com/badminton/modules/court/service/CourtService.java`
- `src/main/java/com/badminton/modules/court/service/impl/CourtServiceImpl.java`
- `src/main/java/com/badminton/modules/court/CourtController.java`

**Estimated scope:** Large: 10 files

---

## Task 4: TimeSlot & Pricing Subsystem (Entity, Repository, DTOs, Mapper, Service, Controller)
**Description:** Xây dựng resource Khung giờ & Bảng giá (`TimeSlot`) với 3 REST API endpoints: danh sách khung giờ (Public, sắp xếp theo `startTime` tăng dần), tạo khung giờ (ADMIN, 201), cập nhật khung giờ (ADMIN). Tuyệt đối không cung cấp endpoint xóa để bảo toàn lịch sử.

**Acceptance criteria:**
- [x] Tạo Entity `TimeSlot` gồm các trường `name`, `startTime`, `endTime`, `pricePerHour`.
- [x] `TimeSlotRepository` có query kiểm tra đè khung giờ (`existsOverlappingSlot` và `existsOverlappingSlotExcludingId`) dựa trên logic `startTime < existingEndTime AND endTime > existingStartTime`.
- [x] Tạo các DTO: `CreateTimeSlotRequest`, `UpdateTimeSlotRequest`, `TimeSlotResponse` có bean validation (`@NotNull`, `@NotBlank`, `@DecimalMin("0")`).
- [x] Tạo `TimeSlotMapper` MapStruct chuyển đổi giữa Entity và DTO.
- [x] `TimeSlotServiceImpl` thực thi 3 Guards:
  1. `startTime < endTime` (sai -> 400 `INVALID_TIME_RANGE`).
  2. Khung giờ không bị đè/trùng với khung giờ khác trong hệ thống (sai -> 409 `OVERLAPPING_TIME_SLOT`).
  3. Giá thuê mỗi giờ `pricePerHour >= 0` (sai -> 400).
- [x] `TimeSlotController` cung cấp 3 endpoints (`/api/v1/time-slots`), gán tag `@Tag(name = "Time Slots")`, bảo vệ POST/PUT bằng `@PreAuthorize` SpEL `RoleConstants.ADMIN`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/court/entity/TimeSlot.java`
- `src/main/java/com/badminton/modules/court/repository/TimeSlotRepository.java`
- `src/main/java/com/badminton/modules/court/dto/request/CreateTimeSlotRequest.java`
- `src/main/java/com/badminton/modules/court/dto/request/UpdateTimeSlotRequest.java`
- `src/main/java/com/badminton/modules/court/dto/response/TimeSlotResponse.java`
- `src/main/java/com/badminton/modules/court/mapper/TimeSlotMapper.java`
- `src/main/java/com/badminton/modules/court/service/TimeSlotService.java`
- `src/main/java/com/badminton/modules/court/service/impl/TimeSlotServiceImpl.java`
- `src/main/java/com/badminton/modules/court/TimeSlotController.java`

**Estimated scope:** Large: 9 files

---

## Checkpoint 2: All 13 Module 3 Endpoints Implemented
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Tất cả 13 endpoints và các guards nghiệp vụ đã hoàn thành.

---

## Task 5: Data Seeder & Comprehensive Unit/Integration Tests
**Description:** Cập nhật `DataSeeder.java` để tự động tạo dữ liệu mẫu cho cụm sân, sân con và các khung giờ chuẩn. Viết các test suite kiểm thử chặt chẽ toàn bộ các guards nghiệp vụ và quyền hạn bảo mật.

**Acceptance criteria:**
- [x] `DataSeeder.java` khởi tạo ít nhất 2 Cụm sân, mỗi cụm 3-4 Sân con, 4 Khung giờ chuẩn (06:00-09:00, 09:00-14:00, 14:00-17:00, 17:00-22:00) nếu database chưa có dữ liệu.
- [x] Bộ test bao quát các kịch bản bắt buộc trong checklist tự kiểm tra:
  - [x] GET public không token -> 200 OK.
  - [x] POST/PUT/DELETE không token -> 401; token STAFF/CUSTOMER -> 403; token ADMIN -> thành công.
  - [x] Tạo 2 sân trùng tên trong cùng cụm -> 409 `DUPLICATE_COURT_NAME`; trùng tên ở 2 cụm khác nhau -> 201 Created.
  - [x] DELETE cụm sân khi vẫn còn sân con -> 400 `COMPLEX_HAS_COURTS`.
  - [x] Tạo khung giờ `startTime >= endTime` -> 400 `INVALID_TIME_RANGE`; overlap khung giờ đã có -> 409 `OVERLAPPING_TIME_SLOT`; giá âm -> 400.
  - [x] GET với tham số `sort` không thuộc whitelist -> 400 `INVALID_SORT_FIELD` (không bị lỗi 500).
- [x] Tất cả các test trong toàn dự án pass 100%: `.\mvnw.cmd clean test`.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Tasks 2, 3, 4

**Files likely touched:**
- `src/main/java/com/badminton/config/DataSeeder.java`
- `src/test/java/com/badminton/modules/court/CourtComplexServiceTest.java`
- `src/test/java/com/badminton/modules/court/CourtServiceTest.java`
- `src/test/java/com/badminton/modules/court/TimeSlotServiceTest.java`

**Estimated scope:** Medium: 4 files

---

## Task 6: Project Documentation Synchronization
**Description:** Biên soạn tài liệu chi tiết cho Module 3 và cập nhật các tài liệu kiến trúc hiện hữu theo đúng chuẩn format của Module 1 và Module 2.

**Acceptance criteria:**
- [x] Tạo `docs/api/module-3-courts.md`: Đầy đủ request/response JSON mẫu cho cả 13 endpoints, kèm theo các ví dụ lỗi thực tế (400, 401, 403, 404, 409).
- [x] Tạo `docs/architecture/modules/module-3-courts.md`: Mô tả bài toán giải quyết, cấu trúc mã nguồn, và bảng phân tích áp dụng đầy đủ 5 nguyên tắc SOLID.
- [x] Cập nhật `docs/architecture/architecture-and-rbac.md`: Chuyển trạng thái Module 2 và Module 3 thành đã hoàn thành với liên kết tương ứng, đồng thời đảm bảo sơ đồ cây thư mục phản ánh đúng mô hình Package-by-Feature.
- [x] Cập nhật `docs/architecture/rbac-matrix.md`: Sửa đổi mục III Sân bãi khớp với cấu trúc tách biệt `/api/v1/complexes` và `/api/v1/courts`, bổ sung quyền public cho khách xem sân và xem khung giờ.

**Verification:**
- [x] Manual review: Các link liên kết trong markdown đều trỏ chính xác, không có link hỏng.

**Dependencies:** Task 5

**Files likely touched:**
- `docs/api/module-3-courts.md`
- `docs/architecture/modules/module-3-courts.md`
- `docs/architecture/architecture-and-rbac.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 markdown files

---

## Checkpoint 3: Module 3 Ready for Review & Handover
- [x] Tất cả 13 endpoints hoạt động đúng đặc tả 100%.
- [x] Toàn bộ checklist tự kiểm tra đều pass.
- [x] Build & Test thành công: `.\mvnw.cmd clean test`.
- [x] Tài liệu đồng bộ hoàn chỉnh.
