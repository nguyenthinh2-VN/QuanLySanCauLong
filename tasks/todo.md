# Tasks Checklist: Module 7 - Promotions & Voucher Management

## Task 1: Error Codes, Domain Entities, Enums, Repositories & Discount Strategy Pattern
**Description:** Bổ sung 9 mã lỗi voucher vào `ErrorCode.java`, xây dựng enum `DiscountType`, tạo các entity `Voucher` và `VoucherUsage` kế thừa `BaseEntity`, tạo interface `DiscountStrategy` cùng 2 implementation `PercentageDiscountStrategy` và `FixedAmountDiscountStrategy` kèm `DiscountStrategyFactory`, và tạo các Spring Data JPA repositories tương ứng.

**Acceptance criteria:**
- [ ] `ErrorCode.java` bổ sung: `VOUCHER_NOT_FOUND` (404), `VOUCHER_CODE_EXISTS` (409), `VOUCHER_NOT_ACTIVE` (400), `VOUCHER_EXPIRED` (400), `VOUCHER_NOT_STARTED` (400), `VOUCHER_USAGE_EXCEEDED` (400), `VOUCHER_USER_LIMIT_EXCEEDED` (400), `VOUCHER_MIN_AMOUNT_NOT_MET` (400), `VOUCHER_ALREADY_APPLIED` (409).
- [ ] Tạo enum `DiscountType` trong `com.badminton.modules.voucher.entity`: `PERCENTAGE`, `FIXED_AMOUNT`.
- [ ] Tạo entity `Voucher` trong `com.badminton.modules.voucher.entity`:
  - Table name `vouchers`, extends `BaseEntity`.
  - Các trường: `code` (String, unique, uppercase, not null), `name` (String, not null), `description` (String), `discountType` (@Enumerated STRING, not null), `discountValue` (BigDecimal precision 12 scale 2, not null), `maxDiscountAmount` (BigDecimal precision 12 scale 2, nullable), `minOrderAmount` (BigDecimal precision 12 scale 2, nullable), `usageLimit` (Integer, nullable), `usedCount` (int default 0), `userUsageLimit` (int default 1), `startDate` (LocalDateTime, not null), `endDate` (LocalDateTime, not null), `active` (boolean default true).
  - Indexes: `@Index(name = "idx_vouchers_code", columnList = "code")`, `@Index(name = "idx_vouchers_active_dates", columnList = "active, start_date, end_date")`.
- [ ] Tạo entity `VoucherUsage` trong `com.badminton.modules.voucher.entity`:
  - Table name `voucher_usages`, extends `BaseEntity`.
  - Các trường: `voucher` (@ManyToOne @JoinColumn nullable=false), `user` (@ManyToOne @JoinColumn nullable=true), `booking` (@ManyToOne @JoinColumn nullable=false), `discountAmount` (BigDecimal precision 12 scale 2, not null), `orderAmount` (BigDecimal precision 12 scale 2, not null), `usedAt` (LocalDateTime, not null).
  - Indexes: `@Index(name = "idx_voucher_usages_user", columnList = "voucher_id, user_id")`, `@Index(name = "idx_voucher_usages_booking", columnList = "booking_id")`.
- [ ] Tạo package `com.badminton.modules.voucher.strategy`:
  - Interface `DiscountStrategy`: `DiscountType getDiscountType(); BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount);`.
  - Class `PercentageDiscountStrategy` (@Component): tính `orderAmount * (discountValue / 100)`, nếu có `maxDiscountAmount` thì lấy `min(discount, maxDiscountAmount)`, không vượt quá `orderAmount`.
  - Class `FixedAmountDiscountStrategy` (@Component): tính `min(discountValue, orderAmount)`.
  - Class `DiscountStrategyFactory` (@Component): map hoặc list tự động inject và cung cấp strategy tương ứng với `DiscountType`.
- [ ] Tạo repositories:
  - `VoucherRepository`: `Optional<Voucher> findByCode(String code)`, `boolean existsByCode(String code)`, `@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("SELECT v FROM Voucher v WHERE v.id = :id") Optional<Voucher> findByIdForUpdate(@Param("id") Long id)`.
  - `VoucherUsageRepository`: `long countByVoucherIdAndUserId(Long voucherId, Long userId)`, `boolean existsByBookingId(Long bookingId)`, `Optional<VoucherUsage> findByBookingId(Long bookingId)`.

