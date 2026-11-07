# ĐẶC TẢ CHI TIẾT FE PHASE 1: AUTHENTICATION & APP SHELL

> **Mục tiêu Phase 1:** Xây dựng nền móng xác thực người dùng (Login, Register, Forgot/Reset Password, Auto Refresh Token), khung giao diện quản trị & đặt sân (`AppShell`: `Sidebar` + `Header`), và hệ thống bảo vệ định tuyến theo vai trò (`ProtectedRoute`, `RoleRoute`).

---

## 1. Bố Cục Chi Tiết Từng Màn Hình (Layout & Wireframes)

### 1.1. Các Màn Hình Xác Thực (`/login`, `/register`, `/forgot-password`, `/reset-password`)
Tất cả 4 màn hình Auth đều dùng chung bố cục **Centered Auth Layout**:
- Khung ngoài: `min-h-[100dvh] w-full bg-zinc-50 flex flex-col items-center justify-center p-4`
- Khung chính: `Card` (`w-full max-w-md bg-white border border-zinc-200 shadow-sm rounded-xl`)

```text
+-------------------------------------------------------------------+
|                           bg-zinc-50                              |
|                                                                   |
|            +-----------------------------------------+            |
|            |      [Icon]  Sân Cầu Lông               |            |
|            |      Đăng nhập vào hệ thống quản lý     |            |
|            |-----------------------------------------|            |
|            |  [!] Lỗi từ API (nếu có - nền red-50)   |            |
|            |                                         |            |
|            |  Email                                  |            |
|            |  [ nguyenvana@gmail.com              ]  |            |
|            |                                         |            |
|            |  Mật khẩu              Quên mật khẩu?   |            |
|            |  [ ••••••••••••                  [👁] ]  |            |
|            |                                         |            |
|            |  [x] Ghi nhớ đăng nhập                  |            |
|            |                                         |            |
|            |  [        Đăng nhập (bg-zinc-900)    ]  |            |
|            |                                         |            |
|            |     Chưa có tài khoản? Đăng ký ngay     |            |
|            +-----------------------------------------+            |
|                                                                   |
+-------------------------------------------------------------------+
```

#### Điểm nhấn nghiệp vụ trên từng màn hình Auth:
1. **`/login` (`LoginPage.tsx`):**
   - Input `email` và `password` (có nút `Button variant="ghost"` bật/tắt `type="text" | "password"`).
   - `Checkbox` *"Ghi nhớ đăng nhập"* + Link *"Quên mật khẩu?"* dẫn tới `/forgot-password`.
   - Khi lỗi (401/403/400): Hiển thị nguyên văn `message` tiếng Việt từ Backend trả về trong khung cảnh báo (`border-red-200 bg-red-50 text-red-600 text-sm p-3 rounded-lg`).
   - Sau khi đăng nhập thành công: Đọc `location.state?.from?.pathname` để quay lại đúng trang người dùng định vào trước đó (hoặc về `/` nếu không có).
2. **`/register` (`RegisterPage.tsx`):**
   - Gồm 5 trường: *Họ và tên* (`fullName`), *Email* (`email`), *Số điện thoại* (`phone`), *Mật khẩu* (`password`), *Nhập lại mật khẩu* (`confirmPassword`).
   - Kiểm tra tại Client: mật khẩu tối thiểu 6 ký tự, `password === confirmPassword`, số điện thoại 10 chữ số bắt đầu bằng `0`.
   - Thành công (201) $\rightarrow$ Hiển thị thông báo (Toast) *"Đăng ký tài khoản thành công! Vui lòng đăng nhập."* $\rightarrow$ Chuyển hướng `/login`.
3. **`/forgot-password` (`ForgotPasswordPage.tsx`):**
   - Trạng thái 1 (Form): Nhập `email` $\rightarrow$ Bấm *"Gửi yêu cầu đặt lại mật khẩu"*.
   - Trạng thái 2 (Đã gửi): Thay thế form bằng thông báo xác nhận rõ ràng: *"Đã gửi hướng dẫn khôi phục mật khẩu tới email của bạn. Lưu ý: Liên kết đặt lại mật khẩu chỉ có hiệu lực trong vòng **15 phút**."* + Nút quay lại `/login`.
4. **`/reset-password?token=...` (`ResetPasswordPage.tsx`):**
   - Đọc `token` từ `useSearchParams()`. Nếu thiếu `token` trên URL $\rightarrow$ cảnh báo liên kết không hợp lệ.
   - Gồm 2 trường: *Mật khẩu mới* và *Nhập lại mật khẩu mới* (có nút ẩn/hiện).
   - Thành công $\rightarrow$ Thông báo thành công $\rightarrow$ Chuyển hướng `/login`.

---

### 1.2. Khung Ứng Dụng Chính (`AppShell`: `Sidebar` + `Header` + `Dashboard`)

