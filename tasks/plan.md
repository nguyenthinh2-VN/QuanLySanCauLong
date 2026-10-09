# Implementation Plan: Web Quản Lý Sân Cầu Lông (Backend)

## 1. Overview
Hệ thống backend cho nền tảng "Web Quản Lý Sân Cầu Lông" xây dựng bằng Java Spring Boot, phục vụ portfolio tuyển dụng Senior-standard cho vị trí Fresher/Junior.
Hệ thống giải quyết trọn vẹn bài toán vận hành sân cầu lông: quản lý tài khoản & phân quyền (RBAC), quản lý sân bãi & khung giờ định giá linh hoạt, đặt sân lẻ/đặt lịch cố định hàng tuần với cơ chế chống xung đột (concurrency/double-booking), thanh toán giả lập, voucher khuyến mãi và báo cáo thống kê doanh thu/tỉ lệ lấp đầy sân bằng JPQL projection hiệu năng cao.

---

## 2. Architecture & Design Principles

### 2.1. Cấu trúc thư mục Layered Architecture (`com.badminton`)
```
com.badminton
├── config/             # Cấu hình Spring (SecurityConfig, OpenApiConfig, CorsConfig, ...)
├── controller/         # REST Controllers (chỉ nhận DTO request, gọi Service, trả ApiResponse<DTO>)
├── service/            # Service Interfaces & Implementations (chứa toàn bộ nghiệp vụ)
│   └── impl/
├── repository/         # Spring Data JPA Repositories
├── entity/             # JPA Entities (không bao giờ lộ ra ngoài API)
├── dto/                # Request & Response Data Transfer Objects (Validation annotations)
│   ├── request/
│   └── response/
├── mapper/             # MapStruct mappers (chuyển đổi Entity <-> DTO không boilerplate)
├── security/           # JWT, UserDetails, JwtAuthenticationFilter, SecurityUtils
├── exception/          # GlobalExceptionHandler, Custom Business Exceptions, Error Codes
└── common/             # ApiResponse wrapper, Constant, Enums, BaseEntity, PageResponse
```

### 2.2. Các quyết định thiết kế cốt lõi (Core Decisions)
1. **RBAC chặt chẽ (Method-Level Security)**:
   - Lưu trữ roles (`ADMIN`, `STAFF`, `CUSTOMER`) dạng bảng `roles` với liên kết Many-to-Many thông qua `user_roles`.
   - Sử dụng `@EnableMethodSecurity` và `@PreAuthorize("hasRole(T(com.badminton.common.enums.RoleType).ADMIN.name())")` hoặc Custom SpEL Constants để tránh hardcode String.
2. **Quản lý Token (Access Token & Refresh Token)**:
   - Access Token ngắn hạn (ví dụ: 15-30 phút), Refresh Token dài hạn (ví dụ: 7 ngày) được lưu database để hỗ trợ revoke/logout tức thì (Rotation & Revocation).
3. **Chuẩn hóa API Response**:
   - Thành công: `ApiResponse<T>` với format `{ "success": true, "message": "...", "data": ... }`.
   - Thất bại: `ApiResponse<Void>` với format `{ "success": false, "code": "...", "message": "...", "timestamp": ... }`.
4. **Phân trang chuẩn REST**:
   - Sử dụng `Pageable` của Spring Data, chuyển đổi thành `PageResponse<T>` gồm `content`, `pageNo`, `pageSize`, `totalElements`, `totalPages`, `isLast`.

---

## 3. Lộ trình triển khai 9 Modules

- [ ] **Module 1: Auth & RBAC (Current Scope)**
  - Đăng ký, đăng nhập JWT + Refresh token rotation
  - Đăng xuất (thu hồi refresh token)
  - Quên mật khẩu & đặt lại mật khẩu (giả lập token, log console)
  - Thông tin cá nhân (`/api/v1/auth/me`)
- [ ] **Module 2: Quản lý Users & Gán Role (Admin only)**
  - Quản lý danh sách người dùng, tìm kiếm, phân trang
  - Khóa/mở khóa tài khoản
  - Gán role cho user (ADMIN, STAFF, CUSTOMER)