**Verification:**
- [ ] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/modules/voucher/entity/DiscountType.java`
- `src/main/java/com/badminton/modules/voucher/entity/Voucher.java`
- `src/main/java/com/badminton/modules/voucher/entity/VoucherUsage.java`
- `src/main/java/com/badminton/modules/voucher/strategy/DiscountStrategy.java`
- `src/main/java/com/badminton/modules/voucher/strategy/PercentageDiscountStrategy.java`
- `src/main/java/com/badminton/modules/voucher/strategy/FixedAmountDiscountStrategy.java`
- `src/main/java/com/badminton/modules/voucher/strategy/DiscountStrategyFactory.java`
- `src/main/java/com/badminton/modules/voucher/repository/VoucherRepository.java`
- `src/main/java/com/badminton/modules/voucher/repository/VoucherUsageRepository.java`

**Estimated scope:** Large: 10 files

---

## Checkpoint 1: Domain, Enums, Strategy & Repositories Ready
- [ ] Build succeeds: `.\mvnw.cmd compile`
- [ ] Entity, strategy và repository biên dịch thành công, không có lỗi cú pháp.

---

## Task 2: Admin Voucher Management (DTOs, Mapper, Service & REST Controller)
**Description:** Xây dựng toàn bộ các API quản trị voucher dành cho ADMIN bao gồm tạo mới, cập nhật, bật/tắt kích hoạt, xóa voucher và xem danh sách phân trang có tìm kiếm, lọc theo trạng thái.

**Acceptance criteria:**
- [ ] Tạo các DTOs quản trị trong `com.badminton.modules.voucher.dto`:
  - `CreateVoucherRequest`: `code` (@NotBlank uppercase alphanumeric), `name` (@NotBlank), `description`, `discountType` (@NotNull), `discountValue` (@NotNull @DecimalMin("0.01")), `maxDiscountAmount`, `minOrderAmount`, `usageLimit`, `userUsageLimit`, `startDate` (@NotNull), `endDate` (@NotNull), `active`.
  - `UpdateVoucherRequest`: `name`, `description`, `maxDiscountAmount`, `minOrderAmount`, `usageLimit`, `userUsageLimit`, `endDate`, `active`.
  - `VoucherResponse`: Chứa đầy đủ thông tin voucher để hiển thị ở frontend.
- [ ] Tạo `VoucherMapper` (MapStruct) chuyển đổi giữa `Voucher` và `VoucherResponse`.
- [ ] Tạo `VoucherAdminService` và `VoucherAdminServiceImpl` (@Transactional):
  - `createVoucher`: Validate trùng code (409 `VOUCHER_CODE_EXISTS`), validate `endDate.isAfter(startDate)` (400), normalize uppercase code, lưu vào DB.
  - `getVouchers(String keyword, Boolean active, Pageable pageable)`: Trả về `PageResponse<VoucherResponse>`.
  - `getVoucherById(Long id)`: Tìm theo ID (404 `VOUCHER_NOT_FOUND`).
  - `updateVoucher(Long id, UpdateVoucherRequest request)`: Cập nhật thông tin voucher, validate ngày kết thúc hợp lệ.
  - `toggleVoucherStatus(Long id)`: Đảo ngược trạng thái `active`.
  - `deleteVoucher(Long id)`: Xóa cứng nếu `usedCount == 0`, nếu đã có lượt dùng thì tự động chuyển sang `active = false`.
- [ ] Tạo `VoucherAdminController` tại `/api/v1/vouchers`:
  - `POST /api/v1/vouchers`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 201 Created.
  - `GET /api/v1/vouchers`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 200 OK.
  - `GET /api/v1/vouchers/{id}`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 200 OK.
  - `PUT /api/v1/vouchers/{id}`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 200 OK.
  - `PATCH /api/v1/vouchers/{id}/status`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 200 OK.
  - `DELETE /api/v1/vouchers/{id}`: `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ 200 OK.
  - Swagger annotations đầy đủ `@Tag(name = "Admin Vouchers")`.

