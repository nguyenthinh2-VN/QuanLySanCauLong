# TỔNG QUAN KIẾN TRÚC DỰ ÁN & CHỈ MỤC TÀI LIỆU (ARCHITECTURE HUB)

> **Dành cho:** AI Coding Agents và Software Engineers tham gia phát triển dự án.  
> **Mục tiêu:** Cung cấp bức tranh toàn cảnh về kiến trúc hệ thống backend "Web Quản Lý Sân Cầu Lông" và định hướng tra cứu chi tiết từng phần.

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (Package-by-Feature Architecture)

Hệ thống được tổ chức theo mô hình **Package-by-Feature** kết hợp phân tầng nội bộ chặt chẽ dưới base package `com.badminton`. Cách tổ chức này giúp mã nguồn đạt tính gắn kết cao (High Cohesion), giảm thiểu phụ thuộc chéo (Low Coupling) và dễ dàng mở rộng theo từng module nghiệp vụ:

```
src/main/java/com/badminton/
├── modules/                                # Các miền nghiệp vụ độc lập (Feature Modules)
│   ├── auth/                               # Module 1 & 2: Xác thực, JWT, Phân quyền & Quản lý User
│   │   ├── AuthController.java
│   │   ├── AdminUserController.java
│   │   ├── entity/ (User, Role, RefreshToken, PasswordResetToken)
│   │   ├── repository/ (UserRepository, RoleRepository, ...)
│   │   ├── service/ (AuthService, UserService, ...)
│   │   ├── dto/ (request/, response/)
│   │   └── mapper/ (UserMapper)
│   ├── court/                              # Module 3: Cụm sân, Sân con & Khung giờ bảng giá
│   │   ├── CourtComplexController.java
│   │   ├── CourtController.java
│   │   ├── TimeSlotController.java
│   │   ├── entity/ (CourtComplex, Court, TimeSlot, ComplexStatus, CourtStatus)
│   │   ├── repository/ (CourtComplexRepository, CourtRepository, TimeSlotRepository)
│   │   ├── service/ (CourtComplexService, CourtService, TimeSlotService)
│   │   ├── dto/ (request/, response/)
│   │   └── mapper/ (CourtComplexMapper, CourtMapper, TimeSlotMapper)
│   ├── booking/                            # Module 4 & 5: Đặt sân online & Vận hành quầy POS
│   │   ├── BookingController.java
│   │   ├── entity/ (Booking, BookingStatus, SlotStatus)
│   │   ├── repository/ (BookingRepository)
│   │   ├── service/ (BookingService, BookingServiceImpl)
│   │   ├── security/ (BookingSecurity)
│   │   ├── dto/ (request/, response/)
│   │   └── mapper/ (BookingMapper)
│   └── payment/                            # Module 6: Thanh toán mô phỏng & Hoàn tiền
│       ├── PaymentController.java
│       ├── entity/ (Payment, PaymentType, PaymentMethod, PaymentStatus)
│       ├── repository/ (PaymentRepository)
│       ├── gateway/ (PaymentGateway, ChargeResult, MockPaymentGateway)
│       ├── service/ (PaymentService, PaymentServiceImpl)
│       ├── dto/ (request/, response/)
│       └── mapper/ (PaymentMapper)
├── security/                               # Cấu hình bảo mật, Bộ lọc JWT & Context Provider
├── SecurityConfig.java
│   ├── SecurityUtils.java
│   ├── jwt/ (JwtTokenProvider, JwtAuthenticationFilter, ...)
│   └── userdetails/ (CustomUserDetails, CustomUserDetailsService)
└── shared/                                 # Các thành phần tái sử dụng xuyên suốt hệ thống
    ├── constant/ (RoleConstants, RoleType)
    ├── exception/ (ErrorCode, AppException, GlobalExceptionHandler)
    ├── response/ (ApiResponse, PageResponse)
    ├── entity/ (BaseEntity)
    ├── config/ (OpenApiConfig, CorsConfig)
    └── util/ (SortUtils)
```

