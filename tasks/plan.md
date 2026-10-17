# Implementation Plan: Module 4 - Bookings & Concurrency Control

## 1. Overview
Module 4 xây dựng luồng nghiệp vụ cốt lõi của hệ thống **QuanLySanCauLong**: **Đặt sân online dành cho khách hàng** kết hợp **Kiểm soát tương đồng / Chống đặt trùng slot (Concurrency & Double-Booking Control)**.
Phạm vi Module 4 tập trung vào 5 REST API endpoints phục vụ khách hàng tra cứu slot trống theo thời gian thực, đặt sân trực tuyến, xem lịch sử đặt chỗ cá nhân, đổi lịch và hủy đặt sân trước giờ chơi.

Module 5 tiếp theo sẽ phụ trách các nghiệp vụ vận hành ngoại tuyến: Đặt sân tại quầy (POS), Check-in khách vào sân và Đặt lịch cố định hàng tuần.

---

## 2. Architecture & Design Decisions

### 2.1. Đơn vị đặt sân = 1 Khung giờ chuẩn (TimeSlot)
- Khách đặt sân theo từng khung giờ cố định (`courtId`, `bookingDate`, `timeSlotId`). Không chia nhỏ giờ lẻ trong một khung giờ.
- **Lý do thiết kế:** Đơn giá thuê sân đã được cấu hình theo từng khung giờ tại Module 3. Đặt theo khung giờ chuẩn giúp đồng nhất bảng giá, thuận tiện hiển thị trên giao diện người dùng (Matrix Lịch trống) và tránh tạo ra các khoảng thời gian trống vụn vặt (30 phút, 15 phút) không thể cho thuê. Nghiệp vụ thuê giờ lẻ linh hoạt được dành riêng làm phần mở rộng trong tương lai.

### 2.2. Kiểm soát xung đột đặt chỗ bằng Pessimistic Write Lock thay vì Unique Constraint
- **Vấn đề:** Khi khách hủy đặt sân (`DELETE /api/v1/bookings/{id}`), hệ thống thực hiện Soft-Cancel (chuyển trạng thái sang `CANCELLED`) để bảo lưu lịch sử đơn hàng phục vụ kế toán, giải trình và audit. Do đó, trong bảng `bookings` có thể tồn tại nhiều bản ghi có cùng `(court_id, booking_date, time_slot_id)` nếu các đơn trước đã bị hủy.
- **Hạn chế của Unique Constraint:** Ràng buộc `UNIQUE(court_id, booking_date, time_slot_id)` ở tầng Database sẽ ngăn cản việc khách khác đặt lại vào slot vừa được hủy, hoặc buộc phải xóa cứng (Hard Delete) bản ghi làm mất dấu vết kiểm toán.
- **Giải pháp:** Sử dụng **Pessimistic Write Lock (`LockModeType.PESSIMISTIC_WRITE`)** trên bản ghi `Court` mục tiêu trong cùng một `@Transactional`:
  ```java
  // Bước 1: Khóa dòng Sân để tuần tự hóa các yêu cầu đồng thời
  Court court = courtRepository.findByIdForUpdate(courtId)
          .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

  // Bước 2: Kiểm tra xem slot đã có booking nào ở trạng thái PENDING, CONFIRMED, CHECKED_IN chưa
  if (bookingRepository.existsActiveBooking(courtId, bookingDate, timeSlotId)) {
      throw new AppException(ErrorCode.SLOT_ALREADY_BOOKED);
  }
  ```
  Khi 2 khách hàng gửi request đặt cùng 1 slot tại cùng 1 tích tắc, transaction thứ 2 sẽ phải chờ lock. Sau khi transaction thứ nhất commit giữ chỗ thành công, transaction thứ hai đọc lại dữ liệu và lập tức nhận phản hồi **HTTP 409 Conflict (`SLOT_ALREADY_BOOKED`)**.

### 2.3. Snapshot giá tiền (`totalAmount`) tại thời điểm tạo đơn
- Khi đơn đặt sân được tạo, hệ thống tự động tính toán:
  $$\text{totalAmount} = \text{pricePerHour của TimeSlot} \times \text{thời lượng khung giờ (tính theo giờ)}$$
  *(Ví dụ: Khung 16:00–21:00 có thời lượng 5 giờ, đơn giá 150.000 VNĐ/giờ $\rightarrow$ totalAmount = 750.000 VNĐ).*
