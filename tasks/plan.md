# Specification & Implementation Plan: Module 6 - Payments & Refunds

## 1. Specification (Phase 1: Specify)

### 1.1. Objective
Module 6 hoàn thiện mắt xích thanh toán trong chu trình quản trị sân cầu lông **QuanLySanCauLong**:
1. **Thanh toán đơn đặt sân (`POST /api/v1/payments`):**
   - Cho phép khách hàng thanh toán cho đơn của chính mình, hoặc nhân viên quầy (`STAFF`/`ADMIN`) thu tiền mặt/chuyển khoản cho khách hàng.
   - Hỗ trợ 2 loại thanh toán: `FULL` (100% `totalAmount`) hoặc `DEPOSIT` (50% `totalAmount`, làm tròn 2 chữ số thập phân, `HALF_UP`).
   - Tiền `amount` luôn luôn được tính toán server-side từ `booking.totalAmount`, không nhận `amount` từ client.
   - Khi thanh toán thành công qua Mock Payment Gateway $\rightarrow$ `payment.status = SUCCESS`, đồng thời chuyển `booking.status: PENDING -> CONFIRMED` đồng bộ trong cùng một transaction.
   - Chống thanh toán 2 lần: nếu đơn đặt đã có giao dịch `SUCCESS` $\rightarrow$ trả về HTTP 409 (`BOOKING_ALREADY_PAID`).
2. **Hoàn tiền khi hủy lịch (`POST /api/v1/payments/{id}/refund`):**
   - Dành riêng cho `STAFF` và `ADMIN`.
   - Chuyển `payment.status: SUCCESS -> REFUNDED`, đồng thời tự động hủy lịch đặt sân (`booking.status -> CANCELLED`) nếu đơn chưa bị hủy.
   - Điều kiện hoàn tiền: Giao dịch phải đang ở trạng thái `SUCCESS` và đơn đặt sân chưa vào sân (`CHECKED_IN`) hoặc hoàn tất (`COMPLETED`).

### 1.2. Tech Stack & Existing Foundations
- Java 23, Spring Boot 3.3.5, Spring Data JPA, Spring Security (Method Security with SpEL).
- MapStruct 1.5.5.Final (`builder = @Builder(disableBuilder = true)`).
- MySQL 8.x (Production) & In-memory H2 (Test).
- Tái sử dụng: `BookingRepository`, `Booking`, `BookingStatus`, `SecurityUtils.getCurrentUserDetails()`, `ApiResponse<T>`, `ErrorCode`, `RoleConstants`.

### 1.3. Commands
- Build/Compile: `.\mvnw.cmd clean compile`
- Run all tests: `.\mvnw.cmd test`
- Focused test: `.\mvnw.cmd test -Dtest=PaymentServiceTest`
- JPA Data test: `.\mvnw.cmd test -Dtest=PaymentRepositoryDataJpaTest`

### 1.4. Boundaries
- **Always do:**
  - 100% constructor injection (`@RequiredArgsConstructor`).
  - Tiền thanh toán `amount` tính server-side tuyệt đối.
  - Tách interface `PaymentGateway` và mock class `MockPaymentGateway` (@Component) tuân thủ Dependency Inversion Principle (DIP).
  - Phân quyền method-level bằng `RoleConstants` qua SpEL; Swagger đầy đủ.
  - Viết `@DataJpaTest` trên H2 thật cho query kiểm tra giao dịch thành công của booking.
- **Ask first:**
  - Thay đổi cấu trúc entity `Booking` hoặc các DTO của Module 1–5.
  - Thêm endpoint ngoài 2 endpoint đã chốt.
- **Never do:**
  - Nhận `amount` từ client request body.
  - Hard-code chuỗi role ("ADMIN", "STAFF").
  - Cho phép thanh toán lại booking đã có giao dịch SUCCESS (tránh double-charge).
  - Cho phép refund booking đã `CHECKED_IN` hoặc `COMPLETED`.
  - Gọi cổng thanh toán thật bên ngoài (không tích hợp VNPay/MoMo thật khi chưa có giấy phép kinh doanh).

---

## 2. Architecture & Design Decisions

