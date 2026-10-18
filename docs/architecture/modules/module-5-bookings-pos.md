# CHI TIẾT MODULE 5: COURT OPERATIONS (POS, CHECK-IN & RECURRING BOOKINGS)

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Nghiệp vụ vận hành sân trực tiếp tại quầy (POS), xác nhận khách vào sân (Check-in) và đặt lịch cố định định kỳ hàng tuần (Recurring Bookings) với cơ chế giao dịch All-or-Nothing.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problems Solved)

1. **Vận hành quầy lễ tân linh hoạt cho cả thành viên và khách vãng lai (POS Hybrid Support):**
   - Lễ tân và Quản trị viên (`STAFF`, `ADMIN`) có thể tạo đơn đặt sân ngay tại quầy cho 2 nhóm đối tượng qua `POST /api/v1/bookings/pos`:
     - Khách thành viên đã đăng ký tài khoản (liên kết qua `userId`).
     - Khách vãng lai chơi tự do, không muốn hoặc chưa có tài khoản (lưu `guestName` và `guestPhone`).
   - Đảm bảo quy tắc **XOR tuyệt đối**: hoặc chỉ định `userId`, hoặc chỉ định cặp đôi `guestName` + `guestPhone`. Không cho phép lẫn lộn hoặc thiếu thông tin liên lạc.

2. **Quy trình xác thực có mặt tại sân (Court Check-in):**
   - Xác nhận khách chơi đã có mặt thực tế tại cơ sở qua `POST /api/v1/bookings/{id}/check-in`.
   - Ngăn chặn tình trạng check-in khống: chỉ chấp nhận các đơn đặt thuộc đúng ngày hôm nay (`bookingDate == LocalDate.now()`), trước giờ kết thúc khung giờ (`now < slot.endTime`), và đơn chưa từng check-in (`status` ∈ {`PENDING`, `CONFIRMED`} $\rightarrow$ `CHECKED_IN`).

3. **Đặt lịch định kỳ dài hạn không phân mảnh (All-or-Nothing Recurring Booking):**
   - Khách hàng thân thiết hoặc các câu lạc bộ cầu lông có nhu cầu thuê sân cố định theo tuần (ví dụ: thứ 2 hàng tuần trong 4, 8 hoặc 12 tuần).
   - Hệ thống cam kết tính toàn vẹn tuyệt đối: nếu có bất kỳ ngày nào trong chuỗi bị xung đột với khách khác, toàn bộ giao dịch lập tức bị hủy bỏ (Rollback 100%), không gây ra tình trạng đặt được nửa vời (tuần có tuần không).

---

## 2. Ba Quyết Định Thiết Kế Cốt Lõi (Key Architectural Decisions)

### 2.1. Vì sao `user` được nới lỏng thành Nullable và thêm `guestName`/`guestPhone` cho khách vãng lai thay vì ép tạo tài khoản giả (Dummy User)?
- **Tránh làm rác cơ sở dữ liệu (Anti-Database Pollution):** Nếu mỗi khách vãng lai ghé sân đột xuất đều bị hệ thống ép tạo một bản ghi `users` với mật khẩu giả và email rác (ví dụ: `guest_0912345678@system.local`), bảng `users` sẽ nhanh chóng bị phình to bởi hàng nghìn tài khoản "chết". Điều này gây suy giảm hiệu năng các truy vấn tìm kiếm người dùng và phân tích dữ liệu khách hàng.
- **Tuân thủ thực tế vận hành quầy (Real-world Reception Flow):** Tại quầy lễ tân, khách vãng lai cần vào sân ngay để chơi cầu. Thao tác yêu cầu cung cấp email, thiết lập mật khẩu và xác thực tài khoản gây tắc nghẽn quầy, tạo trải nghiệm tiêu cực. Việc chỉ yêu cầu Tên và Số điện thoại giúp lễ tân thao tác trong vài giây.
- **Bảo toàn dữ liệu kiểm toán (Audit Trail):** Việc lưu trực tiếp `guestName` và `guestPhone` vào dòng booking giúp truy vết người chơi thực tế khi có sự cố tại sân hoặc thất lạc đồ đạc mà không phụ thuộc vào vòng đời của bất kỳ user account nào.