- Giá trị này được lưu cố định (snapshot) vào cột `total_amount` của bảng `bookings`. Sau này dù Quản trị viên có thay đổi bảng giá của khung giờ đó, giá trị các đơn đặt sân trong quá khứ vẫn được bảo toàn nguyên vẹn, đảm bảo tính chuẩn xác cho hóa đơn và báo cáo doanh thu (Module 6 & 8).

### 2.4. Trạng thái Đặt sân & Quy trình Giữ chỗ (Booking Lifecycle)
- Khi đặt sân online thành công (`POST /api/v1/bookings`), đơn hàng mang trạng thái mặc định: **`PENDING`** (Đang chờ thanh toán).
- Slot ở trạng thái `PENDING` được tính là **đã bị chiếm chỗ** (được hiển thị `BOOKED` trên màn hình tra cứu), ngăn không cho khách khác đặt đè.
- **Module 6 (Payments)** sẽ lắng nghe hoặc tích hợp để chuyển trạng thái sang `CONFIRMED` khi khách thanh toán thành công, hoặc giải phóng slot nếu quá hạn thanh toán.
- Khách chỉ được phép đổi lịch (`PUT`) hoặc hủy lịch (`DELETE`) khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`, và **thời điểm hiện tại phải trước thời gian bắt đầu của khung giờ đã đặt**.

### 2.5. Bảo mật Phân quyền Chủ sở hữu qua SpEL (`@bookingSecurity.isOwner(#id)`)
- Đối với các thao tác nhạy cảm trên từng booking (`PUT`, `DELETE`):
  `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN) or @bookingSecurity.isOwner(#id)")`
- Component `BookingSecurity` đối chiếu ID người dùng hiện tại trong Security Context (`SecurityUtils.getCurrentUserId()`) với chủ sở hữu của booking. Nếu booking không tồn tại hoặc không thuộc quyền sở hữu của user, method trả về `false`, Spring Security sẽ chặn lại với **HTTP 403 Forbidden** trước khi logic service được thực thi, đảm bảo không làm lộ thông tin tồn tại của bản ghi.

---

## 3. Danh Mục 5 REST API Endpoints

| # | HTTP Method | Endpoint URI | Quyền hạn | Mô tả |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/bookings/availability` | Public (permitAll) | Xem ma trận slot trống theo ngày (`date` bắt buộc, `courtId` / `complexId` tùy chọn). Trả về trạng thái từng slot: `FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`. |
| 2 | `POST` | `/api/v1/bookings` | Authenticated | Đặt sân online cho chính mình. Body: `{courtId, bookingDate, timeSlotId, note?}`. Trả về 201 Created, status = `PENDING`. |
| 3 | `GET` | `/api/v1/bookings/my` | Authenticated | Lịch sử đặt sân của user hiện tại (phân trang, sort whitelist: `bookingDate`, `createdAt`, `totalAmount`, lọc theo `status`, `fromDate`, `toDate`). |
| 4 | `PUT` | `/api/v1/bookings/{id}` | Owner hoặc Admin | Đổi lịch đặt sân (court, date, timeSlot, note). Guards: status ∈ {PENDING, CONFIRMED}, trước giờ bắt đầu, slot mới phải trống, tính lại `totalAmount`. |
| 5 | `DELETE` | `/api/v1/bookings/{id}` | Owner hoặc Admin | Hủy lịch đặt sân (Soft-Cancel: chuyển status sang `CANCELLED`). Guards: status ∈ {PENDING, CONFIRMED}, trước giờ bắt đầu. |

---

## 4. Cấu Trúc File & Package Tổ Chức

```
src/main/java/com/badminton/modules/booking/
├── BookingController.java                 # REST Controller chứa 5 endpoints
├── entity/
│   ├── Booking.java                       # Entity đơn đặt sân (table: bookings)
│   ├── BookingStatus.java                 # Enum: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
│   └── SlotStatus.java                    # Enum trạng thái hiển thị: FREE, BOOKED, PASSED, UNAVAILABLE
├── repository/
│   └── BookingRepository.java             # JPA Repository, truy vấn kiểm tra trùng slot & availability
├── dto/
│   ├── request/
│   │   ├── CreateBookingRequest.java      # courtId, bookingDate, timeSlotId, note
│   │   └── UpdateBookingRequest.java      # courtId?, bookingDate?, timeSlotId?, note?
│   └── response/
│       ├── BookingResponse.java           # DTO trả về chi tiết đơn đặt sân
│       ├── CourtAvailabilityResponse.java # Danh sách slot theo từng sân
│       └── SlotAvailabilityResponse.java  # Chi tiết trạng thái của 1 slot
├── mapper/
│   └── BookingMapper.java                 # MapStruct chuyển đổi Entity <-> DTO
├── security/
│   └── BookingSecurity.java               # Component kiểm tra quyền sở hữu đơn đặt sân
└── service/
    ├── BookingService.java                # Interface nghiệp vụ đặt sân
    └── impl/
        └── BookingServiceImpl.java        # Triển khai nghiệp vụ kèm Pessimistic Lock & Guards
```

---

## 5. Các Bước Triển Khai (Phases)

- **Phase 1: Hạ tầng kiểm thử H2, Error Codes & SecurityConfig**
  - Thêm dependency `com.h2database:h2` (scope test) vào `pom.xml`.
  - Mở rộng `ErrorCode.java` với 6 mã lỗi mới: `BOOKING_NOT_FOUND`, `SLOT_ALREADY_BOOKED`, `COURT_NOT_AVAILABLE`, `INVALID_BOOKING_DATE`, `BOOKING_NOT_CANCELLABLE`, `BOOKING_NOT_RESCHEDULABLE`.
  - Bổ sung cấu hình `permitAll` cho `GET /api/v1/bookings/availability` trong `SecurityConfig.java`.
  - Bổ sung method `findByIdForUpdate(Long id)` với `@Lock(LockModeType.PESSIMISTIC_WRITE)` vào `CourtRepository`.

- **Phase 2: Domain Entity, Repository, DTOs & Mappers**
  - Tạo Entity `Booking`, Enums `BookingStatus`, `SlotStatus`.
  - Tạo DTOs request/response có đầy đủ bean validation.
  - Tạo MapStruct `BookingMapper` (tắt builder để tương thích `BaseEntity`).
  - Tạo `BookingRepository` với các JPQL query tìm slot trùng và query lịch sử đặt sân.

- **Phase 3: Security Component & Core Booking Service**
  - Tạo `BookingSecurity` với method `isOwner(Long bookingId)`.
  - Tạo `BookingService` và triển khai `BookingServiceImpl`:
    - Đặt sân online với Pessimistic Lock và snapshot `totalAmount`.
    - Lấy lịch sử đặt sân của user hiện tại với `SortUtils` whitelist validation.
    - Đổi lịch (`PUT`) và Hủy lịch (`DELETE`) kèm các guards kiểm tra trạng thái và thời gian cutoff.

- **Phase 4: Availability Service & REST Controller**
  - Triển khai thuật toán tính toán trạng thái slot (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`) cho từng sân con theo ngày.
  - Tạo `BookingController` với đầy đủ 5 endpoints và tài liệu Swagger OpenAPI `@Tag(name = "Bookings")`.

- **Phase 5: Kiểm Thử Toàn Diện (Unit Test, DataJpaTest & Concurrency Test)**
  - Viết `BookingRepositoryDataJpaTest` chạy trên H2 thật kiểm thử các câu query kiểm tra xung đột slot.
  - Viết `BookingConcurrencyTest` mô phỏng 2 threads đồng thời đặt cùng 1 slot để kiểm chứng Pessimistic Lock (đúng 1 thread nhận 201, thread còn lại nhận 409).
  - Viết `BookingServiceTest` bao quát toàn bộ các guards nghiệp vụ (ngày quá khứ, sân bảo trì, đổi lịch quá giờ bắt đầu, hủy lịch).
  - Chạy `.\mvnw.cmd clean test` đảm bảo 100% tests pass.

- **Phase 6: Đồng Bộ Hệ Thống Tài Liệu**
  - Tạo `docs/api/module-4-bookings.md`: Đầy đủ request/response cho cả 5 endpoints và các mã lỗi (400, 401, 403, 404, 409).
  - Tạo `docs/architecture/modules/module-4-bookings.md`: Phân tích bài toán, kiến trúc, áp dụng SOLID và giải thích các quyết định thiết kế.
  - Cập nhật `docs/architecture/README.md`: Cập nhật trạng thái Module 2, 3, 4 và chuẩn hóa toàn bộ sơ đồ phân tầng sang package-by-feature.
  - Cập nhật `docs/architecture/rbac-matrix.md`: Bổ sung dòng `GET /api/v1/bookings/my`.
