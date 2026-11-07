# Implementation Plan: FE Phase 1 — Authentication + App Shell + RBAC Routing (shadcn/ui Court Emerald + Slate/Zinc)

## 1. Overview
Xây dựng nền móng Frontend (`FE/`) cho hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong` sử dụng **React 18 + Vite + TypeScript (strict) + Tailwind CSS + shadcn/ui (tông màu Court Emerald `#059669` + Slate/Zinc `#F8FAFC`)**. Phase 1 hoàn thiện 100% luồng Xác thực người dùng nối với Backend thật, cơ chế Axios Interceptor tự động làm mới token khi gặp 401, khung giao diện `AppShell` (`Sidebar` + `Header` + `Dashboard`), hệ thống bảo vệ route theo vai trò (`ProtectedRoute`, `RoleRoute`), và các màn hình Placeholder cho những tính năng nghiệp vụ của các Phase tiếp theo.

---

## 2. Architecture & Design Decisions

### Quyết định 1: Phong cách Thiết kế "Court Emerald & Slate/Zinc" — Không Dùng Icon Ở AppShell
- **Bối cảnh:** Người dùng yêu cầu giao diện có điểm nhấn màu sắc hiện đại nhưng dịu mắt (không toàn màu đen đơn điệu và không dùng neon chói lóa), đồng thời **bỏ toàn bộ icon** ở Sidebar, Header, Dashboard, Placeholder và trang lỗi — chỉ giữ lại icon ở các màn hình Auth (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- **Giải pháp:** Sử dụng bảng màu **Deep Court Emerald (`#059669` / `emerald-600`)** kết hợp nền **Slate/Zinc (`#F8FAFC`)** và các `Badge` ngữ nghĩa dịu mắt (`emerald`, `sky`, `indigo`, `amber`, `rose`). `Sidebar`, `Header`, `DashboardPage` và `FeaturePlaceholder` phân cấp hoàn toàn bằng Typography, `Badge` và đường viền chỉ báo màu xanh lục bảo.

### Quyết định 2: Chuẩn hóa Vai trò (`ROLE_ADMIN` <-> `ADMIN`) trong `src/lib/auth.ts`
- **Bối cảnh:** Backend (`RoleType.java` & `UserMapper.java`) trả về mảng `roles: ["ROLE_ADMIN" | "ROLE_STAFF" | "ROLE_CUSTOMER"]`, trong khi logic phân quyền trên UI kiểm tra `"ADMIN" | "STAFF" | "CUSTOMER"`.
- **Giải pháp:** Hàm helper `normalizeRoles(roles: string[]): Role[]` tự động cắt tiền tố `"ROLE_"` ngay khi nhận dữ liệu từ `/auth/login` hoặc `/auth/me`. Nhờ vậy ứng dụng tương thích 100% với cả hai định dạng mà không cần sửa Backend.

### Quyết định 3: Cơ chế Single-Retry Queue cho Axios 401 Interceptor
- **Bối cảnh:** Khi `accessToken` hết hạn (15 phút), nhiều request đồng thời có thể nhận 401 cùng lúc, trong khi Backend áp dụng **Token Rotation** (thu hồi `refreshToken` cũ ngay sau lần gọi đầu tiên).
- **Giải pháp:** Sử dụng biến khóa `refreshPromise` (single-flight promise) trong `src/lib/api.ts` để đảm bảo chỉ gọi `POST /api/v1/auth/refresh-token` **đúng 1 lần**, sau đó phát token mới cho các request đang chờ. Nếu refresh thất bại -> xóa `localStorage` và điều hướng về `/login`.

### Quyết định 4: Duy trì Phiên Đăng Nhập Khi Nhấn F5
- **Giải pháp:** Lưu `accessToken`, `refreshToken` và `user` vào `localStorage`. Khi khởi chạy ứng dụng (`AuthProvider` mount), gọi `GET /api/v1/auth/me` để đồng bộ trạng thái tài khoản mới nhất từ server; trong lúc chờ (`loading = true`), hiển thị `Skeleton` gọn gàng, không bị nháy về `/login`.

---

## 3. Dependency Graph

```text
Task 1: Khởi tạo Vite + React 18 + TS + Tailwind + shadcn/ui (10 components)
    │
    ├── Task 2: Hạ tầng API & Auth (Types, Axios Interceptor, AuthContext, Route Guards)
    │       │
    │       ├── Task 3: 4 Màn hình Xác thực (/login, /register, /forgot-password, /reset-password) + Error Pages (/403, *)
    │       │
    │       └── Task 4: AppShell (Sidebar theo Role, Header + Avatar Dropdown, Dashboard 4 Stat Cards + Route Placeholders)
    │               │
    │               └── Checkpoint 2: Kiểm thử Build TypeScript & End-to-End Verification
```

---

## 4. Task List

### Phase 1: Project Setup & shadcn/ui Foundation
- [x] **Task 1: Khởi tạo dự án Vite React TS & Cài đặt 10 Component `shadcn/ui`**
  - Khởi tạo dự án trong `FE/`, cấu hình Tailwind CSS tông màu `Court Emerald` + `Slate/Zinc`, path alias `@/*`, `.env.example` (`VITE_API_URL=http://localhost:8080`).
  - Cài đặt đủ 10 component `shadcn/ui`: `button`, `input`, `label`, `card`, `checkbox`, `avatar`, `dropdown-menu`, `badge`, `separator`, `skeleton`.

### Checkpoint 1: Foundation & UI Primitives Ready
- [x] `npm run build` biên dịch thành công với đầy đủ 10 component trong `src/components/ui/`.

### Phase 2: Auth Infrastructure & Route Guards
- [x] **Task 2: Xây dựng Types, Axios Interceptor (`api.ts`), Auth Helpers (`auth.ts`), `AuthContext` và Route Guards**
  - Định nghĩa `ApiResponse<T>`, `User`, `Role`, `AuthResponseData` trong `src/types/auth.ts`.
  - Cài đặt `src/lib/api.ts` (gắn Bearer token, tự động refresh 1 lần khi 401).
  - Cài đặt `src/context/AuthContext.tsx` và `src/router/guards.tsx` (`ProtectedRoute`, `RoleRoute`).

### Checkpoint 2: Auth Infrastructure Ready
- [x] TypeScript typecheck (`npx tsc -b`) pass 100%, không dùng `any`.

### Phase 3: Auth Pages & Error Screens
- [x] **Task 3: Xây dựng 4 Màn hình Auth & 2 Màn hình Lỗi**
  - `/login` (`LoginPage.tsx`), `/register` (`RegisterPage.tsx`), `/forgot-password` (`ForgotPasswordPage.tsx`), `/reset-password` (`ResetPasswordPage.tsx`).
  - `/403` (`ForbiddenPage.tsx`) và `*` (`NotFoundPage.tsx`).

### Phase 4: App Shell, Role-based Sidebar, Dashboard & Placeholders
- [x] **Task 4: Xây dựng `AppShell`, `Sidebar`, `Header`, `DashboardPage` và `FeaturePlaceholder` (Không dùng Icon)**
  - `Sidebar`: Hiển thị menu động theo `ADMIN` (7 mục), `STAFF` (4 mục), `CUSTOMER` (3 mục); active item tô nền `bg-emerald-50/90` kèm thanh dọc `bg-emerald-600`.
  - `Header`: Tiêu đề trang + `Badge` role + `Avatar` (chữ cái đầu) mở `DropdownMenu` (Hồ sơ, Đăng xuất).
  - `DashboardPage`: 4 thẻ Stat KPI tĩnh theo role + 1 khung Placeholder biểu đồ.
  - `FeaturePlaceholder` & `src/router/index.tsx`: Kết nối toàn bộ routes.

### Checkpoint 3: Full App Shell & Build Verification
- [x] `npm run build` pass 100% không lỗi TypeScript.
- [x] Kiểm tra toàn bộ Definition of Done (Login/Logout/Refresh, F5 giữ phiên, Guard `/403` và `/login`).

---

## 5. Risks & Mitigations
| Nguy cơ (Risk) | Mức độ | Biện pháp xử lý (Mitigation) |
|---|---|---|
| **Lệch định dạng chuỗi Role (`ROLE_ADMIN` vs `ADMIN`)** | Cao | Tự động chuẩn hóa cắt bỏ tiền tố `ROLE_` trong `src/lib/auth.ts` ngay khi đọc dữ liệu từ BE. |
| **Gọi `/refresh-token` lặp vô hạn khi refresh token hết hạn** | Cao | Tách riêng hàm gọi refresh bằng `axios.post` độc lập và gắn cờ `_retry = true`, đồng thời bỏ qua interceptor cho các endpoint `/auth/*`. |
| **Mất URL đích khi bị đẩy ra `/login`** | Trung bình | `ProtectedRoute` truyền `<Navigate to="/login" state={{ from: location }} replace />`, `LoginPage` đọc lại và điều hướng về đúng trang sau khi login. |