### 2.1. Tách Interface `PaymentGateway` (Dependency Inversion Principle - DIP)
- **Vấn đề:** Trong môi trường demo/portfolio, không thể đăng ký giấy phép kinh doanh để lấy API key từ các cổng thanh toán thực như VNPay, MoMo, ZaloPay. Nếu gọi trực tiếp một class Mock bên trong Service, sau này khi muốn cắm cổng thật sẽ phải sửa lại toàn bộ Service, vi phạm OCP và DIP.
- **Giải pháp:** Thiết kế interface `PaymentGateway` với phương thức `ChargeResult charge(BigDecimal amount, String bookingRef)`. Module 6 cung cấp một implementation duy nhất là `MockPaymentGateway` (@Component), luôn trả về thành công nếu `amount > 0` kèm mã giao dịch `MOCK-<UUID>`. `PaymentService` chỉ phụ thuộc vào interface `PaymentGateway`. Sau này khi cắm VNPay hay MoMo, chỉ cần tạo class mới implement interface mà không cần sửa 1 dòng code service nào.

### 2.2. Tính toán tiền (`amount`) tuyệt đối ở Server-side
- **Vấn đề:** Nếu client gửi `amount` lên server, kẻ gian có thể sửa request body trên trình duyệt (thay vì trả 500,000 VND thì sửa thành 1,000 VND) để gian lận tiền đặt sân.
- **Giải pháp:** Client chỉ gửi `bookingId` và `paymentType` (`FULL` hoặc `DEPOSIT`). Server đọc `booking.totalAmount` đã snapshot an toàn từ Module 4, tự tính toán `FULL = totalAmount` hoặc `DEPOSIT = totalAmount × 50%` (làm tròn 2 chữ số thập phân, `RoundingMode.HALF_UP`). Client không có cơ hội can thiệp vào số tiền giao dịch.

### 2.3. Hoàn tiền đi kèm hủy lịch đặt sân (Refund coupled with Cancellation)
- **Vấn đề:** Khi nhân viên quầy xử lý hoàn tiền cho khách, nếu chỉ cập nhật trạng thái tiền `REFUNDED` mà không hủy lịch đặt sân, khách vẫn có thể vào sân chơi bình thường trong khi đã nhận lại tiền, hoặc sân không được giải phóng cho người khác thuê.
- **Giải pháp:** Nghiệp vụ `refundPayment` thực hiện 2 thao tác nguyên tử trong cùng một `@Transactional`: cập nhật `payment.status = REFUNDED` và cập nhật `booking.status = CANCELLED` (giữ dòng soft-cancel). Sân lập tức được giải phóng cho khách khác đặt và bảo toàn lịch sử giao dịch.

---

## 3. Task List

### Phase 1: Foundation (Domain Models, Enums, Error Codes & Gateway)
- [x] **Task 1: Error Codes, Domain Entities, Enums & Mock Payment Gateway**
  - Thêm 4 mã lỗi mới vào `ErrorCode`: `PAYMENT_NOT_FOUND` (404), `BOOKING_NOT_PAYABLE` (409), `BOOKING_ALREADY_PAID` (409), `REFUND_NOT_ALLOWED` (409).
  - Tạo các enum: `PaymentType` (FULL, DEPOSIT), `PaymentMethod` (CASH, BANK_TRANSFER, E_WALLET), `PaymentStatus` (PENDING, SUCCESS, FAILED, REFUNDED).
  - Tạo entity `Payment` (`table = "payments"`, extends `BaseEntity`, liên kết `@ManyToOne` với `Booking`).
  - Tạo interface `PaymentGateway`, record `ChargeResult`, và component `MockPaymentGateway`.
  - **Verification:** `.\mvnw.cmd compile` thành công.

### Checkpoint 1: Domain, Enums & Gateway Foundation Ready
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Toàn bộ entity và gateway biên dịch sạch sẽ.

### Phase 2: Core Features (Repository, DTOs, Mapper, Service & Controller)
- [x] **Task 2: Repository, DTOs, Mapper, Service Layer & REST Controller**
  - Tạo `PaymentRepository` với phương thức `boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status)`.
  - Tạo DTOs: `CreatePaymentRequest`, `RefundPaymentRequest`, `PaymentResponse`.
  - Tạo `PaymentMapper` (MapStruct).
  - Tạo `PaymentService` & `PaymentServiceImpl`:
    - `createPayment(CreatePaymentRequest)`: Guards booking, quyền sở hữu (owner hoặc staff/admin), status PENDING, chống double-charge, tính amount server-side, gọi gateway, chuyển booking thành CONFIRMED.
    - `refundPayment(Long id, RefundPaymentRequest)`: Guards payment tồn tại, status SUCCESS, booking chưa CHECKED_IN/COMPLETED, chuyển payment thành REFUNDED và booking thành CANCELLED.
  - Tạo `PaymentController`:
    - `POST /api/v1/payments`: `@PreAuthorize("isAuthenticated()")` (201 Created).
    - `POST /api/v1/payments/{id}/refund`: `@PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")` (200 OK).
  - **Verification:** `.\mvnw.cmd compile` thành công.