### 2.2. Vì sao đặt tại quầy POS chuyển thẳng sang `CONFIRMED` trong khi đặt Online bắt đầu bằng `PENDING`?
- **Khác biệt về bản chất thanh toán (Payment Context):**
  - **Online Booking (Module 4):** Khách thao tác từ xa trên ứng dụng / website. Khi đặt sân, đơn hàng phải ở trạng thái **`PENDING`** để tạm giữ slot trong một khoảng thời gian chờ (Hold TTL) để khách chuyển hướng sang cổng thanh toán (VNPay / MoMo ở Module 6). Nếu quá hạn không thanh toán, job tự động sẽ giải phóng slot.
  - **POS Booking (Module 5):** Khách đang đứng trực diện tại quầy lễ tân. Nhân viên chỉ bấm xác nhận sau khi khách đã trả tiền mặt hoặc chuyển khoản QR trực tiếp tại quầy. Do đó, đơn đặt mang trạng thái **`CONFIRMED`** ngay lập tức, không qua bước chờ thanh toán cổng trực tuyến.
- **Phân tách trách nhiệm (Separation of Concerns):** Không gắn chặt luồng POS với cơ chế webhook thanh toán trực tuyến, giúp hệ thống quầy vẫn hoạt động trơn tru ngay cả khi cổng thanh toán online gặp sự cố mạng.

### 2.3. Vì sao đặt lịch cố định (Recurring) áp dụng cơ chế All-or-Nothing thay vì lưu các tuần hợp lệ (Partial Booking)?
- **Đáp ứng đúng kỳ vọng của người chơi và câu lạc bộ (User Intent):** Các câu lạc bộ cầu lông sinh hoạt định kỳ cần lịch cố định xuyên suốt (ví dụ: 12 tuần liên tục). Nếu hệ thống đặt được tuần 1, 3, 4 nhưng tuần 2 bị người khác chiếm, toàn bộ kế hoạch sinh hoạt của hội nhóm bị đổ vỡ. Người dùng sẽ phải tự đi hủy từng tuần lẻ rất phiền toái.
- **Tính nguyên tử của giao dịch (ACID Transactional Guarantee):**
  - Hệ thống thực thi khóa dòng sân mục tiêu (`findByIdForUpdate`) để tuần tự hóa việc kiểm tra.
  - Sau đó quét qua toàn bộ $N$ ngày mục tiêu.
  - Nếu phát hiện dù chỉ 1 ngày bị trùng, hệ thống chủ động ném exception `RECURRING_SLOT_CONFLICT` kèm danh sách ngày bị trùng (`conflictedDates`) trong trường `data` của `ApiResponse`. Spring `@Transactional` lập tức rollback 100%, bảo đảm không có bản ghi mồ côi nào lọt vào database.
  - Người dùng nhận được danh sách ngày bị xung đột để chủ động chọn khung giờ hoặc sân con khác phù hợp hơn.

---

## 3. Phân Tích Áp Dụng 5 Nguyên Tắc SOLID

