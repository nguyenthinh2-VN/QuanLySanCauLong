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
│   ├── util/                               # SortUtils
│   └── config/                             # OpenApiConfig, CorsConfig
│
├── security/                               # Phân hệ Bảo Mật Độc Lập (Cross-Cutting Concern)
│   ├── jwt/                                # JwtTokenProvider, JwtAuthenticationFilter, EntryPoint
│   ├── userdetails/                        # CustomUserDetails, CustomUserDetailsService
│   ├── SecurityUtils.java                  # Tiện ích trích xuất Principal & User ID
│   └── SecurityConfig.java                 # Cấu hình SecurityFilterChain & Method Security
│
├── notification/                           # Phân hệ Thông Báo Đa Kênh (Strategy Pattern)
│   ├── dto/                                # NotificationMessage
│   ├── NotificationSender.java             # Interface Strategy (Open-Closed Principle)
│   ├── NotificationService.java            # Interface Dispatcher (Dependency Inversion)
│   └── impl/                               # ConsoleEmailSender, ConsoleSmsSender, NotificationServiceImpl
│
├── modules/                                # CÁC FEATURE / DOMAIN NGHIỆP VỤ ĐỘC LẬP
│   ├── auth/                               # [Module 1 & 2] Authentication, Users & RBAC
│   │   ├── entity/                         # User, Role, RefreshToken, PasswordResetToken
│   │   ├── repository/                     # UserRepository, RoleRepository...
│   │   ├── dto/                            # Request & Response DTOs
│   │   ├── mapper/                         # UserMapper (MapStruct)
│   │   ├── service/                        # AuthService, UserService...
│   │   ├── AuthController.java             # REST API Controller
│   │   └── AdminUserController.java        # REST API Controller
│   │
│   ├── court/                              # [Module 3] Cụm sân, Sân con, Khung giờ & Bảng giá
│   │   ├── entity/                         # CourtComplex, Court, TimeSlot...
│   │   ├── repository/                     # CourtComplexRepository, CourtRepository, TimeSlotRepository
│   │   ├── dto/                            # Request & Response DTOs
│   │   ├── mapper/                         # CourtComplexMapper, CourtMapper, TimeSlotMapper
│   │   ├── service/                        # CourtComplexService, CourtService, TimeSlotService
│   │   ├── CourtComplexController.java     # REST API Controller
│   │   ├── CourtController.java            # REST API Controller
│   │   └── TimeSlotController.java         # REST API Controller
│   │
│   ├── booking/                            # [Module 4 & 5] Đặt sân online, POS quầy, Check-in, Lịch định kỳ
│   │   ├── entity/                         # Booking, BookingStatus, SlotStatus
│   │   ├── repository/                     # BookingRepository (kèm Pessimistic Lock)
│   │   ├── dto/                            # Request & Response DTOs
│   │   ├── mapper/                         # BookingMapper
│   │   ├── service/                        # BookingService, BookingServiceImpl
│   │   ├── security/                       # BookingSecurity
│   │   └── BookingController.java          # REST API Controller
│   │
│   ├── payment/                            # [Module 6] Thanh toán mô phỏng, Đặt cọc, Hoàn tiền & Chống Double-Charge
│   │   ├── entity/                         # Payment, PaymentType, PaymentMethod, PaymentStatus
│   │   ├── repository/                     # PaymentRepository (kèm Pessimistic Lock)
│   │   ├── gateway/                        # PaymentGateway, ChargeResult, MockPaymentGateway
│   │   ├── dto/                            # Request & Response DTOs
│   │   ├── mapper/                         # PaymentMapper
│   │   ├── service/                        # PaymentService, PaymentServiceImpl
│   │   └── PaymentController.java          # REST API Controller
│   │
│   ├── voucher/                            # [Module 7] Khuyến mãi & Quản lý Voucher (Sắp triển khai)
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
- Bảng phân quyền chi tiết cho toàn bộ các API hiện tại và tương lai (Auth, Users, Courts, Bookings, Payments, Vouchers, Dashboard).
- Quy chuẩn Method-Level Security bằng `@PreAuthorize("hasRole(...)")` với hằng số `RoleConstants` hoặc SpEL kiểm tra chủ sở hữu `@bookingSecurity.isOwner(#id)`.

