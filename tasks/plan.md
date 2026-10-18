# Specification & Implementation Plan: Module 5 - Court Operations (POS, Check-in & Recurring)

## 1. Specification (Phase 1: Specify)

### 1.1. Objective
Module 5 mở rộng hệ sinh thái quản lý đặt sân của hệ thống **QuanLySanCauLong** sang các nghiệp vụ vận hành thực tế tại quầy (Operations & Offline) và đặt lịch định kỳ:
1. **POS (Point-of-Sale):** Cho phép nhân viên (`STAFF`/`ADMIN`) tạo đơn đặt sân trực tiếp tại quầy cho khách lẻ/khách vãng lai mà không bắt buộc tạo tài khoản User (tránh rác dữ liệu). Trạng thái đơn được chuyển thẳng thành **`CONFIRMED`**.
2. **Check-in:** Cho phép nhân viên (`STAFF`/`ADMIN`) xác nhận khách đến sân trong ngày thi đấu, chuyển trạng thái đơn từ `PENDING`/`CONFIRMED` $\rightarrow$ **`CHECKED_IN`**.
3. **Recurring Bookings:** Cho phép khách hàng hoặc nhân viên đặt lịch cố định hàng tuần (lặp từ 1 đến 12 tuần) với cơ chế giao dịch **All-or-Nothing** (chỉ cần 1 ngày bị trùng $\rightarrow$ rollback 100% và báo danh sách ngày xung đột).

### 1.2. Tech Stack & Existing Foundations
- Java 23, Spring Boot 3.3.5, Spring Data JPA, Spring Security (Method Security with SpEL).
- MapStruct 1.5.5.Final (`builder = @Builder(disableBuilder = true)`).
- MySQL 8.x (Production) & In-memory H2 (Test).
- Tái sử dụng: `CourtRepository.findByIdForUpdate`, `BookingRepository.existsActiveBooking`, `SecurityUtils.getCurrentUserId()`, `ApiResponse<T>`, `ErrorCode`, `SortUtils`.

### 1.3. Commands
- Build/Compile: `.\mvnw.cmd clean compile`
- Run all tests: `.\mvnw.cmd test`
- Focused test: `.\mvnw.cmd test -Dtest=BookingOperationServiceTest`

### 1.4. Boundaries
- **Always do:**
  - 100% constructor injection (`@RequiredArgsConstructor`).
  - Kiểm tra Pessimistic Lock trên row `Court` trước khi kiểm tra trùng slot.
  - Snapshot `totalAmount` server-side cho tất cả các booking con.
  - Phân quyền method-level bằng `RoleConstants` qua SpEL.
  - Kiểm thử `@DataJpaTest` trên H2 thật cho bất kỳ query JPQL mới nào.
- **Ask first:**
  - Thay đổi cấu trúc bảng hoặc DTO của Module 1, 2, 3.
  - Thêm endpoint ngoài 3 endpoint đã chốt.
- **Never do:**
  - Hard-code chuỗi role (như `"ADMIN"` hoặc `"STAFF"`).
  - Trả Entity trực tiếp ra ngoài Controller.
  - Bắt khách vãng lai phải tạo tài khoản giả ở bảng `users`.
  - Tạo booking nửa vời khi đặt lịch cố định hàng tuần gặp xung đột.

---

## 2. Architecture & Design Decisions

### 2.1. Nới lỏng quan hệ User trong Booking (Khách vãng lai không cần tài khoản)
- **Vấn đề:** Khách chơi vãng lai đến quầy đặt sân trực tiếp thường không có tài khoản app/web. Bắt nhân viên tạo user giả (fake email/password) sẽ làm ô nhiễm bảng `users`, vi phạm bảo mật và khó giải trình trong kiểm toán.
- **Quyết định thiết kế:**
  - Trong entity `Booking`: chuyển `user` thành nullable (`@JoinColumn(name = "user_id", nullable = true)`).
  - Bổ sung 2 trường snapshot: `guestName` (varchar 100, nullable), `guestPhone` (varchar 20, nullable).
  - Tại API `POST /api/v1/bookings/pos`: Áp dụng quy tắc kiểm tra **XOR Logic** (đúng 1 trong 2 phương thức):
    - Đặt cho tài khoản thành viên: Có `userId`, không có `guestName`/`guestPhone`.
    - Đặt cho khách vãng lai: Không có `userId`, có đầy đủ `guestName` và `guestPhone`.
    - Gửi cả hai hoặc thiếu cả hai $\rightarrow$ HTTP 400 (`INVALID_POS_REQUEST`).

### 2.2. Trạng thái khởi tạo POS là `CONFIRMED` thay vì `PENDING`
- Khác với đặt online (khách tự đặt trên web mang trạng thái `PENDING` để chờ tích hợp cổng thanh toán trực tuyến ở Module 6), khách đặt tại quầy POS đang đứng trực tiếp trước nhân viên thu ngân và đã thanh toán tiền mặt/chuyển khoản tại chỗ. Do đó, đơn được xác nhận trực tiếp với trạng thái **`CONFIRMED`**.