### Checkpoint 2: Core Features Implemented
- [x] Build succeeds: `.\mvnw.cmd compile`
- [x] Cả 2 endpoints và logic service nghiệp vụ biên dịch hoàn tất.

### Phase 3: Comprehensive Testing (Unit Mockito & DataJpaTest)
- [x] **Task 3: Unit Tests & DataJpaTest Verification**
  - Tạo `PaymentServiceTest` (Mockito):
    - Khách thanh toán FULL cho booking của mình $\rightarrow$ amount = 100%, status SUCCESS, booking CONFIRMED (201).
    - Nhân viên quầy thanh toán DEPOSIT cho khách $\rightarrow$ amount = 50%, status SUCCESS, booking CONFIRMED (201).
    - Khách thanh toán booking của người khác $\rightarrow$ 403 ACCESS_DENIED.
    - Thanh toán booking không tồn tại $\rightarrow$ 404 BOOKING_NOT_FOUND.
    - Thanh toán booking không ở trạng thái PENDING $\rightarrow$ 409 BOOKING_NOT_PAYABLE.
    - Thanh toán lần 2 cho booking đã có payment SUCCESS $\rightarrow$ 409 BOOKING_ALREADY_PAID.
    - Staff refund payment SUCCESS $\rightarrow$ 200, payment REFUNDED, booking CANCELLED.
    - Refund payment không tồn tại $\rightarrow$ 404 PAYMENT_NOT_FOUND.
    - Refund payment không ở trạng thái SUCCESS $\rightarrow$ 409 REFUND_NOT_ALLOWED.
    - Refund khi booking đã CHECKED_IN hoặc COMPLETED $\rightarrow$ 409 REFUND_NOT_ALLOWED.
  - Tạo `PaymentRepositoryDataJpaTest` chạy trên H2 database thật để kiểm thử query `existsByBookingIdAndStatus`.
  - Chạy toàn bộ test suites của cả dự án.
  - **Verification:** `.\mvnw.cmd clean test` pass 100%.

### Checkpoint 3: Test Verification Complete
- [x] Tests pass: `.\mvnw.cmd clean test`
- [x] Không có test nào bị fail hoặc regression bug trên các module cũ.

### Phase 4: Polish & Documentation
- [x] **Task 4: Documentation Synchronization & Review**
  - Tạo `docs/api/module-6-payments.md`: Chi tiết 2 API thanh toán và hoàn tiền, bảng tham số, response JSON mẫu và các mã lỗi HTTP.
  - Tạo `docs/architecture/modules/module-6-payments.md`: Kiến trúc Module 6, bảng SOLID, 3 quyết định thiết kế cốt lõi (DIP Gateway, Server-side Amount, Refund coupled with Cancel).
  - Cập nhật `docs/architecture/README.md`: Đánh dấu Module 6 hoàn thành, bổ sung link tài liệu.
  - Kiểm tra `docs/architecture/rbac-matrix.md` (mục V, dòng 22–23).
  - Tự review bằng `/open-code-review-delegate`.
  - **Verification:** Kiểm tra markdown links, chạy `.\mvnw.cmd clean compile`.

### Checkpoint 4: Complete & Documented
- [x] Toàn bộ tiêu chí nghiệm thu hoàn thành.
- [x] Tài liệu đồng bộ, sẵn sàng bàn giao cho người dùng.

---

## 4. Risks and Mitigations
| Nguy cơ | Mức độ | Biện pháp xử lý |
|---|---|---|
| Khách hàng gian lận số tiền thanh toán từ client | Cao | Bắt buộc tính toán `amount` 100% tại server dựa trên `booking.totalAmount`, không có field `amount` trong Request DTO. |
| Thanh toán lặp lại (Double-Charge) khi người dùng bấm nút nhiều lần | Cao | Query `existsByBookingIdAndStatus(bookingId, SUCCESS)` trước khi tạo giao dịch, ném lỗi 409 `BOOKING_ALREADY_PAID`. |
| Sai lệch quyền hạn (Khách thanh toán nhầm booking người khác) | Trung bình | Kiểm tra `isOwner || isStaffOrAdmin` chặt chẽ trong service, ném 403 nếu vi phạm. |
| Khách đã nhận sân chơi xong nhưng vẫn được hoàn tiền | Cao | Chặn hoàn tiền nếu `booking.status ∈ {CHECKED_IN, COMPLETED}`, ném 409 `REFUND_NOT_ALLOWED`. |

---

## 5. Open Questions
*Không có. Tất cả các yêu cầu và quyết định nghiệp vụ đã được làm rõ và thống nhất trong đặc tả Module 6.*
