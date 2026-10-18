# Tasks Checklist: Module 5 - Court Operations (POS, Check-in & Recurring Bookings)

## Task 1: Domain Model Evolution, Error Codes & DTOs
**Description:** Mở rộng entity `Booking` để hỗ trợ khách vãng lai (nới lỏng `user` thành nullable, bổ sung `guestName` và `guestPhone`), bổ sung 4 mã lỗi mới vào `ErrorCode.java`, nâng cấp `AppException` và `GlobalExceptionHandler` hỗ trợ trả về dữ liệu lỗi chi tiết (`conflictedDates`), cập nhật `BookingResponse`, `BookingMapper`, và tạo mới các DTO request/response phục vụ 3 API mới.

**Acceptance criteria:**
- [x] `ErrorCode.java` bổ sung: `INVALID_POS_REQUEST` (400), `CHECK_IN_NOT_ALLOWED` (409), `RECURRING_SLOT_CONFLICT` (409), `RECURRING_HORIZON_EXCEEDED` (400).
- [x] `AppException.java` và `GlobalExceptionHandler.java` hỗ trợ truyền kèm payload lỗi `data` (ví dụ danh sách `conflictedDates`).
- [x] `Booking.java`: `@ManyToOne @JoinColumn(name = "user_id", nullable = true)` và thêm 2 trường `@Column(name = "guest_name", length = 100) String guestName;` và `@Column(name = "guest_phone", length = 20) String guestPhone;`.
- [x] `BookingResponse.java` & `BookingMapper.java` ánh xạ thêm `guestName`, `guestPhone`.
- [x] Tạo các DTOs: `CreatePosBookingRequest`, `CreateRecurringBookingRequest`, `RecurringBookingResponse`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/shared/exception/AppException.java`
- `src/main/java/com/badminton/shared/exception/GlobalExceptionHandler.java`
- `src/main/java/com/badminton/modules/booking/entity/Booking.java`
- `src/main/java/com/badminton/modules/booking/dto/response/BookingResponse.java`
- `src/main/java/com/badminton/modules/booking/mapper/BookingMapper.java`
- `src/main/java/com/badminton/modules/booking/dto/request/CreatePosBookingRequest.java`
- `src/main/java/com/badminton/modules/booking/dto/request/CreateRecurringBookingRequest.java`
- `src/main/java/com/badminton/modules/booking/dto/response/RecurringBookingResponse.java`

**Estimated scope:** Medium: 9 files

---

## Checkpoint 1: Domain Models & DTOs Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] MapStruct và Entity biên dịch sạch sẽ, không có lỗi ánh xạ.

---

## Task 2: Service Operations & REST Controller Endpoints
**Description:** Triển khai 3 phương thức nghiệp vụ mới trong `BookingService`/`BookingServiceImpl` (`createPosBooking`, `checkInBooking`, `createRecurringBooking`) kèm đầy đủ guards, khóa bi quan chống double-booking, tính toán snapshot giá, và cung cấp 3 REST API endpoints tương ứng trong `BookingController`.

**Acceptance criteria:**
- [x] `createPosBooking`: Kiểm tra XOR `userId` vs (`guestName` + `guestPhone`). Khóa hàng sân bằng `findByIdForUpdate`. Slot trống $\rightarrow$ tạo booking trạng thái `CONFIRMED`.
- [x] `checkInBooking`: Kiểm tra status ∈ {PENDING, CONFIRMED}, `bookingDate == hôm nay`, `now < slot.endTime`. Thành công $\rightarrow$ chuyển trạng thái sang `CHECKED_IN`.
- [x] `createRecurringBooking`: Xác thực `weeks ∈ [1, 12]`, sinh chuỗi $N$ ngày theo `dayOfWeek`, kiểm tra ngày cuối $\le$ hôm nay + 90 ngày. Khóa bi quan sân con 1 lần. Kiểm tra toàn bộ $N$ slot; nếu có bất kỳ ngày nào trùng $\rightarrow$ rollback và ném 409 `RECURRING_SLOT_CONFLICT` kèm `conflictedDates`. Nếu thành công $\rightarrow$ tạo $N$ đơn `PENDING` và trả về `RecurringBookingResponse`.
- [x] `BookingController` bổ sung 3 endpoints:
  - `POST /api/v1/bookings/pos`: `@PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")` (201 Created).
  - `POST /api/v1/bookings/{id}/check-in`: `@PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")` (200 OK).
  - `POST /api/v1/bookings/recurring`: `@PreAuthorize("isAuthenticated()")` (201 Created).
