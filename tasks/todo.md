# Tasks Checklist: Module 6 - Payments & Refunds

## Task 1: Error Codes, Domain Entities, Enums & Mock Payment Gateway
**Description:** Bổ sung 4 mã lỗi thanh toán vào `ErrorCode.java`, xây dựng các enum nghiệp vụ thanh toán (`PaymentType`, `PaymentMethod`, `PaymentStatus`), tạo entity `Payment` kế thừa `BaseEntity` và liên kết với `Booking`, tạo interface `PaymentGateway`, record `ChargeResult` và implementation `MockPaymentGateway`.

**Acceptance criteria:**
- [x] `ErrorCode.java` bổ sung: `PAYMENT_NOT_FOUND` (404), `BOOKING_NOT_PAYABLE` (409), `BOOKING_ALREADY_PAID` (409), `REFUND_NOT_ALLOWED` (409).
- [x] Tạo enums trong package `com.badminton.modules.payment.entity`:
  - `PaymentType`: `FULL`, `DEPOSIT`.
  - `PaymentMethod`: `CASH`, `BANK_TRANSFER`, `E_WALLET`.
  - `PaymentStatus`: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`.
- [x] Tạo entity `Payment` trong `com.badminton.modules.payment.entity`:
  - Table name `payments`, extends `BaseEntity`.
  - Các trường: `booking` (@ManyToOne @JoinColumn nullable=false), `amount` (BigDecimal nullable=false precision=12 scale=2), `paymentType` (@Enumerated STRING), `paymentMethod` (@Enumerated STRING), `status` (@Enumerated STRING default PENDING), `transactionRef` (String unique nullable), `paidAt` (LocalDateTime nullable), `note` (String length 500).
- [x] Tạo package `com.badminton.modules.payment.gateway`:
  - Interface `PaymentGateway`: phương thức `ChargeResult charge(BigDecimal amount, String bookingRef)`.
  - Record `ChargeResult(boolean success, String transactionRef, String message)`.
  - Class `MockPaymentGateway` (@Component) implements `PaymentGateway`: `success = amount != null && amount.compareTo(BigDecimal.ZERO) > 0`, `transactionRef = "MOCK-" + UUID.randomUUID()`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/modules/payment/entity/PaymentType.java`
- `src/main/java/com/badminton/modules/payment/entity/PaymentMethod.java`
- `src/main/java/com/badminton/modules/payment/entity/PaymentStatus.java`
- `src/main/java/com/badminton/modules/payment/entity/Payment.java`
- `src/main/java/com/badminton/modules/payment/gateway/ChargeResult.java`
- `src/main/java/com/badminton/modules/payment/gateway/PaymentGateway.java`
- `src/main/java/com/badminton/modules/payment/gateway/MockPaymentGateway.java`

**Estimated scope:** Medium: 8 files

---

## Checkpoint 1: Domain, Enums & Gateway Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Các entity và gateway biên dịch thành công, không có lỗi cú pháp.

---

## Task 2: Repository, DTOs, Mapper, Service Layer & REST Controller
**Description:** Tạo `PaymentRepository` với query kiểm tra thanh toán thành công, tạo các DTOs và MapStruct mapper, hiện thực hóa nghiệp vụ thanh toán (tính amount server-side, gọi mock gateway, cập nhật booking sang CONFIRMED) và hoàn tiền (cập nhật payment REFUNDED, hủy booking CANCELLED), cung cấp 2 REST API endpoints tương ứng tại `PaymentController`.

**Acceptance criteria:**
- [x] `PaymentRepository` khai báo query `boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status)`.
- [x] Tạo các DTOs:
  - `CreatePaymentRequest`: `bookingId` (@NotNull), `paymentType` (@NotNull), `paymentMethod` (@NotNull), `note` (@Size max 500). Không có field `amount`!
  - `RefundPaymentRequest`: `reason` (@Size max 500).
  - `PaymentResponse`: Chứa đầy đủ thông tin giao dịch trả về (`id`, `bookingId`, `amount`, `paymentType`, `paymentMethod`, `status`, `transactionRef`, `paidAt`, `note`, `createdAt`, `updatedAt`).