### 📌 2. Triết Lý Thiết Kế SOLID & Chuẩn RESTful API
👉 **Đọc tại:** [`docs/architecture/solid-design-principles.md`](solid-design-principles.md)
- Quy chuẩn thiết kế RESTful (Resource-oriented URI, HTTP Verbs, Stateless, Status Codes).
- Cách áp dụng thực tế bộ 5 nguyên tắc SOLID trong toàn hệ thống.
- Thiết kế mở rộng **Strategy Pattern** cho hệ thống Notification (sẵn sàng tích hợp SMTP Email, Twilio SMS, Firebase Push mà không sửa code cũ).

### 📌 3. Tài Liệu Chi Tiết Từng Module (Modules Deep-Dive)
Mỗi module đều có một tài liệu phân tích riêng biệt (bài toán giải quyết, cấu trúc code, phân tích chi tiết mức độ áp dụng SOLID):
- 📘 **Module 1 (Auth & RBAC):** [`docs/architecture/modules/module-1-auth.md`](modules/module-1-auth.md) *(Đã hoàn thành - Áp dụng trọn vẹn 5/5 nguyên tắc SOLID)*.
- 📘 **Module 2 (User Management & Role Assignment):** [`docs/architecture/modules/module-2-user-management.md`](modules/module-2-user-management.md) *(Đã hoàn thành - Quản lý người dùng & 4 Guards bảo vệ Admin)*.
- 📘 **Module 3 (Courts, TimeSlots & Pricing):** [`docs/architecture/modules/module-3-courts.md`](modules/module-3-courts.md) *(Đã hoàn thành - Cụm sân, Sân con, Khung giờ & Bảng giá chuẩn)*.
- 📘 **Module 4 (Bookings & Concurrency Control):** [`docs/architecture/modules/module-4-bookings.md`](modules/module-4-bookings.md) *(Đã hoàn thành - Đặt sân online & Pessimistic Lock chống double-booking)*.
- 📘 **Module 5 (Court Operations - POS, Check-in & Recurring):** [`docs/architecture/modules/module-5-bookings-pos.md`](modules/module-5-bookings-pos.md) *(Đã hoàn thành - Vận hành quầy POS, Check-in & Đặt cố định All-or-Nothing)*.
- 📘 **Module 6 (Payments & Refunds):** [`docs/architecture/modules/module-6-payments.md`](modules/module-6-payments.md) *(Đã hoàn thành - Mock Gateway, Pessimistic Lock chống double-charge & Hoàn tiền tự động hủy lịch)*.

### 📌 4. Tài Liệu Tích Hợp API Cho Frontend
- 👉 Module 1 (Auth & RBAC): [`docs/api/module-1-auth-rbac.md`](../api/module-1-auth-rbac.md)
- 👉 Module 2 (User Management): [`docs/api/module-2-user-management.md`](../api/module-2-user-management.md)
- 👉 Module 3 (Courts & TimeSlots): [`docs/api/module-3-courts.md`](../api/module-3-courts.md)
- 👉 Module 4 (Bookings Online): [`docs/api/module-4-bookings.md`](../api/module-4-bookings.md)
- 👉 Module 5 (Court Operations & POS): [`docs/api/module-5-bookings-pos.md`](../api/module-5-bookings-pos.md)
- 👉 Module 6 (Payments & Refunds): [`docs/api/module-6-payments.md`](../api/module-6-payments.md)

---

## 3. Hướng Dẫn Dành Cho AI Agent Khi Tiếp Quản Codebase

Nếu bạn là một AI Agent đang tiếp nhận dự án này:
1. **Luôn tuân thủ nguyên tắc Dependency Inversion:** Mọi Service injection phải qua constructor (dùng `@RequiredArgsConstructor`), tuyệt đối không dùng `@Autowired` trên field.
2. **Không để lộ JPA Entity ra ngoài API:** Controller chỉ được phép nhận và trả về DTO. Sử dụng MapStruct (nằm trong thư mục `mapper/` của từng feature package) để chuyển đổi.
3. **Mọi phản hồi API đều bọc qua `ApiResponse<T>`:** Không bao giờ trả raw Object hoặc raw ResponseEntity không có cấu trúc chuẩn; danh sách phân trang dùng `PageResponse<T>`.
4. **Khi thêm tính năng mới:** Kiểm tra ma trận quyền tại [`rbac-matrix.md`](rbac-matrix.md) để gắn `@PreAuthorize` tương ứng trên Controller.
5. **Sort ở các endpoint phân trang:** Bắt buộc validate qua `SortUtils.parseSort` với whitelist các trường cho phép, ngăn chặn lỗi 500 do client truyền field lạ.
