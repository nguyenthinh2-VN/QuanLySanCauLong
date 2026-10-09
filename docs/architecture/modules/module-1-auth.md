# CHI TIẾT MODULE 1: AUTHENTICATION & PHÂN QUYỀN RBAC

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Xác thực người dùng, cấp phát JWT, Refresh Token Rotation, Quên mật khẩu và Thông báo đẩy.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problem Solved)

1. **Bảo mật phiên đăng nhập không lưu trạng thái (Stateless JWT):**
   - Access Token có hạn ngắn (15 phút) mang theo claims nhận dạng (`userId`, `roles`, `fullName`) giúp server không phải query database mỗi khi kiểm tra quyền.
2. **Khắc phục nhược điểm "không thể thu hồi" của JWT (Token Revocation & Rotation):**
   - JWT truyền thống sau khi phát hành thì không thể thu hồi trước hạn.
   - Hệ thống giải quyết bằng **Refresh Token Rotation**: Refresh Token (hạn 7 ngày) được lưu trong bảng `refresh_tokens`. Mỗi lần client xin cấp lại access token, refresh token cũ bị thu hồi ngay lập tức (`revoked = true`) và cấp refresh token mới. Nếu token bị rò rỉ, phiên đăng nhập có thể bị Admin hoặc User thu hồi tức thì.
3. **Cơ chế Quên Mật Khẩu an toàn (Password Reset OTP):**
   - Sinh mã token ngẫu nhiên UUID lưu trong bảng `password_reset_tokens` có hiệu lực đúng 15 phút, chỉ dùng được 1 lần (`used = true`).
   - Sau khi đổi mật khẩu thành công, toàn bộ refresh token hiện có của user bị thu hồi cưỡng chế để ngăn kẻ gian tiếp tục sử dụng phiên cũ.
4. **Phân quyền đa vai trò (RBAC):**
   - Một người dùng có thể đồng thời sở hữu nhiều vai trò (ví dụ: vừa là STAFF vừa là CUSTOMER) thông qua liên kết Many-to-Many `user_roles`.

---

## 2. Cấu Trúc Các Thành Phần Code (Code Inventory)

```
com.badminton
├── entity/
│   ├── User.java                   # Thông tin người dùng, liên kết Many-to-Many với Role
│   ├── Role.java                   # Vai trò hệ thống (ROLE_ADMIN, ROLE_STAFF, ROLE_CUSTOMER)
│   ├── RefreshToken.java           # Token làm mới (quản lý expiryDate, revoked)
│   └── PasswordResetToken.java     # Token quên mật khẩu (quản lý expiryDate, used)
├── repository/
│   ├── UserRepository.java         # Query theo email, phone, check tồn tại
│   ├── RoleRepository.java         # Query theo RoleType enum
│   ├── RefreshTokenRepository.java # Tìm token, revokeAllUserTokens
│   └── PasswordResetTokenRepository.java # Tìm token hợp lệ chưa dùng
├── dto/
│   ├── request/                    # RegisterRequest, LoginRequest, RefreshTokenRequest, ...
│   └── response/                   # AuthResponse, UserResponse
├── mapper/
│   └── UserMapper.java             # MapStruct: chuyển User <-> UserResponse, ẩn mật khẩu
├── security/
│   ├── JwtTokenProvider.java       # Ký HMAC-SHA256, sinh và kiểm tra JWT token
│   ├── JwtAuthenticationFilter.java# Chặn request, trích xuất Bearer token, gán SecurityContext
│   ├── CustomUserDetails.java      # Hiện thực UserDetails của Spring Security
│   ├── CustomUserDetailsService.java # Nạp User từ database theo email
│   ├── JwtAuthenticationEntryPoint.java # Trả JSON chuẩn ApiResponse khi 401 Unauthorized
│   └── CustomAccessDeniedHandler.java   # Trả JSON chuẩn ApiResponse khi 403 Forbidden
├── service/
│   ├── AuthService.java            # Interface nghiệp vụ xác thực
│   ├── impl/AuthServiceImpl.java   # Triển khai nghiệp vụ (Transaction, Hash mật khẩu, Token rotation)
│   └── notification/               # Hệ thống thông báo phân tầng (Notification Subsystem)
│       ├── NotificationSender.java # Strategy Interface (supports, send)
│       ├── NotificationService.java# High-level dispatcher interface
│       └── impl/                   # ConsoleEmailSender, ConsoleSmsSender, NotificationServiceImpl
└── controller/
    └── AuthController.java         # REST Controller, bọc ApiResponse<T>, tích hợp Swagger OpenAPI
```