- [ ] **Module 3: Quản lý Cụm Sân, Sân Con & Bảng Giá Khung Giờ**
  - Cụm sân (Court Complex/Center), sân con (Court)
  - Khung giờ hoạt động (TimeSlots), định giá linh hoạt (giờ vàng/cao điểm, cuối tuần)
- [ ] **Module 4: Xem Lịch Trống, Đặt Sân & Xử Lý Concurrency**
  - Xem slot trống theo ngày/sân
  - Đặt sân chống double-booking (Pessimistic Locking / Transaction isolation)
  - Hủy/đổi lịch theo điều kiện (trước X giờ)
- [ ] **Module 5: Đặt Lịch Cố Định Hàng Tuần (Recurring Booking)**
  - Đặt theo chu kỳ tuần (ví dụ: Thứ 3 & Thứ 5 hàng tuần trong 1 tháng)
  - Batch checking slot trống
- [ ] **Module 6: Thanh Toán Giả Lập & Đặt Cọc**
  - Workflow: PENDING → PAID / CANCELLED / EXPIRED
  - Đặt cọc theo % giá trị đơn, hoàn tiền khi hủy đúng quy định
- [ ] **Module 7: Voucher & Khuyến Mãi**
  - CRUD voucher, điều kiện áp dụng (giá trị đơn tối thiểu, số lượng giới hạn, hạn dùng)
  - Áp dụng voucher khi tạo đơn đặt sân
- [ ] **Module 8: Dashboard & Báo Cáo Thống Kê**
  - Doanh thu theo ngày/tuần/tháng
  - Tỉ lệ lấp đầy sân (Court Occupancy Rate)
  - Tối ưu hóa bằng JPQL Constructor Expressions & DTO Projections
- [ ] **Module 9: Seeding Data, Docker & Swagger Documentation**
  - Flyway migration hoặc CommandLineRunner seed data (roles, admin mặc định, sân mẫu)
  - `docker-compose.yml` (App + Database)
  - Swagger UI / OpenAPI 3 tài liệu hóa toàn bộ endpoint

---

## 4. Chi tiết triển khai Module 1: Auth + RBAC

### Sơ đồ luồng (Flow)
1. **Register**: `RegisterRequest` -> validate (email unique, password format, phone) -> mã hóa Password bằng `BCryptPasswordEncoder` -> gán role mặc định `CUSTOMER` -> lưu DB.
2. **Login**: `LoginRequest` -> `AuthenticationManager.authenticate()` -> Sinh Access Token & Refresh Token -> Lưu Refresh Token vào bảng `refresh_tokens` -> Trả về `AuthResponse`.
3. **Refresh Token**: Client gửi `RefreshTokenRequest` -> Kiểm tra token có trong DB, chưa hết hạn, chưa bị revoke -> Cấp Access Token mới (kèm refresh token rotation).
4. **Logout**: Client gọi logout -> Thu hồi (revoke/xóa) Refresh Token trong DB -> Trả về message thành công.
5. **Forgot Password**: Nhận email -> Tạo reset token có thời hạn (15 phút) -> Lưu DB hoặc cache -> Log link reset ra console -> User gọi endpoint reset password với token và mật khẩu mới.

---

## 5. Rủi ro & Giải pháp (Risks & Mitigations)

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| Xung đột version thư viện trong Spring Boot | Cao | Dùng Spring Boot 3.3.x/3.4.x chính thức, quản lý version chuẩn qua dependency management. |
| Rò rỉ thông tin nhạy cảm qua JWT | Trung bình | Chỉ lưu subject (username/email), user ID, roles trong Claims; không lưu mật khẩu hay dữ liệu nhạy cảm. |
| Xung đột token khi login đa thiết bị | Thấp | Bảng `refresh_tokens` liên kết với `User` (1-n) giúp quản lý theo từng phiên đăng nhập hoặc thu hồi toàn bộ. |
