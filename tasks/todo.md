# Tasks Checklist: Module 1 - Authentication & RBAC

## Task 1: Setup Dependencies, Application Configuration & Base Classes
**Description:** Cấu hình file `pom.xml` bổ sung các starter cần thiết (Web, Data JPA, Security, Validation, MySQL Driver, MapStruct, JJWT, SpringDoc OpenAPI), cấu hình `application.yml`, đổi tên package chính thành `com.badminton`, tạo các lớp cơ sở dùng chung (`ApiResponse`, `BaseEntity`, `ErrorCode`, `RoleConstants`, `RoleType` enum).

**Acceptance criteria:**
- [x] File `pom.xml` bao gồm đầy đủ dependencies cho Spring Boot Web, Data JPA, Security, Validation, MySQL Driver, MapStruct 1.5.5+, JJWT 0.12.x, SpringDoc OpenAPI v2.
- [x] Root package được đồng nhất là `com.badminton`.
- [x] Lớp `ApiResponse<T>` chuẩn hóa response theo đúng yêu cầu `{ "success": boolean, "message": string, "data": ... }`.
- [x] Enum `RoleType` gồm `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
- [x] Dự án biên dịch thành công (`mvn clean compile`).

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd clean compile`

**Dependencies:** None

**Files likely touched:**
- `pom.xml`
- `src/main/resources/application.yml`
- `src/main/java/com/badminton/QuanLySanCauLongApplication.java`
- `src/main/java/com/badminton/common/ApiResponse.java`
- `src/main/java/com/badminton/common/BaseEntity.java`
- `src/main/java/com/badminton/common/enums/RoleType.java`
- `src/main/java/com/badminton/exception/ErrorCode.java`

**Estimated scope:** Medium: 5-7 files

---

## Task 2: Implement Entities & Repositories for User, Role, and RefreshToken
**Description:** Tạo các entity JPA mô hình hóa người dùng (`User`), vai trò (`Role`), liên kết nhiều-nhiều (`user_roles`), `RefreshToken` (lưu token refresh và trạng thái revoke), và `PasswordResetToken` (phục vụ chức năng quên mật khẩu). Tạo các Spring Data JPA repository tương ứng.