---

## 3. Phân Tích Áp Dụng SOLID Trong Module 1

Module 1 áp dụng trọn vẹn **5/5 nguyên tắc SOLID**:

| Nguyên tắc | Mức độ áp dụng | Vị trí áp dụng cụ thể trong Module 1 |
|---|:---:|---|
| **S - Single Responsibility** | ✅ Tuyệt đối | Phân tách ranh giới rõ ràng: Controller chỉ lo HTTP & Validation; Service chỉ lo Business Logic; JwtTokenProvider chỉ lo mã hóa JWT; NotificationService chỉ lo điều phối tin nhắn. |
| **O - Open-Closed** | ✅ Tuyệt đối | **Strategy Pattern** ở `NotificationSender`: Thêm kênh gửi Email thật (SMTP), gửi SMS (Twilio) hay Push Notification (Firebase) chỉ cần tạo class mới implements `NotificationSender`, không sửa 1 dòng code nào trong `AuthServiceImpl`. |
| **L - Liskov Substitution** | ✅ Tuyệt đối | `ConsoleEmailNotificationSender` và `ConsoleSmsNotificationSender` có thể thay thế hoàn hảo cho `NotificationSender` mà không làm thay đổi tính đúng đắn của `NotificationServiceImpl`. |
| **I - Interface Segregation** | ✅ Tuyệt đối | `NotificationSender` chỉ có đúng 2 hàm tinh gọn: `supports(channel)` và `send(message)`. Không ép triển khai các phương thức dư thừa. |
| **D - Dependency Inversion** | ✅ Tuyệt đối | `AuthServiceImpl` phụ thuộc vào các Interface trừu tượng (`AuthService`, `NotificationService`, `PasswordEncoder`, `UserMapper`), không phụ thuộc vào implementation cụ thể. 100% dùng Constructor Injection, cấm `@Autowired` trên field. |

---

## 4. Dẫn Chứng Code Minh Họa SOLID Trong Module 1

### Dẫn chứng OCP & DIP (Open-Closed & Dependency Inversion)
Trong `AuthServiceImpl.java`:
```java
// DIP: Phụ thuộc vào interface NotificationService, không phụ thuộc vào ConsoleEmail hay JavaMailSender
private final NotificationService notificationService;

@Override
@Transactional
public void forgotPassword(ForgotPasswordRequest request) {
    // ... tạo reset token ...
    
    // Gửi thông báo: Caller không cần quan tâm tin nhắn được gửi bằng SMTP, SMS hay Push Notification
    NotificationMessage resetNotification = NotificationMessage.builder()
            .recipient(user.getEmail())
            .subject("Yêu cầu đặt lại mật khẩu")
            .channel(NotificationChannel.EMAIL)
            .type(NotificationType.PASSWORD_RESET)
            .content("Mã OTP của bạn: " + tokenString)
            .build();

    notificationService.send(resetNotification);
}
```

Trong `NotificationServiceImpl.java`:
```java
// OCP: Tự động gom toàn bộ bean triển khai NotificationSender của Spring IoC container
private final List<NotificationSender> senders;

@Override
public void send(NotificationMessage message) {
    for (NotificationSender sender : senders) {
        if (sender.supports(message.getChannel())) {
            sender.send(message);
        }
    }
}
```
Khi muốn thêm gửi mail qua SendGrid:
```java
@Component
public class SendGridEmailNotificationSender implements NotificationSender {
    @Override
    public boolean supports(NotificationChannel channel) {
        return NotificationChannel.EMAIL.equals(channel);
    }

    @Override
    public void send(NotificationMessage message) {
        // Gọi SendGrid API ở đây
    }
}
```
👉 `AuthServiceImpl` và `NotificationServiceImpl` giữ nguyên 100%, không cần chạm vào code cũ.
