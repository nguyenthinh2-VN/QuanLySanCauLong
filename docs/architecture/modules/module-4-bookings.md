# CHI TIẾT MODULE 4: BOOKINGS & CONCURRENCY CONTROL

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Nghiệp vụ đặt sân online của khách hàng, xem lịch sử đặt chỗ cá nhân, đổi lịch, hủy lịch và cơ chế kiểm soát đồng thời (Pessimistic Locking) chống double-booking.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problems Solved)

1. **Tra cứu tình trạng sân bãi đa chiều theo thời gian thực (Real-time Availability Matrix):**
   - Cung cấp endpoint công khai `GET /api/v1/bookings/availability?date=YYYY-MM-DD` cho phép khách tra cứu trạng thái từng khung giờ của các sân trong ngày.
   - Phân loại rõ 4 trạng thái slot:
     - `UNAVAILABLE`: Sân đang ở chế độ bảo trì (`CourtStatus.MAINTENANCE`).
     - `PASSED`: Ngày tra cứu là hôm nay và khung giờ đã kết thúc.
     - `BOOKED`: Khung giờ đã có khách giữ chỗ (`PENDING`), đã xác nhận (`CONFIRMED`) hoặc đã vào sân (`CHECKED_IN`).
     - `FREE`: Khung giờ sẵn sàng cho thuê.

2. **Quy trình đặt sân trực tuyến & Trạng thái giữ chỗ (Online Booking Lifecycle):**
   - Khách hàng đã đăng nhập đặt sân online cho chính mình qua `POST /api/v1/bookings`.
   - Đơn đặt ban đầu mang trạng thái **`PENDING`** (đang chờ thanh toán). Ngay khi ở trạng thái này, slot đã được tính là đã bị chiếm chỗ, ngăn chặn các khách hàng khác đặt đè.
   - Module 6 (Payments) sau này sẽ phụ trách luồng thanh toán chuyển từ `PENDING` sang `CONFIRMED`.

3. **Chính sách đổi / hủy lịch minh bạch (Reschedule & Cancellation Policy):**
   - Khách chỉ được phép hủy lịch (`DELETE`) hoặc đổi lịch (`PUT`) khi đơn ở trạng thái hợp lệ (`PENDING` hoặc `CONFIRMED`).
   - Ràng buộc thời gian cutoff: Thời điểm thực hiện yêu cầu bắt buộc phải diễn ra **trước giờ bắt đầu** của khung giờ đã đặt.
   - Thao tác hủy đơn thực hiện **Soft-Cancel** (chuyển trạng thái sang `CANCELLED`), bảo toàn lịch sử giao dịch phục vụ đối soát kế toán và giải phóng slot ngay lập tức cho khách khác.

---

## 2. Ba Quyết Định Thiết Kế Cốt Lõi (Key Architectural Decisions)

### 2.1. Vì sao đơn vị đặt sân là một Khung Giờ chuẩn (TimeSlot)?
- **Tính nhất quán về giá:** Đơn giá thuê sân đã được chuẩn hóa theo từng khung giờ trong Module 3 (`pricePerHour` gắn liền với khoảng thời gian cao điểm / thấp điểm). Đặt theo trọn vẹn 1 khung giờ đảm bảo công thức tính giá `totalAmount = pricePerHour × số giờ khung` luôn minh bạch và đồng nhất.
- **Tối ưu tỷ lệ lấp đầy sân (Court Utilization):** Nếu cho phép khách đặt lẻ giờ tùy ý (ví dụ: đặt 1 tiếng từ 17:00–18:00 trong khung 16:00–21:00), hệ thống sẽ bị phân mảnh thời gian, tạo ra các "khoảng trống vụn vặt" (30 phút, 45 phút) không thể cho khách khác thuê tiếp, gây tổn thất doanh thu cho chủ sân.
- **Trải nghiệm giao diện (UX Matrix):** Việc hiển thị lưới lịch dạng ma trận slot cố định giúp người dùng dễ dàng quan sát và thao tác nhanh chóng hơn so với bộ chọn giờ tự do. Nghiệp vụ đặt giờ linh hoạt được quy hoạch làm phần mở rộng riêng biệt trong tương lai.