| Nguyên tắc SOLID | Biểu hiện cụ thể trong Module 5 | Lợi ích đạt được |
|---|---|---|
| **S - Single Responsibility Principle** | - `BookingServiceImpl` phân định ranh giới rõ ràng: nghiệp vụ quầy (`createPosBooking`), nghiệp vụ sân bãi (`checkInBooking`), nghiệp vụ lịch định kỳ (`createRecurringBooking`).<br>- `BookingSecurity` chịu trách nhiệm duy nhất về xác thực quyền sở hữu đơn đặt.<br>- `GlobalExceptionHandler` chịu trách nhiệm duy nhất chuyển đổi exception thành response format chuẩn. | Code mạch lạc, cô lập hoàn toàn tác động khi nghiệp vụ từng kênh thay đổi; dễ viết unit test độc lập. |
| **O - Open/Closed Principle** | - Entity `Booking` và DTO `BookingResponse` mở rộng thêm `guestName` và `guestPhone` (nullable) mà không làm thay đổi cấu trúc của 5 endpoint Module 4 đã nghiệm thu.<br>- `AppException` được mở rộng linh hoạt với trường `data` dạng generic payload để truyền danh sách `conflictedDates` mà không phải tạo subclass exception mới. | Mở rộng tính năng không gây regression bug cho các module đang chạy ổn định. |
| **L - Liskov Substitution Principle** | - Cả đơn đặt của khách thành viên (`user != null`) và khách vãng lai (`user == null`, có `guestName`/`guestPhone`) đều thỏa mãn 100% hợp đồng dữ liệu của bảng `bookings`.<br>- Các câu lệnh tra cứu lịch trống (`findActiveBookingsByDateAndCourtIds`) và kiểm tra trùng slot (`existsActiveBooking`) xử lý đồng nhất bất kể đơn thuộc khách vãng lai hay thành viên. | Hệ thống hoạt động nhất quán, không xảy ra `NullPointerException` bất ngờ tại các luồng nghiệp vụ khác. |
| **I - Interface Segregation Principle** | - Thiết kế các Request DTO chuyên biệt cho từng tác vụ: `CreatePosBookingRequest` (cho lễ tân), `CreateRecurringBookingRequest` (cho khách đặt định kỳ), `CreateBookingRequest` (cho khách đặt lẻ online).<br>- Không gộp tất cả các trường vào một request khổng lồ chứa hàng tá trường thừa. | Client chỉ cần gửi đúng các trường cần thiết; bean validation `@Valid` hoạt động chính xác và chặt chẽ. |
| **D - Dependency Inversion Principle** | - `BookingController` chỉ phụ thuộc vào abstraction `BookingService`, không phụ thuộc vào `BookingServiceImpl`.<br>- Toàn bộ dependency được inject qua Constructor Injection (`@RequiredArgsConstructor` của Lombok), hoàn toàn không sử dụng `@Autowired` trên field. | Đảm bảo tính lỏng lẻo (loose coupling), cho phép Mockito dễ dàng inject mock trong kiểm thử đơn vị (`BookingServiceTest`). |

---

## 4. Kiểm Soát Đồng Thời & An Toàn Dữ Liệu (Concurrency Strategy)

Để chống triệt để tình trạng **Double-Booking** giữa các luồng:
1. Luồng khách online đặt sân qua web.
2. Luồng nhân viên lễ tân đặt sân tại quầy POS.
3. Luồng khách đặt lịch cố định hàng loạt qua Recurring.

Tất cả các luồng trên đều tuân thủ chung một chốt chặn bảo vệ:
```java
Court court = courtRepository.findByIdForUpdate(courtId)
        .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
```
- Khóa bi quan tầng cơ sở dữ liệu (`SELECT ... FOR UPDATE`) khóa chặt bản ghi sân con được chọn trong suốt phạm vi của `@Transactional`.
- Bất kỳ transaction nào cùng nhắm vào sân đó tại cùng thời điểm đều phải xếp hàng đợi. Khi lock được giải phóng, transaction tiếp theo sẽ thấy slot đã bị chiếm (`existsActiveBooking` trả về `true`) và ném ra HTTP 409 Conflict thay vì ghi đè dữ liệu.
- Đã được kiểm chứng bằng kiểm thử đa luồng thực tế trong `BookingConcurrencyTest.concurrentPosAndOnlineBooking_onlyOneSucceeds` (100% pass).

---

## 5. Danh Mục Thành Phần Code (Code Inventory)

```
src/main/java/com/badminton/
├── modules/booking/
│   ├── BookingController.java (Bổ sung 3 endpoints: POST /pos, POST /{id}/check-in, POST /recurring)
│   ├── dto/
│   │   ├── request/
│   │   │   ├── CreatePosBookingRequest.java (DTO đặt sân tại quầy)
│   │   │   └── CreateRecurringBookingRequest.java (DTO đặt lịch định kỳ)
│   │   └── response/
│   │       ├── BookingResponse.java (Bổ sung guestName, guestPhone)
│   │       └── RecurringBookingResponse.java (DTO trả về kết quả đặt định kỳ)
│   ├── entity/
│   │   └── Booking.java (user nullable + guestName, guestPhone)
│   ├── service/
│   │   ├── BookingService.java (Interface khai báo 3 phương thức mới)
│   │   └── impl/BookingServiceImpl.java (Triển khai 3 phương thức + guards)
│   └── security/
│       └── BookingSecurity.java (Bảo vệ an toàn chủ sở hữu booking)
└── shared/exception/
    ├── ErrorCode.java (Bổ sung INVALID_POS_REQUEST, CHECK_IN_NOT_ALLOWED, RECURRING_SLOT_CONFLICT, RECURRING_HORIZON_EXCEEDED)
    ├── AppException.java (Hỗ trợ data payload)
    └── GlobalExceptionHandler.java (Truyền data payload vào ApiResponse)
```
