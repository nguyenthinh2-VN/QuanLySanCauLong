# NGUYÊN TẮC THIẾT KẾ SOLID & RESTFUL API TRONG DỰ ÁN

> **Mục đích tài liệu:** Hướng dẫn các AI Agent và lập trình viên hiểu rõ triết lý thiết kế (Design Philosophy), cách áp dụng thực tế bộ 5 nguyên tắc SOLID và quy chuẩn RESTful API trong toàn bộ hệ thống Backend này.

---

## 1. Nguyên Tắc Thiết Kế RESTful API (REST Compliance)

Mọi API trong hệ thống đều tuân thủ các chuẩn mực kiến trúc REST:

1. **Định danh tài nguyên danh từ số nhiều (Resource Naming):**
   - Tài nguyên gốc: `/api/v1/users`, `/api/v1/courts`, `/api/v1/bookings`.
   - Với các hành vi phi tài nguyên (Action / RPC-like), gom nhóm logic dưới context rõ ràng:
     `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh-token`.
2. **Sử dụng đúng ngữ nghĩa HTTP Verbs:**
   - `GET`: Đọc tài nguyên (An toàn, Idempotent).
   - `POST`: Tạo mới tài nguyên hoặc trigger tác vụ đặc thù (Non-idempotent). Trả về HTTP `201 Created`.
   - `PUT`: Thay thế toàn bộ tài nguyên (Idempotent).
   - `PATCH`: Cập nhật một phần trạng thái (ví dụ: đổi trạng thái `active`).
   - `DELETE`: Xóa tài nguyên (Idempotent). Trả về `200 OK` kèm thông báo hoặc `204 No Content`.
3. **Statelessness (Phi trạng thái):**
   - Server tuyệt đối không lưu HTTP Session. Trạng thái xác thực được duy trì qua Header `Authorization: Bearer <access_token>`.
4. **Phản hồi chuẩn mực (Envelope Pattern):**
   - Thành công: `{ "success": true, "message": "...", "data": ... }`
   - Thất bại: `{ "success": false, "code": "...", "message": "...", "errors": ... }`
5. **Phân trang chuẩn:**
   - Tất cả API trả về danh sách đều nhận `Pageable` (`page`, `size`, `sort`) và trả về `PageResponse<T>`.

---

## 2. Ứng Dụng Bộ 5 Nguyên Tắc SOLID Trong Thực Tế

### 2.1. S - Single Responsibility Principle (Đơn trách nhiệm)
- **Tầng Web (Controller):** `AuthController`, `CourtController`, `BookingController`. Mỗi controller chỉ làm nhiệm vụ nhận request, kiểm tra cú pháp (`@Valid`), gọi Service tương ứng và bọc DTO vào `ApiResponse`. Tuyệt đối không chứa logic tính toán tiền nong hay truy vấn DB.
- **Tầng Nghiệp vụ (Service):** Tách bạch rõ ranh giới nghiệp vụ:
  - `AuthService`: Chỉ lo xác thực, cấp phát token, quên mật khẩu.
  - `NotificationService`: Chỉ lo điều phối thông điệp.
  - `CourtService`: Chỉ quản lý cụm sân, sân con và slot hoạt động.
- **Tầng Lưu trữ (Repository):** Chỉ đảm nhận truy vấn dữ liệu từ bảng được gán.

### 2.2. O - Open-Closed Principle (Đóng để sửa đổi, Mở để mở rộng)
Hệ thống tận dụng **Strategy Pattern** và tính năng tự động Dependency Injection của Spring IoC để mở rộng tính năng mới mà không sửa code cũ:

#### Trường hợp điển hình: Hệ thống Notification (Push / Email / SMS)
```
┌─────────────────────────────────┐
│       NotificationService       │ (Interface điều phối)
└────────────────┬────────────────┘
                 │ injects List<NotificationSender>
                 ▼
┌─────────────────────────────────┐
│       NotificationSender        │ (Interface Strategy)
│ - boolean supports(channel)     │
│ - void send(message)            │
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌───────────────────────────┐
│ ConsoleEmail │   │  ConsoleSms  │   │ [Mở rộng trong tương lai] │
│ Sender       │   │  Sender      │   │ JavaMailSender / Twilio   │
└──────────────┘   └──────────────┘   │ Firebase Push Sender      │
                                      └───────────────────────────┘
```
- Khi cần tích hợp **JavaMailSender** gửi mail thật hoặc **Twilio SMS**:
  - Chỉ cần tạo class mới: `public class SmtpEmailNotificationSender implements NotificationSender { ... }` gắn `@Component`.
  - Spring sẽ tự động nạp bean này vào `List<NotificationSender>`.
  - Toàn bộ code trong `AuthServiceImpl` và `NotificationServiceImpl` **hoàn toàn đóng (Closed)**, không cần sửa đổi dù chỉ 1 dòng!

### 2.3. L - Liskov Substitution Principle (Thay thế Liskov)
- Mọi implementation của `NotificationSender` (`ConsoleEmailNotificationSender`, `ConsoleSmsNotificationSender`) đều có thể thay thế cho nhau hoàn hảo trong vòng lặp điều phối của `NotificationServiceImpl` mà không gây ra ngoại lệ hay hành vi bất thường.

### 2.4. I - Interface Segregation Principle (Phân tách Interface)
- Interface được giữ tinh gọn, chỉ khai báo đúng những gì Client cần:
  - `NotificationSender` chỉ gồm 2 hàm: `supports(channel)` và `send(message)`.
  - Không ép các sender phải triển khai những phương thức rườm rà như cấu hình template HTML hay cấu hình cổng mạng nếu chúng không cần.

### 2.5. D - Dependency Inversion Principle (Đảo ngược phụ thuộc)
- **Luôn phụ thuộc vào Abstraction (Interface), không phụ thuộc vào Concretion (Class cụ thể):**
  - `AuthController` phụ thuộc vào `AuthService` (Interface), không phụ thuộc vào `AuthServiceImpl`.
  - `AuthServiceImpl` phụ thuộc vào `NotificationService` (Interface), không phụ thuộc vào `ConsoleEmailNotificationSender`.
  - `AuthServiceImpl` phụ thuộc vào `PasswordEncoder` (Interface của Spring Security), không phụ thuộc vào `BCryptPasswordEncoder`.
- **Constructor Injection:**
  - 100% dependency được tiêm qua Constructor (kết hợp Lombok `@RequiredArgsConstructor`).
  - **Nghiêm cấm** sử dụng `@Autowired` trực tiếp trên field (Field Injection) vì vi phạm nguyên tắc đóng gói và gây khó khăn khi viết Unit Test.