### 2.3. Quy tắc State Machine & Cửa sổ thời gian Check-in
- **Chỉ cho phép check-in** khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`. Nếu đơn đã `CHECKED_IN`, `CANCELLED` hoặc `COMPLETED` $\rightarrow$ ném HTTP 409 (`CHECK_IN_NOT_ALLOWED`).
- **Ràng buộc ngày chơi:** `bookingDate` bắt buộc phải là ngày hôm nay (`booking.getBookingDate().isEqual(LocalDate.now())`), không được check-in sớm cho ngày tương lai hay ngày hôm qua.
- **Ràng buộc giờ kết thúc:** Thời điểm hiện tại chưa quá giờ kết thúc của khung giờ (`LocalTime.now().isBefore(slot.getEndTime())`). Nếu đã quá giờ kết thúc $\rightarrow$ ném HTTP 409 (`CHECK_IN_NOT_ALLOWED`).
- Kết quả check-in thành công: Chuyển trạng thái sang **`CHECKED_IN`**.

### 2.4. Thuật toán Đặt lịch cố định hàng tuần (Recurring Bookings) - All-or-Nothing
- **Tham số đầu vào:** `{courtId, timeSlotId, dayOfWeek, startDate, weeks, note?}` với $1 \le weeks \le 12$.
- **Xác định chuỗi ngày:**
  - Ngày bắt đầu chuỗi $D_0$ là ngày đầu tiên $\ge startDate$ có thứ trong tuần trùng với `dayOfWeek`.
  - Danh sách $N$ ngày: $D_i = D_0 + 7 \times i$ với $i \in [0, weeks - 1]$.
  - Guard tầm nhìn tối đa: Ngày cuối cùng $D_{weeks-1}$ không được vượt quá `hôm nay + 90 ngày`. Nếu vượt $\rightarrow$ ném HTTP 400 (`RECURRING_HORIZON_EXCEEDED`).
- **All-or-Nothing Concurrency:**
  - Mở một `@Transactional` duy nhất.
  - Khóa bi quan Sân con: `courtRepository.findByIdForUpdate(courtId)`.
  - Lặp qua $N$ ngày và kiểm tra `bookingRepository.existsActiveBooking(courtId, date, timeSlotId)`.
  - Nếu phát hiện **bất kỳ ngày nào** đã bị chiếm chỗ $\rightarrow$ thu thập toàn bộ vào `conflictedDates`, ném lỗi HTTP 409 (`RECURRING_SLOT_CONFLICT`) kèm danh sách ngày xung đột, kích hoạt rollback toàn bộ transaction.
  - Nếu tất cả $N$ slot đều trống $\rightarrow$ lưu toàn bộ $N$ bản ghi booking với status `PENDING`, tính snapshot `totalAmount` cho từng booking, trả về danh sách kèm tổng số lượng tạo thành công.

---

## 3. Danh Mục 3 REST API Endpoints Module 5

| # | HTTP Method | Endpoint URI | Quyền hạn (RBAC) | Mô tả |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/bookings/pos` | `STAFF`, `ADMIN` | Đặt sân tại quầy cho khách vãng lai hoặc đặt hộ thành viên. Trả về 201 Created, status = `CONFIRMED`. |
| 2 | `POST` | `/api/v1/bookings/{id}/check-in` | `STAFF`, `ADMIN` | Check-in khách vào sân. Guards: status ∈ {PENDING, CONFIRMED}, date = hôm nay, now < slot endTime. Trả về 200 OK, status = `CHECKED_IN`. |
| 3 | `POST` | `/api/v1/bookings/recurring` | `isAuthenticated()` | Đặt lịch cố định hàng tuần (1–12 tuần). Giao dịch All-or-Nothing. Trả về 201 Created kèm `{createdCount, bookings: [...]}`. |

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Phases & Tasks)

### Phase 1: Mở rộng Entity, DTOs & Error Codes
- **Task 1.1:** Cập nhật `ErrorCode.java`: Thêm 4 mã lỗi `INVALID_POS_REQUEST` (400), `CHECK_IN_NOT_ALLOWED` (409), `RECURRING_SLOT_CONFLICT` (409), `RECURRING_HORIZON_EXCEEDED` (400).
- **Task 1.2:** Cập nhật `AppException.java` & `GlobalExceptionHandler.java`: Hỗ trợ truyền dữ liệu chi tiết (`data` / `conflictedDates`) trong phản hồi lỗi.
- **Task 1.3:** Cập nhật Entity `Booking.java`: Nới lỏng `user` thành nullable, thêm 2 trường `guestName` (length 100), `guestPhone` (length 20).
- **Task 1.4:** Cập nhật `BookingResponse.java` & `BookingMapper.java`: Ánh xạ `guestName`, `guestPhone`.
- **Task 1.5:** Tạo DTOs mới:
  - `CreatePosBookingRequest.java`
  - `CreateRecurringBookingRequest.java`
  - `RecurringBookingResponse.java`