### 2.2. Vì sao dùng Pessimistic Write Lock thay vì Unique Database Constraint?
- **Vấn đề kiểm toán (Audit Trail) và Soft Delete:** Để đảm bảo tính minh bạch tài chính, khi khách hủy đặt sân, hệ thống không xóa cứng (Hard Delete) dòng dữ liệu khỏi bảng `bookings` mà giữ lại và cập nhật `status = CANCELLED`.
- **Hạn chế của Unique Constraint:** Nếu đặt ràng buộc duy nhất trên 3 cột `UNIQUE(court_id, booking_date, time_slot_id)` ở tầng cơ sở dữ liệu:
  - Khi một đơn hàng bị hủy (`status = CANCELLED`), bản ghi vẫn còn lưu trong bảng `bookings`.
  - Lúc này, nếu khách khác muốn đặt lại đúng vào slot vừa được hủy đó, Database sẽ ném lỗi trùng khóa duy nhất (`DataIntegrityViolationException`), khiến slot bị "chết" vĩnh viễn không thể tái sử dụng.
  - Một số hệ thống dùng Partial Unique Index (chỉ index khi `status != 'CANCELLED'`), tuy nhiên tính năng này không chuẩn hóa hoặc hạn chế hỗ trợ trên nhiều engine MySQL cũ.
- **Giải pháp Pessimistic Write Lock (`LockModeType.PESSIMISTIC_WRITE`):**
  - Trong cùng một `@Transactional`, service tiến hành khóa dòng sân con mục tiêu: `courtRepository.findByIdForUpdate(courtId)`.
  - Hai transaction đồng thời cố gắng đặt cùng một sân sẽ phải tuần tự hóa qua cơ chế hàng đợi lock của cơ sở dữ liệu (`SELECT ... FOR UPDATE`).
  - Transaction thứ hai chỉ được thực thi sau khi transaction thứ nhất commit. Khi đọc lại dữ liệu, query kiểm tra `existsActiveBooking` sẽ nhận thấy slot đã có đơn `PENDING` và lập tức trả về lỗi **HTTP 409 Conflict (`SLOT_ALREADY_BOOKED`)** mà không bị lỗi crash tầng DB.

### 2.3. Vì sao Snapshot giá tiền (`totalAmount`) vào bản ghi Booking?
- **Bảo toàn lịch sử giao dịch (Historical Invariance):** Bảng giá khung giờ tại `time_slots` có thể được Quản trị viên cập nhật theo từng thời kỳ (ví dụ: tăng giá vào dịp lễ tết hoặc điều chỉnh theo mùa).
- **Tránh sai lệch hóa đơn và kế toán:** Nếu không lưu snapshot `totalAmount` mà tính động mỗi lần truy vấn dựa trên `timeSlot.getPricePerHour()`, việc Admin đổi giá khung giờ trong tương lai sẽ làm thay đổi số tiền của các đơn đặt sân trong quá khứ. Điều này vi phạm nghiêm trọng tính toàn vẹn của báo cáo doanh thu, gây tranh chấp tài chính khi xuất hóa đơn (Module 6 & 8).
- **Tính toán server-side:** Giá trị `totalAmount` được tính toán tuyệt đối ở backend:
  $$\text{totalAmount} = \text{pricePerHour} \times \frac{\text{durationInMinutes}}{60}$$
  Client không được phép truyền trường này lên server, loại trừ 100% rủi ro bị can thiệp thay đổi giá từ phía trình duyệt.

---

## 3. Cấu Trúc Các Thành Phần Code (Code Inventory)

Toàn bộ Module 4 được tổ chức gói gọn trong package `com.badminton.modules.booking`:

```
com.badminton.modules.booking
├── BookingController.java                 # REST Controller phục vụ 5 endpoints (/api/v1/bookings)
├── entity/
│   ├── Booking.java                       # JPA Entity (table: bookings, extends BaseEntity)
│   ├── BookingStatus.java                 # Enum: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
│   └── SlotStatus.java                    # Enum trạng thái hiển thị: FREE, BOOKED, PASSED, UNAVAILABLE
├── repository/
│   └── BookingRepository.java             # Spring Data JPA Repository + JPQL queries chống trùng slot
├── security/
│   └── BookingSecurity.java               # Component hỗ trợ SpEL @bookingSecurity.isOwner(#id)
├── dto/
│   ├── request/
│   │   ├── CreateBookingRequest.java      # DTO đặt sân (courtId, bookingDate, timeSlotId, note)
│   │   └── UpdateBookingRequest.java      # DTO đổi lịch đặt sân
│   └── response/
│       ├── BookingResponse.java           # DTO chi tiết đơn đặt sân
│       ├── CourtAvailabilityResponse.java # DTO ma trận slot theo từng sân
│       └── SlotAvailabilityResponse.java  # DTO trạng thái từng slot
├── mapper/
│   └── BookingMapper.java                 # MapStruct chuyển đổi Entity <-> DTO
└── service/
    ├── BookingService.java                # Interface định nghĩa nghiệp vụ đặt sân
    └── impl/
        └── BookingServiceImpl.java        # Triển khai nghiệp vụ với Pessimistic Lock và Guards
```

---

## 4. Phân Tích Áp Dụng SOLID Trong Module 4

| Nguyên tắc | Vị trí và Cơ chế áp dụng cụ thể trong Module 4 |
|---|---|
| **S - Single Responsibility** | - `BookingController` chỉ đóng vai trò phân luồng HTTP, validate input và cấu hình swagger.<br>- `BookingServiceImpl` nắm giữ 100% business logic, tính giá snapshot và kiểm soát concurrency.<br>- `BookingSecurity` đảm nhận duy nhất nhiệm vụ thẩm định quyền sở hữu tài nguyên của user hiện tại.<br>- `SortUtils` chỉ chuyên biệt chuẩn hóa và kiểm tra whitelist sắp xếp. |
| **O - Open-Closed** | - Lịch sử đặt sân cá nhân `getMyBookings` sử dụng `Specification<Booking>`. Khi cần mở rộng các tiêu chí lọc mới (ví dụ: lọc theo cụm sân, theo phương thức thanh toán), hệ thống dễ dàng bổ sung Predicate mà không cần sửa đổi repository hay câu truy vấn cốt lõi.<br>- Enum `BookingStatus` cho phép Module 6 (Payments) và Module 5 (Check-in) tiếp tục mở rộng các trạng thái chuyển dịch tiếp theo một cách an toàn. |
| **L - Liskov Substitution** | - `Booking` kế thừa từ `BaseEntity` (`id`, `createdAt`, `updatedAt`). Cấu hình MapStruct `@Mapper(builder = @Builder(disableBuilder = true))` đảm bảo cơ chế kế thừa hoạt động trơn tru không gây lỗi reflection của Lombok Builder. |
| **I - Interface Segregation** | - Phân tách các DTO rạch ròi: `CreateBookingRequest` bắt buộc các trường ID sân, ngày, slot; `UpdateBookingRequest` cho phép cập nhật linh hoạt từng trường; DTO tra cứu lịch trống (`CourtAvailabilityResponse`, `SlotAvailabilityResponse`) được tinh gọn, không tải kèm thông tin người dùng hay dữ liệu thanh toán nhạy cảm. |
| **D - Dependency Inversion** | - `BookingController` hoàn toàn phụ thuộc vào Interface `BookingService`, không phụ thuộc vào `BookingServiceImpl`.<br>- 100% injection thực hiện qua Constructor (`@RequiredArgsConstructor`), không phụ thuộc vào field injection `@Autowired`. |