**Verification:**
- [ ] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/voucher/dto/request/CreateVoucherRequest.java`
- `src/main/java/com/badminton/modules/voucher/dto/request/UpdateVoucherRequest.java`
- `src/main/java/com/badminton/modules/voucher/dto/response/VoucherResponse.java`
- `src/main/java/com/badminton/modules/voucher/mapper/VoucherMapper.java`
- `src/main/java/com/badminton/modules/voucher/service/VoucherAdminService.java`
- `src/main/java/com/badminton/modules/voucher/service/impl/VoucherAdminServiceImpl.java`
- `src/main/java/com/badminton/modules/voucher/VoucherAdminController.java`

**Estimated scope:** Medium: 7 files

---

## Task 3: Customer Voucher Application & Public Active Vouchers
**Description:** Xây dựng endpoint công khai xem danh sách voucher đang active và endpoint khách hàng áp mã giảm giá vào đơn đặt sân đang ở trạng thái PENDING với khóa bi quan và 7 chốt chặn bảo vệ an toàn.

**Acceptance criteria:**
- [ ] Tạo DTOs khách hàng:
  - `ApplyVoucherRequest`: `bookingId` (@NotNull), `code` (@NotBlank).
  - `ApplyVoucherResponse`: `bookingId`, `voucherCode`, `voucherName`, `discountType`, `originalAmount`, `discountAmount`, `finalAmount`.
- [ ] Tạo `VoucherService` và `VoucherServiceImpl` (@Transactional):
  - `getActiveVouchers(Pageable pageable)`: Tìm các voucher có `active = true`, `startDate <= now` và `endDate >= now`.
  - `applyVoucher(ApplyVoucherRequest request)`:
    - Tìm voucher theo `code` (404 `VOUCHER_NOT_FOUND`).
    - Khóa bi quan voucher: `voucherRepository.findByIdForUpdate(voucher.getId())`.
    - Tìm `booking` theo `bookingId` (404 `BOOKING_NOT_FOUND`).
    - Guard 1: `booking.status == PENDING` (409 `BOOKING_NOT_PAYABLE`).
    - Guard 2: Người gọi phải là chủ booking (`booking.user.id == currentUserId`) hoặc `STAFF`/`ADMIN` (403 `ACCESS_DENIED`).
    - Guard 3: Booking chưa áp dụng voucher nào trước đó (`!voucherUsageRepository.existsByBookingId(bookingId)`) (409 `VOUCHER_ALREADY_APPLIED`).
    - Guard 4: Voucher `active == true`, `startDate <= now`, `endDate >= now` (400 `VOUCHER_NOT_ACTIVE` / `VOUCHER_EXPIRED` / `VOUCHER_NOT_STARTED`).
    - Guard 5: `booking.totalAmount >= minOrderAmount` nếu `minOrderAmount != null` (400 `VOUCHER_MIN_AMOUNT_NOT_MET`).
    - Guard 6: `usageLimit == null || voucher.usedCount < voucher.usageLimit` (400 `VOUCHER_USAGE_EXCEEDED`).
    - Guard 7: Nếu có user account: `voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), user.getId()) < voucher.userUsageLimit` (400 `VOUCHER_USER_LIMIT_EXCEEDED`).
    - Tính toán chiết khấu: Gọi `discountStrategyFactory.getStrategy(voucher.getDiscountType()).calculateDiscount(voucher, booking.getTotalAmount())`.
    - `finalAmount = booking.totalAmount.subtract(discountAmount).max(BigDecimal.ZERO)`.
    - Cập nhật `booking.setTotalAmount(finalAmount)`.
    - Lưu bản ghi `VoucherUsage` ghi nhận giao dịch.
    - Tăng `voucher.setUsedCount(voucher.getUsedCount() + 1)`.
    - Lưu `booking`, `voucher`, `voucherUsage` vào DB trong cùng transaction.
- [ ] Tạo `VoucherController`:
  - `GET /api/v1/vouchers/active`: `permitAll` $\rightarrow$ 200 OK.
  - `POST /api/v1/vouchers/apply`: `@PreAuthorize("isAuthenticated()")` $\rightarrow$ 200 OK.
  - Swagger annotations đầy đủ `@Tag(name = "Customer Vouchers")`.

**Verification:**
- [ ] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `src/main/java/com/badminton/modules/voucher/dto/request/ApplyVoucherRequest.java`
- `src/main/java/com/badminton/modules/voucher/dto/response/ApplyVoucherResponse.java`
- `src/main/java/com/badminton/modules/voucher/service/VoucherService.java`
- `src/main/java/com/badminton/modules/voucher/service/impl/VoucherServiceImpl.java`
- `src/main/java/com/badminton/modules/voucher/VoucherController.java`

**Estimated scope:** Medium: 5 files

---

## Checkpoint 2: All Module 7 Endpoints Implemented
- [ ] Build succeeds: `.\mvnw.cmd compile`
- [ ] Cả 8 endpoints (6 Admin + 2 Customer) và toàn bộ business guards biên dịch trơn tru.

---

## Task 3: Comprehensive Testing (Unit Mockito & DataJpaTest)
**Description:** Xây dựng bộ test toàn diện cho Module 7 gồm unit tests cho toàn bộ kịch bản CRUD Admin và kịch bản áp dụng voucher của khách hàng, cùng integration test `@DataJpaTest` trên H2 database thật để xác thực các truy vấn và khóa bi quan.

**Acceptance criteria:**
- [ ] Unit test `VoucherAdminServiceTest`:
  - Tạo voucher thành công với PERCENTAGE và FIXED_AMOUNT (201).
  - Tạo voucher trùng code $\rightarrow$ 409 `VOUCHER_CODE_EXISTS`.
  - Tạo voucher startDate >= endDate $\rightarrow$ 400.
  - Cập nhật voucher thành công (200).
  - Bật/tắt trạng thái voucher (200).
  - Xóa voucher thành công khi chưa ai dùng (200).
- [ ] Unit test `VoucherServiceTest`:
  - Áp voucher PERCENTAGE thành công (giảm đúng %, trần maxDiscountAmount) $\rightarrow$ 200.
  - Áp voucher FIXED_AMOUNT thành công (trừ đúng số tiền) $\rightarrow$ 200.
  - Khách áp voucher cho booking người khác $\rightarrow$ 403 `ACCESS_DENIED`.
  - Áp voucher khi booking đã CONFIRMED / CANCELLED $\rightarrow$ 409 `BOOKING_NOT_PAYABLE`.
  - Áp voucher không tồn tại $\rightarrow$ 404 `VOUCHER_NOT_FOUND`.
  - Áp voucher đã hết hạn hoặc chưa bắt đầu $\rightarrow$ 400 `VOUCHER_EXPIRED` / `VOUCHER_NOT_STARTED`.
  - Áp voucher khi đơn chưa đạt minOrderAmount $\rightarrow$ 400 `VOUCHER_MIN_AMOUNT_NOT_MET`.
  - Áp voucher khi đã hết lượt dùng toàn hệ thống $\rightarrow$ 400 `VOUCHER_USAGE_EXCEEDED`.
  - Áp voucher khi khách đã dùng hết lượt cá nhân $\rightarrow$ 400 `VOUCHER_USER_LIMIT_EXCEEDED`.
  - Áp voucher lần 2 cho cùng một booking $\rightarrow$ 409 `VOUCHER_ALREADY_APPLIED`.
- [ ] JPA Data test `VoucherRepositoryDataJpaTest` trên H2:
  - Khẳng định query `findByCode`, `existsByCode` hoạt động chuẩn.
  - Khẳng định query `countByVoucherIdAndUserId` đếm chính xác số lần user đã dùng mã.
  - Khẳng định khóa bi quan `findByIdForUpdate` hoạt động an toàn.
- [ ] Toàn bộ test suites của cả dự án pass 100%: `.\mvnw.cmd clean test`.

**Verification:**
- [ ] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `src/test/java/com/badminton/modules/voucher/VoucherAdminServiceTest.java`
- `src/test/java/com/badminton/modules/voucher/VoucherServiceTest.java`
- `src/test/java/com/badminton/modules/voucher/VoucherRepositoryDataJpaTest.java`

**Estimated scope:** Medium: 3 files

---

## Checkpoint 3: Tests Pass 100%
- [ ] Tests pass: `.\mvnw.cmd clean test`
- [ ] Toàn bộ test suites của Module 1 đến Module 7 pass xanh, không có lỗi hồi quy.

---

## Task 4: Documentation Synchronization & Review
**Description:** Soạn thảo tài liệu API chi tiết cho Module 7, tài liệu phân tích kiến trúc Module 7 (bảng SOLID, 4 quyết định thiết kế cốt lõi), cập nhật `docs/architecture/README.md`, rà soát `docs/architecture/rbac-matrix.md`, và thực hiện review qua `/open-code-review-delegate`.

**Acceptance criteria:**
- [ ] Tạo `docs/api/module-7-vouchers.md`: Chi tiết 8 endpoints (6 Admin + 2 Customer), mẫu request/response JSON và danh sách mã lỗi (400, 401, 403, 404, 409).
- [ ] Tạo `docs/architecture/modules/module-7-vouchers.md`: Mô tả kiến trúc Module 7, bảng SOLID, phân tích Strategy Pattern, Pessimistic Lock và giải thích chi tiết 4 quyết định thiết kế.
- [ ] Cập nhật `docs/architecture/README.md`: Đánh dấu Module 7 hoàn thành và gắn link tới tài liệu tương ứng.
- [ ] Rà soát `docs/architecture/rbac-matrix.md` (mục V, dòng 25–26).

**Verification:**
- [ ] Manual review: Toàn bộ markdown links hoạt động chính xác.
- [ ] Review bằng OCR: `ocr delegate rule` không có lỗi.

**Dependencies:** Task 3

**Files likely touched:**
- `docs/api/module-7-vouchers.md`
- `docs/architecture/modules/module-7-vouchers.md`
- `docs/architecture/README.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 files

---

## Checkpoint 4: Module 7 Complete, Verified & Documented
- [ ] Cả 8 endpoints hoạt động đúng 100% đặc tả.
- [ ] Tất cả các tiêu chí trong checklist tự kiểm tra đều pass.
- [ ] `.\mvnw.cmd clean compile` và `.\mvnw.cmd clean test` pass 100%.
- [ ] Hệ thống tài liệu API & Kiến trúc đồng bộ hoàn chỉnh.
