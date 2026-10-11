# Tasks Checklist: Refactor Codebase sang Package-by-Feature

## Task 1: Migrate Shared Kernel Infrastructure
**Description:** Tạo cấu trúc thư mục `com.badminton.shared` và di chuyển các thành phần dùng chung toàn hệ thống bao gồm: Response (`ApiResponse`), Entity (`BaseEntity`), Exception (`ErrorCode`, `AppException`, `ResourceNotFoundException`, `BadRequestException`, `GlobalExceptionHandler`), Constants & Enums (`RoleConstants`, `RoleType`, `NotificationChannel`, `NotificationType`), Configurations (`OpenApiConfig`, `MapperConfig`).

**Acceptance criteria:**
- [x] Thư mục `com.badminton.shared` được tạo với các package con: `response`, `entity`, `exception`, `constant`, `config`.
- [x] Tất cả package declaration và import của các file dùng chung được cập nhật chuẩn xác.
- [x] Các lớp dùng chung không còn nằm phân tán trong `common/`, `exception/`, `config/`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** None

**Files likely touched:**
- `src/main/java/com/badminton/shared/response/ApiResponse.java`
- `src/main/java/com/badminton/shared/entity/BaseEntity.java`
- `src/main/java/com/badminton/shared/constant/RoleConstants.java`
- `src/main/java/com/badminton/shared/constant/RoleType.java`
- `src/main/java/com/badminton/shared/constant/NotificationChannel.java`
- `src/main/java/com/badminton/shared/constant/NotificationType.java`
- `src/main/java/com/badminton/shared/exception/ErrorCode.java`
- `src/main/java/com/badminton/shared/exception/AppException.java`
- `src/main/java/com/badminton/shared/exception/GlobalExceptionHandler.java`
- `src/main/java/com/badminton/shared/config/OpenApiConfig.java`

**Estimated scope:** Medium: 10 files

---

## Task 2: Reorganize Security Subsystem
**Description:** Tổ chức lại hệ thống Security độc lập dưới `com.badminton.security`, chia thành các package con chuyên biệt: `jwt/` (JwtTokenProvider, JwtAuthenticationFilter, JwtAuthenticationEntryPoint, CustomAccessDeniedHandler), `userdetails/` (CustomUserDetails, CustomUserDetailsService), và `SecurityConfig.java` tại gốc security.

**Acceptance criteria:**
- [x] Các thành phần JWT được gom vào `com.badminton.security.jwt`.
- [x] Các thành phần UserDetails được gom vào `com.badminton.security.userdetails`.
- [x] `SecurityConfig` được cập nhật các import mới và biên dịch trơn tru.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/security/jwt/JwtTokenProvider.java`
- `src/main/java/com/badminton/security/jwt/JwtAuthenticationFilter.java`
- `src/main/java/com/badminton/security/jwt/JwtAuthenticationEntryPoint.java`
- `src/main/java/com/badminton/security/jwt/CustomAccessDeniedHandler.java`
- `src/main/java/com/badminton/security/userdetails/CustomUserDetails.java`
- `src/main/java/com/badminton/security/userdetails/CustomUserDetailsService.java`
- `src/main/java/com/badminton/security/SecurityConfig.java`

**Estimated scope:** Medium: 7 files

---

## Task 3: Reorganize Notification Subsystem
**Description:** Tổ chức lại toàn bộ hệ thống gửi thông báo đa kênh (Strategy Pattern) vào `com.badminton.notification`: DTO (`NotificationMessage`), Strategy Interface (`NotificationSender`), Dispatcher Interface (`NotificationService`), và các implementation trong `impl/` (`ConsoleEmailNotificationSender`, `ConsoleSmsNotificationSender`, `NotificationServiceImpl`).

**Acceptance criteria:**
- [x] `NotificationMessage` được chuyển vào `com.badminton.notification.dto`.
- [x] `NotificationSender` và `NotificationService` nằm tại `com.badminton.notification`.
- [x] Các implementation nằm trong `com.badminton.notification.impl`.
- [x] Hệ thống Strategy Pattern hoạt động độc lập, sẵn sàng phục vụ bất kỳ module nào.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/notification/dto/NotificationMessage.java`
- `src/main/java/com/badminton/notification/NotificationSender.java`
- `src/main/java/com/badminton/notification/NotificationService.java`
- `src/main/java/com/badminton/notification/impl/ConsoleEmailNotificationSender.java`
- `src/main/java/com/badminton/notification/impl/ConsoleSmsNotificationSender.java`
- `src/main/java/com/badminton/notification/impl/NotificationServiceImpl.java`

