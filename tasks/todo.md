# Tasks Checklist: Module 4 - Bookings & Concurrency Control

## Task 1: Foundation - H2 Test Dependency, Error Codes, SecurityConfig & Pessimistic Lock
**Description:** Bổ sung dependency H2 database vào `pom.xml` (scope test) để phục vụ `@DataJpaTest`, mở rộng `ErrorCode.java` với 6 mã lỗi mới của Module 4, cấu hình `permitAll` cho endpoint tra cứu lịch trống trong `SecurityConfig.java`, và bổ sung query khóa bi quan (`LockModeType.PESSIMISTIC_WRITE`) vào `CourtRepository`.

**Acceptance criteria:**
- [x] `pom.xml` có dependency `com.h2database:h2` với `<scope>test</scope>`.
- [x] `ErrorCode.java` bổ sung 6 mã lỗi: `BOOKING_NOT_FOUND`, `SLOT_ALREADY_BOOKED`, `COURT_NOT_AVAILABLE`, `INVALID_BOOKING_DATE`, `BOOKING_NOT_CANCELLABLE`, `BOOKING_NOT_RESCHEDULABLE` với message tiếng Việt chuẩn xác.
- [x] `CourtRepository.java` có method `Optional<Court> findByIdForUpdate(@Param("id") Long id)` gán `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
- [x] `SecurityConfig.java` cho phép truy cập công khai không cần token (`permitAll`) cho `HttpMethod.GET, "/api/v1/bookings/availability"`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `pom.xml`
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/modules/court/repository/CourtRepository.java`
- `src/main/java/com/badminton/security/SecurityConfig.java`

**Estimated scope:** Small: 4 files

---

## Task 2: Domain Entity, Enums, DTOs, Mapper & Repository
**Description:** Xây dựng domain model cho Đơn đặt sân (`Booking`), các Enum trạng thái đơn và trạng thái slot hiển thị, các DTOs request/response có đầy đủ bean validation, MapStruct mapper, và `BookingRepository` chứa các truy vấn kiểm tra trùng lặp slot và tìm kiếm lịch sử.