### Luồng xử lý một Request (Request Lifecycle):
1. **Client / Web Frontend:** Gửi HTTP Request (JSON) kèm JWT Bearer Token trong header.
2. **Security Filter:** `JwtAuthenticationFilter` giải mã token, nạp Principal `CustomUserDetails` vào `SecurityContext`.
3. **Controller (`modules.<feature>.*Controller`):** Nhận request, thực thi bean validation (`@Valid`), áp dụng method security (`@PreAuthorize`) và gọi interface Service. Controller chỉ trả về `ApiResponse<DTO>`, tuyệt đối không xử lý business logic nặng.
4. **Service (`modules.<feature>.service`):** Chứa 100% nghiệp vụ, quản lý ranh giới giao dịch (`@Transactional`), thực thi các guards an toàn và gọi MapStruct Mapper để chuyển đổi Entity <-> DTO.
5. **Repository (`modules.<feature>.repository`):** Giao tiếp với MySQL thông qua Spring Data JPA & Hibernate, tối ưu hóa câu lệnh bằng JPQL và Specification.

---

## 2. Chỉ Mục Tài Liệu Chi Tiết (Quick Links Cho AI & Developers)

Để tránh tài liệu quá dài và dễ dàng mở rộng khi phát triển thêm các module tiếp theo, tài liệu kiến trúc được tách thành các phần chuyên biệt sau:

### 📌 1. Ma Trận Phân Quyền Chi Tiết (RBAC Matrix)
👉 **Đọc tại:** [`docs/architecture/rbac-matrix.md`](rbac-matrix.md)
- Bảng danh mục các vai trò: `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
- Bảng phân quyền chi tiết cho toàn bộ các API hiện tại và tương lai (Auth, Users, Courts, Bookings, Payments, Dashboard).
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
- 📘 **Module 6 (Payments & Refunds):** [`docs/architecture/modules/module-6-payments.md`](modules/module-6-payments.md) *(Đã hoàn thành - Mock Gateway, Thanh toán Server-side & Hoàn tiền tự động hủy lịch)*.

### 📌 4. Tài Liệu Tích Hợp API Cho Frontend
- 👉 Module 1 (Auth): [`docs/api/module-1-auth-rbac.md`](../api/module-1-auth-rbac.md)
- 👉 Module 3 (Courts & TimeSlots): [`docs/api/module-3-courts.md`](../api/module-3-courts.md)
- 👉 Module 4 (Bookings Online): [`docs/api/module-4-bookings.md`](../api/module-4-bookings.md)
- 👉 Module 5 (Court Operations & POS): [`docs/api/module-5-bookings-pos.md`](../api/module-5-bookings-pos.md)
- 👉 Module 6 (Payments & Refunds): [`docs/api/module-6-payments.md`](../api/module-6-payments.md)

---

## 3. Hướng Dẫn Dành Cho AI Agent Khi Tiếp Quản Codebase

Nếu bạn là một AI Agent đang tiếp nhận dự án này:
1. **Luôn tuân thủ nguyên tắc Dependency Inversion:** Mọi Service injection phải qua constructor (dùng `@RequiredArgsConstructor`), tuyệt đối không dùng `@Autowired` trên field.
2. **Không để lộ JPA Entity ra ngoài API:** Controller chỉ được phép nhận và trả về DTO. Sử dụng MapStruct (trong package mapper của từng feature module) để chuyển đổi.
3. **Mọi phản hồi API đều bọc qua `ApiResponse<T>`:** Không bao giờ trả raw Object hoặc raw ResponseEntity không có cấu trúc chuẩn; danh sách phân trang dùng `PageResponse<T>`.
4. **Khi thêm tính năng mới:** Kiểm tra ma trận quyền tại [`rbac-matrix.md`](rbac-matrix.md) để gắn `@PreAuthorize` tương ứng trên Controller.
5. **Sort ở các endpoint phân trang:** Bắt buộc validate qua `SortUtils.parseSort` với whitelist các trường cho phép, ngăn chặn lỗi 500 do client truyền field lạ.