```text
+--------------------+------------------------------------------------------+
|  SIDEBAR (w-64)    |  HEADER (h-16, bg-white, border-b border-zinc-200)   |
|  bg-white          |  Tiêu đề trang  [Badge: ADMIN]          [Avatar: QT] |
|  border-r zinc-200 +------------------------------------------------------+
|                    |  MAIN CONTENT (flex-1, bg-zinc-50, p-6)              |
|  [Logo] SânCầuLông |                                                      |
|  ----------------  |  +-----------+ +-----------+ +-----------+ +-------+ |
|  [x] Tổng quan     |  | Stat Card | | Stat Card | | Stat Card | | Stat  | |
|      (bg-zinc-100) |  |  1        | |  2        | |  3        | |  4    | |
|  [ ] Đặt sân       |  +-----------+ +-----------+ +-----------+ +-------+ |
|  [ ] Quản lý sân   |                                                      |
|  [ ] Người dùng    |  +-------------------------------------------------+ |
|  [ ] Thanh toán    |  |                                                 | |
|  [ ] Voucher       |  |           [Icon] Biểu đồ / Dữ liệu              | |
|  [ ] Báo cáo       |  |               [Badge: Phase sau]                | |
|                    |  |                                                 | |
|                    |  +-------------------------------------------------+ |
+--------------------+------------------------------------------------------+
```

#### Cấu hình Menu Sidebar theo từng Role:
- **`ADMIN` (7 mục):**
  1. Tổng quan (`/`)
  2. Đặt sân (`/bookings`)
  3. Quản lý sân (`/courts`)
  4. Người dùng (`/users`)
  5. Thanh toán (`/payments`)
  6. Voucher (`/vouchers`)
  7. Báo cáo (`/reports`)
- **`STAFF` (4 mục):**
  1. Tổng quan (`/`)
  2. Đặt sân (POS) (`/pos`)
  3. Check-in (`/check-in`)
  4. Thanh toán (`/payments`)
- **`CUSTOMER` (3 mục):**
  1. Đặt sân (`/booking`)
  2. Lịch đặt của tôi (`/my-bookings`)
  3. Ưu đãi (`/vouchers`)

> **Lưu ý UX cho CUSTOMER:** Khi `CUSTOMER` đăng nhập và vào `/` (hoặc bấm Tổng quan), hệ thống vẫn hiển thị Dashboard cá nhân hóa cho khách hàng (4 stat cards về lịch đặt/ưu đãi của khách) hoặc điều hướng mượt mà mà không bao giờ bị lỗi 403 tại trang gốc `/`.

---

## 2. Đồng Bộ Contract API Giữa Frontend & Backend Thực Tế

Qua đối chiếu trực tiếp mã nguồn Backend (`AuthController.java`, `AuthServiceImpl.java`, `UserMapper.java`, `RoleType.java`), có **3 điểm kỹ thuật quan trọng** được xử lý tự động trong tầng `lib/auth.ts` của Frontend:

1. **Chuẩn hóa Tiền tố Vai trò (`ROLE_` Prefix Normalization):**
   - Trong DB và `RoleType.java` của Backend, vai trò được trả về dưới dạng `["ROLE_ADMIN"]`, `["ROLE_STAFF"]`, `["ROLE_CUSTOMER"]`.
   - Để đảm bảo Frontend hoạt động đúng 100% với cả hai định dạng (`"ADMIN"` trong đặc tả FE và `"ROLE_ADMIN"` từ BE thực tế), hàm `normalizeRole(role)` trong `src/lib/auth.ts` sẽ tự động cắt bỏ tiền tố `"ROLE_"` khi nạp vào `AuthContext`. Nhờ đó `user.roles` trong React luôn là `("ADMIN" | "STAFF" | "CUSTOMER")[]` sạch sẽ, đồng thời tương thích tuyệt đối với Backend thật!
2. **Khôi phục phiên làm việc khi nhấn F5 (`GET /api/v1/auth/me`):**
   - Khi người dùng nhấn F5 (Reload trang), nếu trong `localStorage` có `accessToken`, `AuthProvider` sẽ gọi `GET /api/v1/auth/me` để lấy thông tin `User` mới nhất từ server (hoặc dùng bản cache an toàn kèm cơ chế tự động gọi `/refresh-token` nếu `accessToken` đã hết hạn 15 phút).
3. **Body của API Đăng xuất (`POST /api/v1/auth/logout`):**
   - Backend `AuthController.logout` nhận `@Valid @RequestBody RefreshTokenRequest` (`{ refreshToken }`). Do đó hàm `logout()` ở FE sẽ gửi `{ refreshToken }` lên server để thu hồi token trong DB trước khi xóa sạch `localStorage` và điều hướng về `/login`.

---

## 3. Cơ Chế Chặn Lặp Vô Hạn Trong Axios Interceptor (Single-Retry Queue)

Trong `src/lib/api.ts`:
- **Request Interceptor:** Tự động đính kèm header `Authorization: Bearer <accessToken>` cho mọi request (trừ các endpoint public auth như `/auth/login`, `/auth/register`, `/auth/refresh-token`).
- **Response Interceptor:**
  - Khi nhận mã lỗi `401 Unauthorized` từ một endpoint nghiệp vụ (không phải `/auth/login` hay `/auth/refresh-token`) và cờ `originalRequest._retry` chưa bật:
  - Đánh dấu `originalRequest._retry = true`.
  - Gọi **đúng 1 lần** `POST /api/v1/auth/refresh-token` với `{ refreshToken }`.
  - Nếu thành công: Lưu cặp `accessToken` và `refreshToken` mới (Token Rotation) vào `localStorage`, gắn `Authorization` mới và thực thi lại `originalRequest`.
  - Nếu thất bại: Xóa sạch `localStorage` và chuyển hướng cứng về `/login`.