### Phase 2: Triển Khai Nghiệp Vụ Tại Quầy & Check-in (Service & Controller)
- **Task 2.1:** Khai báo 3 phương thức mới trong `BookingService.java`:
  - `BookingResponse createPosBooking(CreatePosBookingRequest request);`
  - `BookingResponse checkInBooking(Long id);`
  - `RecurringBookingResponse createRecurringBooking(CreateRecurringBookingRequest request);`
- **Task 2.2:** Triển khai logic trong `BookingServiceImpl.java`:
  - `createPosBooking`: Kiểm tra XOR `userId` vs `guestName` + `guestPhone`, khóa bi quan sân, kiểm tra slot trống, tính giá snapshot, gán status = `CONFIRMED`.
  - `checkInBooking`: Kiểm tra status hợp lệ, kiểm tra ngày hôm nay, kiểm tra chưa quá endTime, gán status = `CHECKED_IN`.
  - `createRecurringBooking`: Kiểm tra weeks [1, 12], sinh chuỗi $N$ ngày, kiểm tra horizon 90 ngày, khóa bi quan sân, batch check slot trống All-or-Nothing, lưu $N$ đơn status = `PENDING`.
- **Task 2.3:** Bổ sung 3 endpoints vào `BookingController.java` với phân quyền SpEL và Swagger OpenAPI annotations đầy đủ.

### Phase 3: Kiểm Thử Toàn Diện (Unit, DataJpa & Integration Tests)
- **Task 3.1:** Viết `BookingServiceTest` bao phủ:
  - POS: đặt thành công cho khách vãng lai (`guestName`/`guestPhone`), đặt thành công cho `userId`, ném `INVALID_POS_REQUEST` khi gửi cả hai hoặc thiếu cả hai.
  - Check-in: check-in thành công cho đơn PENDING/CONFIRMED hôm nay; ném `CHECK_IN_NOT_ALLOWED` khi đơn hôm qua, đơn đã check-in, đơn quá endTime.
  - Recurring: đặt thành công chuỗi tuần; ném `RECURRING_SLOT_CONFLICT` kèm ngày xung đột khi có 1 ngày bị chiếm và không có đơn nào được tạo; ném `RECURRING_HORIZON_EXCEEDED` khi vượt 90 ngày.
- **Task 3.2:** Viết Test Concurrent POS vs Online Booking trên cùng 1 slot (đúng 1 bên thắng, bên còn lại nhận 409).
- **Task 3.3:** Chạy `.\mvnw.cmd clean test` đảm bảo 100% test suites trong dự án pass.

### Phase 4: Đồng Bộ Hệ Thống Tài Liệu
- **Task 4.1:** Tạo `docs/api/module-5-bookings-pos.md` với request/response mẫu của cả 3 endpoints và các case lỗi.
- **Task 4.2:** Tạo `docs/architecture/modules/module-5-bookings-pos.md` với bảng SOLID và 3 câu trả lời thiết kế chuyên sâu.
- **Task 4.3:** Cập nhật `docs/architecture/README.md` (Module 5 Hoàn thành).
- **Task 4.4:** Kiểm tra đối soát `docs/architecture/rbac-matrix.md` (dòng 19, 20, 22).

---

## 5. Success Criteria & Verification Checklist

- [ ] `POST /api/v1/bookings/pos` với CUSTOMER $\rightarrow$ 403 Forbidden; với STAFF + khách lẻ (không `userId`) $\rightarrow$ 201 Created và status = `CONFIRMED`, `guestName`/`guestPhone` lưu đúng.
- [ ] `POST /pos` thiếu cả `userId` lẫn `guestName` $\rightarrow$ 400; gửi cả hai $\rightarrow$ 400.
- [ ] Đặt POS và đặt online concurrent cùng 1 slot $\rightarrow$ chỉ 1 bên 201, bên còn lại 409.
- [ ] `POST /api/v1/bookings/{id}/check-in` với booking hôm qua $\rightarrow$ 409; booking đã `CHECKED_IN` check-in lại $\rightarrow$ 409; booking hôm nay `PENDING`/`CONFIRMED` $\rightarrow$ 200 OK và status = `CHECKED_IN`.
- [ ] `POST /api/v1/bookings/recurring` với `weeks = 4` $\rightarrow$ 201 Created, đúng 4 booking `PENDING` cách nhau 7 ngày; có 1 slot trong chuỗi đã bị chiếm $\rightarrow$ 409 Conflict cả chuỗi, rollback 100%, phản hồi liệt kê danh sách ngày conflict.
- [ ] `.\mvnw.cmd clean compile` pass, không cảnh báo MapStruct.
- [ ] Toàn bộ test suites pass 100%.