- [x] Swagger OpenAPI `@Operation` và `@SecurityRequirement(name = "BearerAuth")` đầy đủ.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/booking/service/BookingService.java`
- `src/main/java/com/badminton/modules/booking/service/impl/BookingServiceImpl.java`
- `src/main/java/com/badminton/modules/booking/BookingController.java`

**Estimated scope:** Small: 3 files

---

## Checkpoint 2: All 3 Module 5 Endpoints Implemented
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Tất cả 3 endpoints biên dịch trơn tru, logic guards và phân quyền SpEL sẵn sàng.

---

## Task 3: Comprehensive Testing (Unit Mockito & Concurrency Tests)
**Description:** Xây dựng bộ test toàn diện cho Module 5 bao phủ toàn bộ các guards của POS, Check-in và Recurring, đồng thời viết integration test kiểm chứng concurrency giữa đặt tại quầy (POS) và đặt online trên cùng 1 slot.

**Acceptance criteria:**
- [x] Test Mockito cho `createPosBooking`:
  - Khách vãng lai (`guestName`/`guestPhone`) $\rightarrow$ tạo thành công, status `CONFIRMED`.
  - Thành viên (`userId`) $\rightarrow$ tạo thành công, link đúng user.
  - Thiếu cả hai hoặc gửi cả hai $\rightarrow$ ném `INVALID_POS_REQUEST` (400).
- [x] Test Mockito cho `checkInBooking`:
  - Đơn PENDING hoặc CONFIRMED hôm nay $\rightarrow$ thành công, status `CHECKED_IN`.
  - Đơn hôm qua $\rightarrow$ ném `CHECK_IN_NOT_ALLOWED` (409).
  - Đơn đã `CHECKED_IN` rồi check-in lại $\rightarrow$ ném `CHECK_IN_NOT_ALLOWED` (409).
  - Đơn đã quá giờ `endTime` $\rightarrow$ ném `CHECK_IN_NOT_ALLOWED` (409).
- [x] Test Mockito cho `createRecurringBooking`:
  - Đặt thành công 4 tuần $\rightarrow$ tạo đúng 4 booking PENDING cách nhau 7 ngày.
  - 1 ngày trong chuỗi bị trùng slot $\rightarrow$ ném `RECURRING_SLOT_CONFLICT` (409), danh sách `conflictedDates` chứa đúng ngày bị trùng, không booking nào được lưu (All-or-Nothing).
  - `weeks` ngoài [1, 12] hoặc vượt 90 ngày $\rightarrow$ ném lỗi 400.
- [x] Test Concurrency: 2 threads (1 gọi POS, 1 gọi Online booking) cùng đặt 1 slot $\rightarrow$ đúng 1 bên thành công, bên còn lại nhận 409.
- [x] Toàn bộ test suites trong toàn dự án pass 100%: `.\mvnw.cmd clean test`.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Task 2

**Files likely touched:**
- `src/test/java/com/badminton/modules/booking/BookingServiceTest.java`
- `src/test/java/com/badminton/modules/booking/BookingConcurrencyTest.java`

**Estimated scope:** Medium: 2 files

---

## Task 4: Documentation Synchronization
**Description:** Soạn thảo tài liệu API chi tiết cho Module 5, tài liệu phân tích kiến trúc Module 5, và cập nhật tài liệu tổng quan hệ thống theo quy ước của repository.

**Acceptance criteria:**
- [x] Tạo `docs/api/module-5-bookings-pos.md`: Mẫu request/response đầy đủ cho cả 3 endpoints và các case lỗi (400, 401, 403, 404, 409).
- [x] Tạo `docs/architecture/modules/module-5-bookings-pos.md`: Mô tả kiến trúc Module 5, bảng SOLID, giải thích chi tiết:
  1. Vì sao `user` nullable + `guestName`/`guestPhone` cho khách vãng lai.
  2. Vì sao POS $\rightarrow$ `CONFIRMED` còn Online $\rightarrow$ `PENDING`.
  3. Vì sao Recurring áp dụng cơ chế All-or-Nothing.
- [x] Cập nhật `docs/architecture/README.md`: Đánh dấu Module 5 hoàn thành và liên kết tới tài liệu kiến trúc tương ứng.
- [x] Rà soát `docs/architecture/rbac-matrix.md` (mục IV: dòng 19, 20, 22).

**Verification:**
- [x] Manual review: Kiểm tra toàn bộ markdown links hoạt động chính xác.

**Dependencies:** Task 3

**Files likely touched:**
- `docs/api/module-5-bookings-pos.md`
- `docs/architecture/modules/module-5-bookings-pos.md`
- `docs/architecture/README.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 files

---

## Checkpoint 3: Module 5 Complete, Verified & Documented
- [x] Cả 3 endpoints hoạt động đúng 100% đặc tả.
- [x] Tất cả các tiêu chí trong checklist tự kiểm tra đều pass.
- [x] `.\mvnw.cmd clean compile` và `.\mvnw.cmd clean test` pass 100%.
- [x] Hệ thống tài liệu API & Kiến trúc đồng bộ hoàn chỉnh.