- [x] Tạo `PaymentMapper` (MapStruct) ánh xạ `Payment` $\rightarrow$ `PaymentResponse` với `bookingId` từ `booking.id`.
- [x] Tạo `PaymentService` và `PaymentServiceImpl` (@Transactional):
  - `createPayment`:
    - Guards: booking tồn tại (404), quyền gọi (chủ booking hoặc STAFF/ADMIN $\rightarrow$ 403 nếu không thỏa), `booking.status == PENDING` (409 `BOOKING_NOT_PAYABLE`), chưa có payment SUCCESS cho booking (409 `BOOKING_ALREADY_PAID`).
    - Tính `amount` server-side: `FULL` = `booking.totalAmount`, `DEPOSIT` = `booking.totalAmount` / 2 (làm tròn 2 chữ số, `HALF_UP`).
    - Gọi `paymentGateway.charge(amount, ...)`.
    - Cập nhật `payment.status = SUCCESS`, `payment.paidAt = now`, `payment.transactionRef = result.transactionRef()`.
    - Đồng thời chuyển `booking.status = CONFIRMED`.
    - Lưu cả `payment` và `booking`.
  - `refundPayment`:
    - Guards: payment tồn tại (404), `payment.status == SUCCESS` (409 `REFUND_NOT_ALLOWED`), `booking.status ∉ {CHECKED_IN, COMPLETED}` (409 `REFUND_NOT_ALLOWED`).
    - Cập nhật `payment.status = REFUNDED`.
    - Chuyển `booking.status = CANCELLED`.
    - Lưu cả `payment` và `booking`.