**Acceptance criteria:**
- [x] Tạo enum `BookingStatus` (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`) và `SlotStatus` (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`).
- [x] Tạo entity `Booking` kế thừa `BaseEntity` (table `bookings`), liên kết `@ManyToOne` với `User`, `Court`, `TimeSlot`, snapshot `totalAmount` (`BigDecimal`), `bookingDate` (`LocalDate`), `status`, `note`.
- [x] Tạo DTOs: `CreateBookingRequest`, `UpdateBookingRequest`, `BookingResponse`, `CourtAvailabilityResponse`, `SlotAvailabilityResponse`.
- [x] Tạo `BookingMapper` (MapStruct với `disableBuilder = true` để tương thích `BaseEntity`).
- [x] Tạo `BookingRepository` kế thừa `JpaRepository` và `JpaSpecificationExecutor`, chứa các method kiểm tra trùng slot `existsActiveBooking` và `existsActiveBookingExcludingId` trên các status `{PENDING, CONFIRMED, CHECKED_IN}`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/booking/entity/BookingStatus.java`
- `src/main/java/com/badminton/modules/booking/entity/SlotStatus.java`
- `src/main/java/com/badminton/modules/booking/entity/Booking.java`
- `src/main/java/com/badminton/modules/booking/repository/BookingRepository.java`
- `src/main/java/com/badminton/modules/booking/dto/request/CreateBookingRequest.java`
- `src/main/java/com/badminton/modules/booking/dto/request/UpdateBookingRequest.java`
- `src/main/java/com/badminton/modules/booking/dto/response/BookingResponse.java`
- `src/main/java/com/badminton/modules/booking/dto/response/CourtAvailabilityResponse.java`
- `src/main/java/com/badminton/modules/booking/dto/response/SlotAvailabilityResponse.java`
- `src/main/java/com/badminton/modules/booking/mapper/BookingMapper.java`

**Estimated scope:** Large: 10 files

---

## Checkpoint 1: Foundation & Domain Models Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Entity, DTO, Mapper, Repository biên dịch hoàn chỉnh không có cảnh báo.

---

## Task 3: Security Component & Core Booking Service Operations
**Description:** Xây dựng component `BookingSecurity` phục vụ SpEL `@bookingSecurity.isOwner(#id)` và triển khai các nghiệp vụ đặt sân trực tuyến, xem lịch sử đặt chỗ cá nhân, đổi lịch và hủy đặt sân với Pessimistic Write Lock và tính toán snapshot `totalAmount`.

**Acceptance criteria:**
- [x] Tạo `@Component("bookingSecurity") BookingSecurity` kiểm tra `isOwner(Long bookingId)`. Nếu booking không tồn tại hoặc user không phải chủ sở hữu -> trả về `false` (Spring Security chặn 403 Forbidden).
- [x] Tạo `BookingService` và `BookingServiceImpl`:
  - `createBooking`: Khóa hàng sân bằng `courtRepository.findByIdForUpdate`, kiểm tra ngày hợp lệ `[hôm nay, hôm nay + 30 ngày]`, kiểm tra sân bảo trì, kiểm tra giờ bắt đầu slot nếu là hôm nay, kiểm tra trùng lặp `existsActiveBooking`, tính toán server-side `totalAmount = pricePerHour * hours`, lưu đơn với trạng thái `PENDING`.
  - `getMyBookings`: Truy vấn lịch sử đặt chỗ của chính user hiện tại (`SecurityUtils.getCurrentUserId()`), hỗ trợ lọc `status`, `fromDate`, `toDate`, phân trang và sort qua whitelist `SortUtils.parseSort(sort, "createdAt", Set.of("bookingDate", "createdAt", "totalAmount"))`.
  - `updateBooking`: Kiểm tra trạng thái đơn phải thuộc `{PENDING, CONFIRMED}`, thời điểm hiện tại < giờ bắt đầu của slot cũ. Nếu đổi sân/ngày/slot thì khóa bi quan sân mới, kiểm tra slot mới còn trống bằng `existsActiveBookingExcludingId`, tính lại `totalAmount`.
  - `cancelBooking`: Kiểm tra trạng thái đơn thuộc `{PENDING, CONFIRMED}`, thời điểm hiện tại < giờ bắt đầu slot cũ; thực hiện Soft-Cancel chuyển trạng thái sang `CANCELLED`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 2

**Files likely touched:**
- `src/main/java/com/badminton/modules/booking/security/BookingSecurity.java`
- `src/main/java/com/badminton/modules/booking/service/BookingService.java`
- `src/main/java/com/badminton/modules/booking/service/impl/BookingServiceImpl.java`

**Estimated scope:** Medium: 3 files

---

## Task 4: Availability Query Algorithm & REST Controller
**Description:** Triển khai thuật toán tính ma trận slot trống theo ngày cho từng sân và xây dựng `BookingController` cung cấp 5 REST API endpoints với phân quyền method-level chuẩn xác và tài liệu Swagger OpenAPI `@Tag(name = "Bookings")`.

**Acceptance criteria:**
- [x] `getAvailability(LocalDate date, Long courtId, Long complexId)` trong `BookingService`:
  - Guards kiểm tra `date`: `null` -> 400; `date < hôm nay` -> 400; `date > hôm nay + 30 ngày` -> 400.
  - Thuật toán tính `slotStatus`:
    - Sân `MAINTENANCE` -> `UNAVAILABLE`.
    - `date == hôm nay` và `LocalTime.now() > slot.endTime` -> `PASSED`.
    - Tồn tại booking `PENDING`, `CONFIRMED`, `CHECKED_IN` -> `BOOKED`.
    - Còn lại -> `FREE`.
  - Sắp xếp các slot theo `startTime` tăng dần.
- [x] Tạo `BookingController` với 5 endpoints:
  - `GET /api/v1/bookings/availability`: Public (permitAll), không `@SecurityRequirement`.
  - `POST /api/v1/bookings`: `@PreAuthorize("isAuthenticated()")`, trả về 201 Created.
  - `GET /api/v1/bookings/my`: `@PreAuthorize("isAuthenticated()")`, trả về PageResponse.
  - `PUT /api/v1/bookings/{id}`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN) or @bookingSecurity.isOwner(#id)")`.
  - `DELETE /api/v1/bookings/{id}`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN) or @bookingSecurity.isOwner(#id)")`.
- [x] OpenAPI `@Tag(name = "Bookings")` và `@Operation` đầy đủ cho từng endpoint.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 3

**Files likely touched:**
- `src/main/java/com/badminton/modules/booking/BookingController.java`
- `src/main/java/com/badminton/modules/booking/service/impl/BookingServiceImpl.java`

**Estimated scope:** Small: 2 files

---

## Checkpoint 2: All 5 Module 4 Endpoints Implemented
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Đầy đủ 5 endpoints, các guards nghiệp vụ và phân quyền hoạt động nhất quán.

---

## Task 5: Comprehensive Testing (Unit Test Mockito, DataJpaTest H2, Concurrency Test)
**Description:** Xây dựng bộ test toàn diện cho Module 4: `@DataJpaTest` trên H2 thật cho query kiểm tra trùng slot, Mockito unit test cho `BookingService` bao phủ 100% các guards nghiệp vụ, và integration test đa luồng (`BookingConcurrencyTest`) mô phỏng 2 threads đồng thời đặt cùng 1 slot để kiểm chứng đúng 1 thread thành công (201) và thread còn lại nhận 409 `SLOT_ALREADY_BOOKED`.

**Acceptance criteria:**
- [x] `BookingRepositoryDataJpaTest` chạy trên H2 thật, kiểm chứng query `existsActiveBooking` trả về `true` với các trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN` và trả về `false` với `CANCELLED`.
- [x] `BookingConcurrencyTest` tạo 2 luồng đồng thời gọi đặt cùng 1 slot qua service, kiểm chứng chính xác 1 luồng thành công và 1 luồng ném lỗi `AppException(ErrorCode.SLOT_ALREADY_BOOKED)`.
- [x] `BookingServiceTest` sử dụng Mockito kiểm thử đầy đủ các kịch bản:
  - Đặt sân thành công, tính đúng `totalAmount`.
  - Đặt sân ngày quá khứ / quá 30 ngày -> ném `INVALID_BOOKING_DATE`.
  - Đặt sân đang bảo trì -> ném `COURT_NOT_AVAILABLE`.
  - Lấy lịch sử đặt sân của user A chỉ thấy đơn của user A.
  - Hủy đơn khi quá giờ bắt đầu hoặc trạng thái không hợp lệ -> ném `BOOKING_NOT_CANCELLABLE`.
  - Đổi lịch thành công và tính lại `totalAmount`.
- [x] Tất cả các test suites trong toàn dự án pass 100%: `.\mvnw.cmd clean test` (66/66 tests PASS).

**Verification:**
- [x] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Task 4

**Files likely touched:**
- `src/test/java/com/badminton/modules/booking/BookingRepositoryDataJpaTest.java`
- `src/test/java/com/badminton/modules/booking/BookingConcurrencyTest.java`
- `src/test/java/com/badminton/modules/booking/BookingServiceTest.java`

**Estimated scope:** Medium: 3 files

---

## Task 6: Documentation Synchronization
**Description:** Cập nhật và biên soạn toàn bộ tài liệu kiến trúc, API và RBAC theo đúng quy ước của dự án.

**Acceptance criteria:**
- [x] Tạo `docs/api/module-4-bookings.md`: Mô tả chi tiết request/response JSON mẫu cho cả 5 endpoints, kèm theo tất cả các case lỗi (400, 401, 403, 404, 409).
- [x] Tạo `docs/architecture/modules/module-4-bookings.md`: Mô tả kiến trúc Module 4, bảng áp dụng SOLID, giải thích chi tiết:
  1. Vì sao đơn vị đặt là khung giờ chuẩn.
  2. Vì sao dùng Pessimistic Lock thay vì Unique Constraint ở database.
  3. Vì sao snapshot giá tiền (`totalAmount`) vào đơn đặt sân.
- [x] Cập nhật `docs/architecture/README.md`:
  - Dòng Module 2 -> Hoàn thành + link `modules/module-2-user-management.md`.
  - Dòng Module 3 -> Hoàn thành + link `modules/module-3-courts.md`.
  - Dòng Module 4 -> Hoàn thành + link `modules/module-4-bookings.md`.
  - Rà soát toàn bộ file, chuẩn hóa các mô tả package-by-layer cũ sang package-by-feature thực tế (`com.badminton.modules.*`, `com.badminton.shared.*`, `com.badminton.security.*`).
- [x] Cập nhật `docs/architecture/rbac-matrix.md`: Bổ sung 1 dòng `GET /api/v1/bookings/my` (đã đăng nhập, chỉ xem của chính mình) vào mục IV Đặt sân mà không làm đổi quyền các dòng 16-21.

**Verification:**
- [x] Manual review: Kiểm tra toàn bộ đường dẫn link markdown hoạt động chính xác.

**Dependencies:** Task 5

**Files likely touched:**
- `docs/api/module-4-bookings.md`
- `docs/architecture/modules/module-4-bookings.md`
- `docs/architecture/README.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 files

---

## Checkpoint 3: Module 4 Complete, Verified & Documented
- [x] Tất cả 5 endpoints hoạt động đúng đặc tả 100%.
- [x] Toàn bộ checklist tự kiểm tra đều pass.
- [x] Build & Test thành công: `.\mvnw.cmd clean test`.
- [x] Tài liệu API, Kiến trúc & Ma trận RBAC đồng bộ hoàn chỉnh.