**Acceptance criteria:**
- [x] Entity `Role` ánh xạ bảng `roles`, có `RoleType name` (unique, nullable=false).
- [x] Entity `User` ánh xạ bảng `users`, có `email` (unique), `phone` (unique), `password`, `fullName`, `active` (boolean), quan hệ `@ManyToMany` với `Role`.
- [x] Entity `RefreshToken` ánh xạ bảng `refresh_tokens`, lưu token chuỗi UUID/JWT, expiryDate, revoked (boolean), quan hệ `@ManyToOne` với `User`.
- [x] Entity `PasswordResetToken` lưu mã/token đặt lại mật khẩu với thời hạn hết hạn.
- [x] Các repository `UserRepository`, `RoleRepository`, `RefreshTokenRepository`, `PasswordResetTokenRepository` hỗ trợ các query nghiệp vụ cần thiết (tìm theo email, phone, token).

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd test-compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/entity/User.java`
- `src/main/java/com/badminton/entity/Role.java`
- `src/main/java/com/badminton/entity/RefreshToken.java`
- `src/main/java/com/badminton/entity/PasswordResetToken.java`
- `src/main/java/com/badminton/repository/UserRepository.java`
- `src/main/java/com/badminton/repository/RoleRepository.java`
- `src/main/java/com/badminton/repository/RefreshTokenRepository.java`
- `src/main/java/com/badminton/repository/PasswordResetTokenRepository.java`

**Estimated scope:** Medium: 6-8 files

---

## Task 3: DTOs, Validation & MapStruct Mappers
**Description:** Tạo các DTO request và response cho Authentication (đăng ký, đăng nhập, refresh token, đổi mật khẩu, quên mật khẩu, user profile) có gắn đầy đủ Bean Validation (`@NotBlank`, `@Email`, `@Size`, ...). Tạo MapStruct Mapper để chuyển đổi an toàn giữa Entity và DTO mà không làm lộ Entity ra ngoài API.

**Acceptance criteria:**
- [x] DTO request: `RegisterRequest`, `LoginRequest`, `RefreshTokenRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`.
- [x] DTO response: `AuthResponse` (chứa accessToken, refreshToken, tokenType, expiresIn, user info tóm tắt), `UserResponse`.
- [x] MapStruct `UserMapper` cấu hình `componentModel = "spring"` để map `User` sang `UserResponse` và bỏ qua password.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 2

**Files likely touched:**
- `src/main/java/com/badminton/dto/request/RegisterRequest.java`
- `src/main/java/com/badminton/dto/request/LoginRequest.java`
- `src/main/java/com/badminton/dto/request/RefreshTokenRequest.java`
- `src/main/java/com/badminton/dto/request/ForgotPasswordRequest.java`
- `src/main/java/com/badminton/dto/request/ResetPasswordRequest.java`
- `src/main/java/com/badminton/dto/response/AuthResponse.java`
- `src/main/java/com/badminton/dto/response/UserResponse.java`
- `src/main/java/com/badminton/mapper/UserMapper.java`

**Estimated scope:** Medium: 7-8 files

---

## Checkpoint: Foundation Ready (Tasks 1-3)
- [x] Dependencies và database driver được thiết lập đầy đủ.
- [x] Mô hình dữ liệu và DTO mapping biên dịch trơn tru không lỗi.

---

## Task 4: JWT Provider & Spring Security Configuration
**Description:** Cấu hình Spring Security 6 với JWT filter không lưu session (`SessionCreationPolicy.STATELESS`), xử lý ngoại lệ AuthenticationEntryPoint và AccessDeniedHandler trả về JSON chuẩn, cài đặt `JwtTokenProvider` (tạo và kiểm tra chữ ký token, trích xuất username/claims) và `CustomUserDetailsService`.

**Acceptance criteria:**
- [x] `JwtTokenProvider` mã hóa và giải mã JWT sử dụng JJWT, quản lý thời gian hết hạn của access token.
- [x] `CustomUserDetailsService` load người dùng từ database kèm danh sách GrantedAuthorities từ Role.
- [x] `JwtAuthenticationFilter` chặn request, phân tích header `Authorization: Bearer <token>`, set Authentication vào SecurityContext.
- [x] `SecurityConfig` cấu hình CSRF disable, CORS cho phép FE truy cập, mở permitAll cho các endpoint `/api/v1/auth/**`, `/v3/api-docs/**`, `/swagger-ui/**`.
- [x] Kích hoạt `@EnableMethodSecurity` cho phép dùng `@PreAuthorize("hasRole(...)")`.
- [x] Xử lý lỗi 401 Unauthorized và 403 Forbidden trả về `ApiResponse` định dạng JSON chuẩn.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 3

**Files likely touched:**
- `src/main/java/com/badminton/security/JwtTokenProvider.java`
- `src/main/java/com/badminton/security/JwtAuthenticationFilter.java`
- `src/main/java/com/badminton/security/CustomUserDetails.java`
- `src/main/java/com/badminton/security/CustomUserDetailsService.java`
- `src/main/java/com/badminton/security/JwtAuthenticationEntryPoint.java`
- `src/main/java/com/badminton/security/CustomAccessDeniedHandler.java`
- `src/main/java/com/badminton/config/SecurityConfig.java`

**Estimated scope:** Large: 7 files

---

## Task 5: Global Exception Handling & Custom Business Exceptions
**Description:** Cài đặt `GlobalExceptionHandler` với `@RestControllerAdvice` để bắt toàn bộ ngoại lệ: Validation error (`MethodArgumentNotValidException`), Business exceptions (`AppException`, `ResourceNotFoundException`, `BadRequestException`), và `Exception` tổng quát, format thống nhất thành `{ "success": false, "code": "...", "message": "..." }`.

**Acceptance criteria:**
- [x] Lỗi validation trả HTTP 400 kèm chi tiết từng trường bị lỗi.
- [x] Ngoại lệ business `AppException` trả mã lỗi theo enum `ErrorCode`.
- [x] Bắt lỗi `AccessDeniedException` và `BadCredentialsException`.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/badminton/exception/AppException.java`
- `src/main/java/com/badminton/exception/ResourceNotFoundException.java`
- `src/main/java/com/badminton/exception/GlobalExceptionHandler.java`

**Estimated scope:** Small: 3 files

---

## Task 6: Implement AuthService & AuthController
**Description:** Cài đặt `AuthService` (interface + implementation) xử lý toàn bộ logic nghiệp vụ: register (mã hóa password, gán role `ROLE_CUSTOMER`), login (xác thực credentials, phát sinh access token + refresh token), refreshToken (rotation, thu hồi token cũ, cấp mới), logout (thu hồi refresh token), forgotPassword (tạo reset token, log link ra console), resetPassword, getCurrentUser. Cài đặt `AuthController` tiếp nhận request và trả về DTO.

**Acceptance criteria:**
- [x] Service dùng Constructor Injection (không `@Autowired` trên field).
- [x] `@Transactional` đặt đúng biên nghiệp vụ.
- [x] Password được băm bằng `BCryptPasswordEncoder`.
- [x] Refresh token rotation: mỗi lần refresh thành công, token cũ bị thu hồi/cập nhật token mới.
- [x] Forgot password sinh mã xác thực ngẫu nhiên, lưu DB có hạn 15 phút, log link ra console.
- [x] Controller chỉ nhận/trả DTO bọc trong `ApiResponse<T>`, không chứa logic nghiệp vụ.

**Verification:**
- [x] Build succeeds: `.\mvnw.cmd compile`

**Dependencies:** Task 4, Task 5

**Files likely touched:**
- `src/main/java/com/badminton/service/AuthService.java`
- `src/main/java/com/badminton/service/impl/AuthServiceImpl.java`
- `src/main/java/com/badminton/controller/AuthController.java`

**Estimated scope:** Medium: 3-4 files

---

## Task 7: Data Seeder & Verification Tests
**Description:** Viết `DataSeeder` (dùng `CommandLineRunner`) tự động khởi tạo các Role mặc định (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`) và 1 tài khoản Admin mẫu nếu chưa tồn tại. Viết test hoặc kiểm thử tích hợp cho Auth API.

**Acceptance criteria:**
- [x] Role mặc định tự động được tạo khi khởi động ứng dụng nếu DB rỗng.
- [x] Tài khoản Admin mẫu (`admin@badminton.com` / `Admin@123`) được khởi tạo sẵn sàng cho đăng nhập.
- [x] Biên dịch dự án hoàn tất, test pass không có lỗi.

**Verification:**
- [x] Tests pass: `.\mvnw.cmd test`

**Dependencies:** Task 6

**Files likely touched:**
- `src/main/java/com/badminton/config/DataSeeder.java`
- `src/test/java/com/badminton/service/AuthServiceTest.java`

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Module 1 Complete
- [x] Toàn bộ luồng đăng ký, đăng nhập, refresh token, quên mật khẩu, phân quyền hoạt động ổn định.
- [x] Tài liệu API tích hợp Frontend tại `docs/api/module-1-auth-rbac.md` đã sẵn sàng.
- [x] Tài liệu kiến trúc và phân quyền tại `docs/architecture/architecture-and-rbac.md` đã sẵn sàng.
- [x] Dừng lại để người dùng review trước khi chuyển sang Module 2.