- [x] Tạo `PaymentController`:
  - `POST /api/v1/payments`: `@PreAuthorize("isAuthenticated()")` $\rightarrow$ trả về 201 Created.
  - `POST /api/v1/payments/{id}/refund`: `@PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")` $\rightarrow$ trả về 200 OK.
  - Swagger annotations: `@Tag(name = "Payments")`, `@Operation`, `@SecurityRequirement(name = "BearerAuth")` đầy đủ.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/modules/payment/repository/PaymentRepository.java`
- `src/main/java/com/badminton/modules/payment/dto/request/CreatePaymentRequest.java`
- `src/main/java/com/badminton/modules/payment/dto/request/RefundPaymentRequest.java`
- `src/main/java/com/badminton/modules/payment/dto/response/PaymentResponse.java`
- `src/main/java/com/badminton/modules/payment/mapper/PaymentMapper.java`
- `src/main/java/com/badminton/modules/payment/service/PaymentService.java`
- `src/main/java/com/badminton/modules/payment/service/impl/PaymentServiceImpl.java`
- `src/main/java/com/badminton/modules/payment/PaymentController.java`

**Estimated scope:** Medium: 8 files

---

## Checkpoint 2: All Module 6 Endpoints Implemented
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Cả 2 endpoints biên dịch trơn tru, logic guards và phân quyền SpEL sẵn sàng.

---

## Task 3: Comprehensive Testing (Unit Mockito & DataJpaTest)
**Description:** Xây dựng bộ test toàn diện cho Module 6 gồm unit tests cho toàn bộ các kịch bản và guards của `PaymentService`, cùng integration test `@DataJpaTest` trên H2 database thật để xác thực query kiểm tra payment SUCCESS của booking.

**Acceptance criteria:**
- [x] Test Mockito trong `PaymentServiceTest`:
  - Khách thanh toán FULL cho booking của mình $\rightarrow$ amount = 100%, status SUCCESS, booking CONFIRMED (201).
  - Nhân viên quầy thanh toán DEPOSIT cho khách $\rightarrow$ amount = 50%, status SUCCESS, booking CONFIRMED (201).
  - Khách cố tình thanh toán cho booking của người khác $\rightarrow$ 403 ACCESS_DENIED.
  - Thanh toán booking không tồn tại $\rightarrow$ 404 BOOKING_NOT_FOUND.
  - Thanh toán booking đã CANCELLED hoặc CONFIRMED $\rightarrow$ 409 BOOKING_NOT_PAYABLE.
  - Thanh toán lần 2 cho booking đã có payment SUCCESS $\rightarrow$ 409 BOOKING_ALREADY_PAID.
  - Staff hoàn tiền cho payment SUCCESS $\rightarrow$ payment REFUNDED, booking CANCELLED (200).
  - Hoàn tiền payment không tồn tại $\rightarrow$ 404 PAYMENT_NOT_FOUND.
  - Hoàn tiền payment chưa thành công hoặc đã REFUNDED $\rightarrow$ 409 REFUND_NOT_ALLOWED.
  - Hoàn tiền khi khách đã CHECKED_IN hoặc COMPLETED $\rightarrow$ 409 REFUND_NOT_ALLOWED.
- [x] Test JPA Data trong `PaymentRepositoryDataJpaTest` chạy trên H2:
  - Khẳng định query `existsByBookingIdAndStatus` phát hiện chính xác khi đã có payment SUCCESS và trả về false khi chưa có hoặc ở status khác.
- [x] Toàn bộ test suites trong toàn dự án pass 100%: `.\mvnw.cmd clean test`.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Task 2

**Files likely touched:**
- `src/test/java/com/badminton/modules/payment/PaymentServiceTest.java`
- `src/test/java/com/badminton/modules/payment/PaymentRepositoryDataJpaTest.java`

**Estimated scope:** Small: 2 files

---

## Checkpoint 3: Tests Pass 100%
- [x] Tests pass: `.\mvnw.cmd clean test`
- [x] Toàn bộ test suites của Module 1 đến Module 6 pass xanh, không có lỗi hồi quy.

---

## Task 4: Documentation Synchronization & Review
**Description:** Soạn thảo tài liệu API chi tiết cho Module 6, tài liệu phân tích kiến trúc Module 6 (bảng SOLID, 3 quyết định thiết kế cốt lõi), cập nhật `docs/architecture/README.md`, rà soát `docs/architecture/rbac-matrix.md`, và thực hiện review qua `/open-code-review-delegate`.

**Acceptance criteria:**
- [x] Tạo `docs/api/module-6-payments.md`: Chi tiết 2 endpoints thanh toán và hoàn tiền, mẫu request/response JSON và danh sách mã lỗi (400, 401, 403, 404, 409).
- [x] Tạo `docs/architecture/modules/module-6-payments.md`: Mô tả kiến trúc Module 6, bảng SOLID, giải thích chi tiết:
  1. Vì sao tách interface `PaymentGateway` (DIP — cắm cổng thật không sửa service).
  2. Vì sao `amount` bắt buộc phải tính server-side (chống gian lận sửa giá từ client).
  3. Vì sao refund đi kèm hủy lịch đặt sân `booking -> CANCELLED` (giải phóng slot ngay cho khách khác và bảo toàn lịch sử giao dịch).
- [x] Cập nhật `docs/architecture/README.md`: Đánh dấu Module 6 hoàn thành và gắn link tới tài liệu tương ứng.
- [x] Rà soát `docs/architecture/rbac-matrix.md` (mục V, dòng 22–23).

**Verification:**
- [x] Manual review: Toàn bộ markdown links hoạt động chính xác.
- [x] Review bằng OCR: `ocr delegate rule` không có lỗi.

**Dependencies:** Task 3

**Files likely touched:**
- `docs/api/module-6-payments.md`
- `docs/architecture/modules/module-6-payments.md`
- `docs/architecture/README.md`
- `docs/architecture/rbac-matrix.md`

**Estimated scope:** Medium: 4 files

---

## Checkpoint 4: Module 6 Complete, Verified & Documented
- [x] Cả 2 endpoints hoạt động đúng 100% đặc tả.
- [x] Tất cả các tiêu chí trong checklist tự kiểm tra đều pass.
- [x] `.\mvnw.cmd clean compile` và `.\mvnw.cmd clean test` pass 100%.
- [x] Hệ thống tài liệu API & Kiến trúc đồng bộ hoàn chỉnh.
