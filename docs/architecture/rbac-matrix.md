# MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC MATRIX)

> **Mục đích tài liệu:** Quy định chi tiết các vai trò (Roles) và ma trận quyền hạn (Permissions) cho toàn bộ API trong hệ thống. File này được tách độc lập để dễ dàng cập nhật và kiểm tra khi bổ sung tính năng mới.

---

## 1. Danh Mục Các Vai Trò (Roles)

Hệ thống sử dụng enum `RoleType` lưu trong bảng `roles`, quan hệ Many-to-Many với bảng `users` thông qua bảng liên kết `user_roles`:

| Mã Role | Tên hiển thị | Đối tượng người dùng | Quyền hạn tổng quát |
|---|---|---|---|
| `ROLE_ADMIN` | Quản trị viên | Chủ sân, Quản lý cấp cao | Toàn quyền kiểm soát hệ thống: Sân bãi, giá, doanh thu, quản lý tài khoản và phân quyền. |
| `ROLE_STAFF` | Nhân viên vận hành | Thu ngân, Lễ tân trực ca | Check-in khách đến sân, tạo đơn đặt sân trực tiếp tại quầy, quản lý slot trong ngày. |
| `ROLE_CUSTOMER` | Khách hàng | Người thuê sân cầu lông | Xem lịch trống, đặt sân online, xem lịch sử đặt chỗ, hủy/đổi lịch theo quy định. |

---

## 2. Ma Trận Phân Quyền Chi Tiết Theo Chức Năng (RBAC Matrix)

| STT | Miền nghiệp vụ | Endpoint / Chức năng | Khách vãng lai (Public) | CUSTOMER | STAFF | ADMIN | Quy tắc bảo mật (Method Security) |
|:---:|---|---|:---:|:---:|:---:|:---:|---|
| **I** | **Xác thực (Auth)** | | | | | | |
| 1 | Đăng ký tài khoản | `POST /api/v1/auth/register` | ✅ | ✅ | ✅ | ✅ | Không yêu cầu token (`permitAll`) |
| 2 | Đăng nhập hệ thống | `POST /api/v1/auth/login` | ✅ | ✅ | ✅ | ✅ | Không yêu cầu token (`permitAll`) |
| 3 | Làm mới token | `POST /api/v1/auth/refresh-token` | ✅ | ✅ | ✅ | ✅ | Xác thực qua Refresh Token trong DB |
| 4 | Đăng xuất | `POST /api/v1/auth/logout` | ✅ | ✅ | ✅ | ✅ | Thu hồi Refresh Token |
| 5 | Quên / Đặt lại mật khẩu | `POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password` | ✅ | ✅ | ✅ | ✅ | Xác thực bằng token OTP thời hạn 15 phút |
| 6 | Xem thông tin của tôi | `GET /api/v1/auth/me` | ❌ | ✅ | ✅ | ✅ | `@PreAuthorize("isAuthenticated()")` |
| **II** | **Người dùng (Users)** | | | | | | *(Module 2)* |
| 7 | Xem danh sách users | `GET /api/v1/users` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| 8 | Khóa/Mở tài khoản | `PATCH /api/v1/users/{id}/status` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| 9 | Gán quyền Role | `PUT /api/v1/users/{id}/roles` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| **III**| **Sân bãi (Courts)** | | | | | | *(Module 3)* |
| 10| Xem danh sách cụm sân | `GET /api/v1/complexes` | ✅ | ✅ | ✅ | ✅ | `permitAll` |
| 11| CRUD cụm sân / sân con | `POST, PUT, DELETE /api/v1/courts/**` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| 12| Cấu hình khung giờ & bảng giá | `POST, PUT /api/v1/time-slots/**` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| **IV** | **Đặt sân (Bookings)** | | | | | | *(Module 4 & 5)* |
| 13| Xem slot sân trống | `GET /api/v1/bookings/availability` | ✅ | ✅ | ✅ | ✅ | `permitAll` (Cho phép khách tìm giờ trống) |
| 14| Đặt sân online | `POST /api/v1/bookings` | ❌ | ✅ | ✅ | ✅ | `@PreAuthorize("isAuthenticated()")` |
| 15| Đặt sân tại quầy (Khách vãng lai) | `POST /api/v1/bookings/pos` | ❌ | ❌ | ✅ | ✅ | `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")` |
| 16| Check-in khách vào sân | `POST /api/v1/bookings/{id}/check-in` | ❌ | ❌ | ✅ | ✅ | `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")` |
| 17| Hủy / Đổi lịch của mình | `PUT, DELETE /api/v1/bookings/{id}` | ❌ | ✅ | ✅ | ✅ | `@PreAuthorize("hasRole('ADMIN') or @bookingSecurity.isOwner(#id)")` |
| 18| Đặt lịch cố định hàng tuần | `POST /api/v1/bookings/recurring` | ❌ | ✅ | ✅ | ✅ | Khách hàng thân thiết / Admin |
| **V** | **Thanh toán & Khuyến mãi** | | | | | | *(Module 6 & 7)* |
| 19| Thanh toán / Đặt cọc | `POST /api/v1/payments` | ❌ | ✅ | ✅ | ✅ | `@PreAuthorize("isAuthenticated()")` |
| 20| Hoàn tiền hủy lịch | `POST /api/v1/payments/{id}/refund` | ❌ | ❌ | ✅ | ✅ | `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")` |
| 21| Quản lý Voucher khuyến mãi | `POST, PUT, DELETE /api/v1/vouchers` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| 22| Áp dụng Voucher vào đơn | `POST /api/v1/vouchers/apply` | ❌ | ✅ | ✅ | ✅ | Khách hàng áp mã khi thanh toán |
| **VI** | **Báo cáo (Dashboard)** | | | | | | *(Module 8)* |
| 23| Doanh thu ngày/tuần/tháng | `GET /api/v1/reports/revenue` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |
| 24| Tỉ lệ lấp đầy sân (Occupancy) | `GET /api/v1/reports/occupancy` | ❌ | ❌ | ❌ | ✅ | `@PreAuthorize("hasRole('ADMIN')")` |

---

## 3. Quy Ước Code Bảo Mật Method-Level Security

1. **Tuyệt đối không hard-code chuỗi String tự do trong code:**
   - Dùng hằng số từ lớp `RoleConstants`:
   ```java
   // Chuẩn Senior: Type-safe thông qua SpEL và constant
   @PreAuthorize("hasRole(T(com.badminton.common.constant.RoleConstants).ADMIN)")
   public ApiResponse<Void> updateCourt(...) { ... }
   ```
2. **Quyền sở hữu dữ liệu (Resource Ownership Security):**
   - Với các hành động của CUSTOMER (như đổi/hủy lịch), sử dụng SpEL kết hợp Security Component kiểm tra ID người tạo đơn với ID trong JWT:
   ```java
   @PreAuthorize("hasRole('ADMIN') or @securityUtils.isCurrentUserId(#userId)")
   ```
