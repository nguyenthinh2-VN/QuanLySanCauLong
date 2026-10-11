# TỔNG QUAN KIẾN TRÚC DỰ ÁN & CHỈ MỤC TÀI LIỆU (ARCHITECTURE HUB)

> **Dành cho:** AI Coding Agents và Software Engineers tham gia phát triển dự án.  
> **Mục tiêu:** Cung cấp bức tranh toàn cảnh về kiến trúc hệ thống backend "Web Quản Lý Sân Cầu Lông" và định hướng tra cứu chi tiết từng phần.

---

## 1. Sơ Đồ Kiến Trúc Package-by-Feature (Modular Monolith)

Hệ thống được tổ chức theo kiến trúc **Package-by-Feature (Modular Monolith kết hợp Shared Kernel)** dưới package `com.badminton`:

```
com.badminton
├── shared/                                 # Shared Kernel (Hạ tầng dùng chung toàn hệ thống)
│   ├── response/                           # ApiResponse chuẩn hóa cho toàn bộ REST API
│   ├── entity/                             # BaseEntity (Auditing createdAt, updatedAt)
│   ├── exception/                          # GlobalExceptionHandler, AppException, ErrorCode
│   ├── constant/                           # RoleConstants, RoleType, NotificationChannel...
│   └── config/                             # OpenApiConfig
│
├── security/                               # Phân hệ Bảo Mật Độc Lập (Cross-Cutting Concern)
│   ├── jwt/                                # JwtTokenProvider, JwtAuthenticationFilter, EntryPoint
│   ├── userdetails/                        # CustomUserDetails, CustomUserDetailsService
│   └── SecurityConfig.java                 # Cấu hình SecurityFilterChain & Method Security
│
├── notification/                           # Phân hệ Thông Báo Đa Kênh (Strategy Pattern)
│   ├── dto/                                # NotificationMessage
│   ├── NotificationSender.java             # Interface Strategy (Open-Closed Principle)
│   ├── NotificationService.java            # Interface Dispatcher (Dependency Inversion)
│   └── impl/                               # ConsoleEmailSender, ConsoleSmsSender, NotificationServiceImpl
│
├── modules/                                # CÁC FEATURE / DOMAIN NGHIỆP VỤ ĐỘC LẬP
│   └── auth/                               # [Module 1 & 2] Authentication, Users & RBAC
│       ├── entity/                         # User, Role, RefreshToken, PasswordResetToken
│       ├── repository/                     # UserRepository, RoleRepository...
│       ├── dto/                            # Request & Response DTOs
│       ├── mapper/                         # UserMapper (MapStruct) & Fallback
│       ├── service/                        # AuthService & AuthServiceImpl
│       └── AuthController.java             # REST API Controller
│   │
│   ├── court/                              # [Module 3] Cụm sân, Sân con, Khung giờ, Bảng giá
│   ├── booking/                            # [Module 4 & 5] Đặt sân, Check slot trùng, Lịch cố định
│   ├── payment/                            # [Module 6] Thanh toán giả lập, Đặt cọc, Hoàn tiền
│   ├── voucher/                            # [Module 7] Khuyến mãi & Áp mã
│   └── dashboard/                          # [Module 8] Báo cáo doanh thu & Tỉ lệ lấp đầy
│
├── config/
│   └── DataSeeder.java                     # Khởi tạo dữ liệu mẫu (Roles & Default Admin)
└── QuanLySanCauLongApplication.java        # Main Application Class
```

---

## 2. Chỉ Mục Tài Liệu Chi Tiết (Quick Links Cho AI & Developers)

Để tránh tài liệu quá dài và dễ dàng mở rộng khi phát triển thêm các module tiếp theo, tài liệu kiến trúc được tách thành các phần chuyên biệt sau:

### 📌 1. Ma Trận Phân Quyền Chi Tiết (RBAC Matrix)
👉 **Đọc tại:** [`docs/architecture/rbac-matrix.md`](rbac-matrix.md)
- Bảng danh mục các vai trò: `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
- Bảng phân quyền chi tiết cho toàn bộ các API hiện tại và tương lai (Auth, Users, Courts, Bookings, Payments, Dashboard).
- Quy chuẩn Method-Level Security bằng `@PreAuthorize("hasRole(...)")` với hằng số `RoleConstants`.

### 📌 2. Triết Lý Thiết Kế SOLID & Chuẩn RESTful API
👉 **Đọc tại:** [`docs/architecture/solid-design-principles.md`](solid-design-principles.md)
- Quy chuẩn thiết kế RESTful (Resource-oriented URI, HTTP Verbs, Stateless, Status Codes).
- Cách áp dụng thực tế bộ 5 nguyên tắc SOLID trong toàn hệ thống.
- Thiết kế mở rộng **Strategy Pattern** cho hệ thống Notification (sẵn sàng tích hợp SMTP Email, Twilio SMS, Firebase Push mà không sửa code cũ).

### 📌 3. Tài Liệu Chi Tiết Từng Module (Modules Deep-Dive)
Mỗi module đều có một tài liệu phân tích riêng biệt (bài toán giải quyết, cấu trúc code, phân tích chi tiết mức độ áp dụng SOLID):
- 📘 **Module 1 (Auth & RBAC):** [`docs/architecture/modules/module-1-auth.md`](modules/module-1-auth.md) *(Áp dụng trọn vẹn 5/5 nguyên tắc SOLID)*.
- 📘 **Module 2 (User Management & Role Assignment):** *(Sẽ tạo khi thực hiện Module 2)*.
- 📘 **Module 3 (Courts, TimeSlots & Pricing):** *(Sẽ tạo khi thực hiện Module 3)*.
- 📘 **Module 4 (Bookings & Concurrency Control):** *(Sẽ tạo khi thực hiện Module 4)*.

### 📌 4. Tài Liệu Tích Hợp API Cho Frontend
👉 **Đọc tại:** [`docs/api/module-1-auth-rbac.md`](../api/module-1-auth-rbac.md)
- Hướng dẫn Request body, URL, Response format và mẫu cấu hình Axios Interceptor cho Frontend Developer.

---

## 3. Hướng Dẫn Dành Cho AI Agent Khi Tiếp Quản Codebase

Nếu bạn là một AI Agent đang tiếp nhận dự án này:
1. **Luôn tuân thủ nguyên tắc Dependency Inversion:** Mọi Service injection phải qua constructor (dùng `@RequiredArgsConstructor`), tuyệt đối không dùng `@Autowired` trên field.
2. **Không để lộ JPA Entity ra ngoài API:** Controller chỉ được phép nhận và trả về DTO. Sử dụng MapStruct (`com.badminton.mapper`) để chuyển đổi.
3. **Mọi phản hồi API đều bọc qua `ApiResponse<T>`:** Không bao giờ trả raw Object hoặc raw ResponseEntity không có cấu trúc chuẩn.
4. **Khi thêm tính năng mới:** Kiểm tra ma trận quyền tại [`rbac-matrix.md`](rbac-matrix.md) để gắn `@PreAuthorize` tương ứng trên Controller.
