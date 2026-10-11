# Architecture & Implementation Plan: Refactoring sang Package-by-Feature (Modular Monolith)

## 1. Overview
Tái cấu trúc thư mục từ mô hình kỹ thuật cũ (**Package-by-Layer**) sang mô hình hướng nghiệp vụ (**Package-by-Feature / Modular Architecture kết hợp Shared Kernel**).
Mục tiêu giải quyết triệt để vấn đề "thư mục phình to vô tận" và "nhảy file phân tán (low cohesion)" khi phát triển 9 modules của dự án "Web quản lý sân cầu lông", đồng thời thể hiện tư duy thiết kế phần mềm hiện đại (Screaming Architecture & Microservices-ready) cho portfolio tuyển dụng.

---

## 2. Cấu Trúc Thư Mục Mục Tiêu (Target Architecture)

```
com.badminton
├── shared/                                 # Hạ tầng dùng chung toàn hệ thống
│   ├── response/                           # ApiResponse, PageResponse
│   ├── entity/                             # BaseEntity
│   ├── exception/                          # ErrorCode, AppException, ResourceNotFoundException, GlobalExceptionHandler
│   ├── constant/                           # RoleConstants, RoleType, NotificationChannel, NotificationType
│   └── config/                             # OpenApiConfig, MapperConfig, CorsConfig
│
├── security/                               # Hệ thống bảo mật độc lập
│   ├── jwt/                                # JwtTokenProvider, JwtAuthenticationFilter, JwtAuthenticationEntryPoint, CustomAccessDeniedHandler
│   ├── userdetails/                        # CustomUserDetails, CustomUserDetailsService
│   └── SecurityConfig.java                 # Cấu hình SecurityFilterChain & Method Security
│
├── notification/                           # Hệ thống gửi thông báo đa kênh (Strategy Pattern)
│   ├── dto/                                # NotificationMessage
│   ├── NotificationSender.java             # Interface Strategy
│   ├── NotificationService.java            # Interface Dispatcher
│   └── impl/                               # ConsoleEmailNotificationSender, ConsoleSmsNotificationSender, NotificationServiceImpl
│
├── modules/                                # CÁC FEATURE / DOMAIN NGHIỆP VỤ ĐỘC LẬP
│   └── auth/                               # [Module 1 & 2] Authentication, Users & RBAC
│       ├── entity/                         # User, Role, RefreshToken, PasswordResetToken
│       ├── repository/                     # UserRepository, RoleRepository, RefreshTokenRepository, PasswordResetTokenRepository
│       ├── dto/                            # RegisterRequest, LoginRequest, RefreshTokenRequest, AuthResponse, UserResponse...
│       ├── mapper/                         # UserMapper, UserMapperFallbackImpl
│       ├── service/                        # AuthService, AuthServiceImpl
│       └── AuthController.java             # REST API Controller
│   │
│   ├── court/                              # [Module 3] Cụm sân, Sân con, Khung giờ, Bảng giá
│   ├── booking/                            # [Module 4 & 5] Đặt sân, Check slot trùng, Lịch cố định
│   ├── payment/                            # [Module 6] Thanh toán giả lập, Đặt cọc, Hoàn tiền
│   ├── voucher/                            # [Module 7] Khuyến mãi & Áp mã
│   └── dashboard/                          # [Module 8] Báo cáo doanh thu & Tỉ lệ lấp đầy
│
├── config/
│   └── DataSeeder.java                     # Seed dữ liệu mẫu (Roles, Admin mặc định)
└── QuanLySanCauLongApplication.java        # Class khởi động Spring Boot
```

---

## 3. Các Quyết Định Thiết Kế Cốt Lõi (Architecture Decisions)

1. **Shared Kernel (`com.badminton.shared`)**:
   - Chứa các class bất biến dùng chung cho tất cả các modules: `ApiResponse`, `BaseEntity`, `GlobalExceptionHandler`, các constant/enum toàn cục.
   - Tránh việc sao chép code giữa các module.
2. **Security & Notification Tách Riêng (Cross-Cutting Concerns)**:
   - `security`: Chịu trách nhiệm bảo vệ toàn bộ gateway của hệ thống, không bị trói buộc vào riêng module nào.
   - `notification`: Chịu trách nhiệm dispatch email/sms/push theo Strategy Pattern, được gọi bởi bất kỳ module nào (`auth`, `booking`, `payment`).
3. **Module Hoá Cao Độ (High Cohesion trong `modules/`)**:
   - Khi phát triển Module 3 (Sân) hay Module 4 (Đặt sân), toàn bộ Controller, Service, Repository, Entity, DTO chỉ nằm trong đúng folder của module đó.
   - Giảm thiểu tối đa xung đột git khi làm việc nhóm và cực kỳ dễ hiểu đối với bất kỳ AI hay developer nào đọc codebase.

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Implementation Phases)

### Phase 1: Chuẩn Bị Hạ Tầng Dùng Chung (`shared/`)
- Tạo package `com.badminton.shared` và di chuyển `ApiResponse`, `BaseEntity`, `ErrorCode`, `AppException`, `GlobalExceptionHandler`, `RoleConstants`, `RoleType`, `NotificationChannel`, `NotificationType`, `OpenApiConfig`, `MapperConfig`.

### Phase 2: Tách Biệt Phân Hệ `security` và `notification`
- Di chuyển toàn bộ các class JWT, UserDetails, SecurityConfig vào `com.badminton.security`.
- Di chuyển `NotificationService`, `NotificationSender`, `NotificationMessage` vào `com.badminton.notification`.

### Phase 3: Gom Nhóm Module 1 Vào `modules/auth`
- Tạo package `com.badminton.modules.auth`.
- Di chuyển Entity (`User`, `Role`, `RefreshToken`, `PasswordResetToken`), Repository, DTO, Mapper, Service, Controller của Auth vào đây.
- Xóa các folder tầng cũ đã rỗng (`controller/`, `dto/`, `entity/`, `repository/`, `service/`, `mapper/`, `common/`).

### Phase 4: Đồng Bộ Test, Seeder & Kiểm Thử
- Cập nhật import trong `AuthServiceTest` và `DataSeeder`.
- Chạy `mvn clean test` xác thực 100% tests pass và biên dịch thành công.

### Phase 5: Cập Nhật Tài Liệu
- Cập nhật `README.md`, `docs/architecture/architecture-and-rbac.md`, `docs/architecture/modules/module-1-auth.md` phản ánh cấu trúc thư mục mới.
