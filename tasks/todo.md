# Tasks Checklist: FE Module 1 — Phase 1: Auth + App Shell (shadcn/ui Court Emerald + Slate/Zinc)

## Task 1: Khởi tạo dự án Vite React TS & Cài đặt 10 Component `shadcn/ui`
**Description:** Khởi tạo dự án React 18 + Vite + TypeScript trong thư mục `FE/`, cấu hình Tailwind CSS với hệ màu `Court Emerald (#059669)` kết hợp nền `Slate/Zinc (#F8FAFC)`, thiết lập alias `@/*`, tạo `.env.example`, và cài đặt đầy đủ 10 component `shadcn/ui` theo yêu cầu.

**Acceptance criteria:**
- [x] Khởi tạo dự án Vite + React 18 + TypeScript (`strict: true`) tại `FE/`.
- [x] Tạo file `FE/.env.example` và `FE/.env` chứa `VITE_API_URL=http://localhost:8080`.
- [x] Cấu hình Tailwind CSS + `components.json` tông màu `Court Emerald` + `Slate/Zinc` hiện đại, dịu mắt.
- [x] Cài đặt đủ 10 component trong `FE/src/components/ui/`:
  - `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `checkbox.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `badge.tsx`, `separator.tsx`, `skeleton.tsx`.

**Verification:**
- [x] Build succeeds: `npm run build` trong thư mục `FE/`

**Dependencies:** None

**Files likely touched:**
- `FE/package.json`
- `FE/tsconfig.json`
- `FE/vite.config.ts`
- `FE/.env.example`
- `FE/src/index.css`
- `FE/src/components/ui/*`

**Estimated scope:** Medium

---

## Checkpoint 1: Foundation & shadcn/ui Ready
- [x] Build succeeds: `npm run build`
- [x] Đủ 10 component `shadcn/ui` sẵn sàng sử dụng.

---

## Task 2: Hạ tầng Auth, Axios Interceptor & Route Guards
**Description:** Xây dựng hệ thống kiểu dữ liệu TypeScript khớp với envelope `ApiResponse<T>` của Backend, cấu hình Axios instance tự động gắn Bearer token và refresh token 1 lần khi gặp 401, cài đặt `AuthContext` (`AuthProvider`) và 2 bộ bảo vệ route (`ProtectedRoute`, `RoleRoute`).

**Acceptance criteria:**
- [x] Tạo `FE/src/types/auth.ts`: Định nghĩa `ApiResponse<T>`, `Role` (`"ADMIN" | "STAFF" | "CUSTOMER"`), `User`, `AuthResponseData`, `LoginRequestPayload`, `RegisterRequestPayload`.
- [x] Tạo `FE/src/lib/auth.ts`: Quản lý đọc/ghi `accessToken`, `refreshToken`, `user` trong `localStorage` và hàm `normalizeRoles()` tự động chuyển `"ROLE_ADMIN"` -> `"ADMIN"`.
- [x] Tạo `FE/src/lib/api.ts`:
  - `baseURL` lấy từ `import.meta.env.VITE_API_URL`.
  - Request interceptor tự động gắn `Authorization: Bearer <accessToken>`.
  - Response interceptor bắt lỗi 401 -> gọi `/api/v1/auth/refresh-token` đúng 1 lần -> retry request gốc; nếu thất bại thì xóa storage và chuyển về `/login`.
- [x] Tạo `FE/src/context/AuthContext.tsx` & `FE/src/hooks/useAuth.ts`: Cung cấp `user`, `loading`, `login(email, password)`, `logout()`, `refreshUser()`.
- [x] Tạo `FE/src/router/guards.tsx`:
  - `ProtectedRoute`: khi `loading` hiện `Skeleton`; chưa đăng nhập -> `<Navigate to="/login" state={{ from: location }} replace />`.
  - `RoleRoute`: kiểm tra `user.roles` có giao với `allowed` hay không; nếu thiếu quyền -> `<Navigate to="/403" replace />`.

**Verification:**
- [x] Typecheck passes: `npx tsc -b`

**Dependencies:** Task 1

**Files likely touched:**
- `FE/src/types/auth.ts`
- `FE/src/lib/auth.ts`
- `FE/src/lib/api.ts`
- `FE/src/context/AuthContext.tsx`
- `FE/src/hooks/useAuth.ts`
- `FE/src/router/guards.tsx`

**Estimated scope:** Medium: 6 files

---

## Task 3: Các Màn Hình Xác Thực (`/login`, `/register`, `/forgot-password`, `/reset-password`) & Trang Lỗi (`/403`, `*`)
**Description:** Thiết kế và cài đặt 4 màn hình xác thực và 2 trang lỗi bằng tiếng Việt, sử dụng đúng các component `Card`, `Input`, `Label`, `Button`, `Checkbox`, `Badge` (chỉ giữ icon logo và nút mắt mật khẩu ở các trang Auth; trang lỗi không dùng icon).