**Estimated scope:** Medium: 6 files

---

## Checkpoint: Core Infrastructure Ready (Tasks 1-3)
- [x] Toàn bộ hạ tầng `shared`, `security`, `notification` đã được tách độc lập và biên dịch không lỗi.

---

## Task 4: Migrate Module 1 into `modules/auth` Package
**Description:** Tạo package nghiệp vụ `com.badminton.modules.auth` và gom toàn bộ mã nguồn của Module 1 Auth vào các thư mục con: `entity/` (User, Role, RefreshToken, PasswordResetToken), `repository/` (UserRepository, RoleRepository, RefreshTokenRepository, PasswordResetTokenRepository), `dto/` (request & response), `mapper/` (UserMapper, UserMapperFallbackImpl, MapperConfig), `service/` (AuthService, AuthServiceImpl), và `AuthController.java`. Xóa sạch các thư mục cũ kiểu Layered đã bị rỗng.

**Acceptance criteria:**
- [x] Thư mục `com.badminton.modules.auth` chứa toàn bộ 100% mã nguồn liên quan đến xác thực và người dùng.
- [x] Các thư mục cũ (`controller/`, `dto/`, `entity/`, `repository/`, `service/`, `mapper/`, `common/`, `exception/`) được dọn dẹp sạch sẽ.
- [x] Dự án không còn file thừa hay class trùng lặp.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `src/main/java/com/badminton/modules/auth/entity/*`
- `src/main/java/com/badminton/modules/auth/repository/*`
- `src/main/java/com/badminton/modules/auth/dto/*`
- `src/main/java/com/badminton/modules/auth/mapper/*`
- `src/main/java/com/badminton/modules/auth/service/*`
- `src/main/java/com/badminton/modules/auth/AuthController.java`

**Estimated scope:** Large: 15-18 files

---

## Task 5: Update Tests, DataSeeder & End-to-End Build Verification
**Description:** Cập nhật import trong `DataSeeder.java` và `AuthServiceTest.java` theo cấu trúc package mới. Chạy toàn bộ test bằng Maven (`mvn clean test`) để chứng minh toàn bộ logic nghiệp vụ, mock test và luồng xác thực vẫn hoạt động hoàn hảo 100%.

**Acceptance criteria:**
- [x] `DataSeeder.java` cập nhật đúng package và import mới.
- [x] `AuthServiceTest.java` cập nhật đúng package và import mới.
- [x] Lệnh `.\mvnw.cmd clean test` kết thúc với `BUILD SUCCESS` (toàn bộ test đều Pass: 5/5).

**Verification:**
- [x] Tests pass: `.\mvnw.cmd clean test`

**Dependencies:** Task 4

**Files likely touched:**
- `src/main/java/com/badminton/config/DataSeeder.java`
- `src/test/java/com/badminton/modules/auth/AuthServiceTest.java`

**Estimated scope:** Small: 2-3 files

---

## Task 6: Synchronize Documentation
**Description:** Cập nhật lại các tài liệu kiến trúc [`README.md`](README.md), [`docs/architecture/architecture-and-rbac.md`](docs/architecture/architecture-and-rbac.md), [`docs/architecture/modules/module-1-auth.md`](docs/architecture/modules/module-1-auth.md) để phản ánh cấu trúc Package-by-Feature mới.

**Acceptance criteria:**
- [x] Sơ đồ cây thư mục trong tài liệu phản ánh chính xác cấu trúc `shared/`, `security/`, `notification/`, `modules/auth/`.
- [x] Đường dẫn code trong tài liệu được cập nhật đầy đủ.

**Verification:**
- [x] Manual review tài liệu

**Dependencies:** Task 5

**Files likely touched:**
- `README.md`
- `docs/architecture/architecture-and-rbac.md`
- `docs/architecture/modules/module-1-auth.md`

**Estimated scope:** Small: 4 markdown files

---

## Checkpoint: Refactoring Complete
- [x] Cấu trúc Package-by-Feature hoàn chỉnh, gọn gàng, trực quan.
- [x] Toàn bộ unit test Pass, Spring Boot biên dịch trơn tru (5/5 tests pass).
- [x] Sẵn sàng triển khai tiếp Module 2 vào thẳng `modules/auth/` hoặc `modules/user/`.