**Acceptance criteria:**
- [x] `LoginPage.tsx` (`/login`): Card giữa màn hình, logo + tên `"Sân Cầu Lông"`, input email/password (có nút mắt ẩn/hiện), checkbox `"Ghi nhớ đăng nhập"`, link `"Quên mật khẩu?"`, nút `"Đăng nhập"`, link sang `/register`, hiển thị lỗi tiếng Việt từ server.
- [x] `RegisterPage.tsx` (`/register`): Họ tên, Email, SĐT, Mật khẩu, Nhập lại mật khẩu (validate khớp mật khẩu ở client). Thành công -> hiện thông báo toast -> chuyển `/login`.
- [x] `ForgotPasswordPage.tsx` (`/forgot-password`): Nhập email -> chuyển sang trạng thái `"Đã gửi email"` (ghi rõ link hết hạn sau 15 phút).
- [x] `ResetPasswordPage.tsx` (`/reset-password?token=...`): Đọc `token` từ query param, form mật khẩu mới + nhập lại -> thành công chuyển về `/login`.
- [x] `ForbiddenPage.tsx` (`/403`): Trang `"Không có quyền truy cập"` + nút `"Về trang chủ"` (không dùng icon).
- [x] `NotFoundPage.tsx` (`*`): Trang `"404 - Không tìm thấy trang"` + nút `"Về trang chủ"` (không dùng icon).

**Verification:**
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 2

**Files likely touched:**
- `FE/src/pages/auth/LoginPage.tsx`
- `FE/src/pages/auth/RegisterPage.tsx`
- `FE/src/pages/auth/ForgotPasswordPage.tsx`
- `FE/src/pages/auth/ResetPasswordPage.tsx`
- `FE/src/pages/errors/ForbiddenPage.tsx`
- `FE/src/pages/errors/NotFoundPage.tsx`

**Estimated scope:** Medium: 6 files

---

## Task 4: App Shell (`Sidebar`, `Header`), Dashboard Placeholder & Router (Không dùng Icon)
**Description:** Xây dựng khung giao diện sau khi đăng nhập gồm `Sidebar` phân quyền theo từng Role (thuần typography + thanh chỉ báo emerald, không dùng icon), `Header` kèm `Badge` role và `Avatar` `DropdownMenu`, trang `DashboardPage` với 4 thẻ thống kê tĩnh + 1 panel chờ, và kết nối toàn bộ routes trong `src/router/index.tsx`.

**Acceptance criteria:**
- [x] `Sidebar.tsx`: Nền trắng (`bg-white`), không dùng icon, active item tô nền `bg-emerald-50/90` kèm vạch trái `bg-emerald-600`, hiển thị menu đúng theo role:
  - `ADMIN`: Tổng quan (`/`), Đặt sân (`/bookings`), Quản lý sân (`/courts`), Người dùng (`/users`), Thanh toán (`/payments`), Voucher (`/vouchers`), Báo cáo (`/reports`).
  - `STAFF`: Tổng quan (`/`), Đặt sân (POS) (`/pos`), Check-in (`/check-in`), Thanh toán (`/payments`).
  - `CUSTOMER`: Đặt sân (`/booking`), Lịch đặt của tôi (`/my-bookings`), Ưu đãi (`/vouchers`).
- [x] `Header.tsx`: Tiêu đề trang hiện tại + `Badge` hiển thị role, bên phải có `Avatar` (chữ cái đầu tên user) mở `DropdownMenu` (*Hồ sơ*, *Đăng xuất*).
- [x] `DashboardPage.tsx` (`/`): Hiển thị 4 thẻ `Card` thống kê tĩnh theo role (dùng `Badge` màu dịu mắt + số `font-mono tabular-nums`, không icon) + 1 panel trống ghi `"Biểu đồ/dữ liệu — phase sau"`.
- [x] `FeaturePlaceholder.tsx`: Hiển thị tên màn hình + mô tả ngắn + `Badge` `"Phase sau"` (không icon) cho các route nghiệp vụ (`/bookings`, `/courts`, `/users`, `/payments`, `/vouchers`, `/reports`, `/pos`, `/check-in`, `/booking`, `/my-bookings`).
- [x] `src/router/index.tsx` & `App.tsx`: Kết nối toàn bộ Public routes, Protected routes, Role routes và Error routes.

**Verification:**
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `FE/src/components/layout/Sidebar.tsx`
- `FE/src/components/layout/Header.tsx`
- `FE/src/components/layout/AppShell.tsx`
- `FE/src/components/layout/FeaturePlaceholder.tsx`
- `FE/src/pages/dashboard/DashboardPage.tsx`
- `FE/src/router/index.tsx`
- `FE/src/App.tsx`

**Estimated scope:** Medium: 7 files

---

## Checkpoint 2: Hoàn Tất Phase 1 & Kiểm Tra Definition of Done
- [x] Chạy được với BE thật: login/logout/refresh-token hoạt động, F5 không mất đăng nhập.
- [x] Guard hoạt động đúng: chưa login vào `/` -> `/login`; `CUSTOMER` vào `/users` -> `/403`.
- [x] `npm run build` pass 100%, không có lỗi TypeScript.
- [x] Giao diện tiếng Việt chuẩn `shadcn/ui` tông `Court Emerald + Slate/Zinc` (chỉ giữ icon ở màn hình Auth).
