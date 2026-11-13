# TỔNG QUAN KIẾN TRÚC FRONTEND (FRONTEND ARCHITECTURE HUB)

> **Dành cho:** Frontend Engineers & AI Coding Agents tham gia phát triển giao diện hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong`.  
> **Thư mục mã nguồn:** [`FE/`](../../FE)  
> **Triết lý thiết kế:** **Modern Sport-Tech SaaS (shadcn/ui Zinc/Slate `#18181B` + Soft Tonal Badges)** — Tối giản, sắc nét theo chuẩn `shadcn/ui Zinc` mặc định, kết hợp các nhãn ngữ nghĩa Pastel dịu mắt và phân cấp Typography rõ ràng.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Phiên bản / Ghi chú |
|---|---|---|
| **Core Framework** | React 18 + Vite | Fast HMR, ESM bundler |
| **Language** | TypeScript (`strict: true`) | Tuyệt đối không dùng `any` tràn lan; định nghĩa đầy đủ interface DTO |
| **Styling & Tokens** | Tailwind CSS + CSS Variables | Cấu hình chuẩn tông màu `Zinc` của shadcn/ui |
| **UI Component System** | **shadcn/ui** (Radix UI Primitives) | Sở hữu mã nguồn trực tiếp trong `src/components/ui/` |
| **Routing** | React Router v6 (`BrowserRouter`, `Routes`) | Tích hợp `ProtectedRoute` và `RoleRoute` (RBAC Guard) |
| **State Management** | React Context API (`AuthContext`) | Quản lý phiên đăng nhập gọn nhẹ, không phụ thuộc Redux/Zustand |
| **HTTP Client** | Axios | Request Interceptor (gắn JWT) & Response Interceptor (Auto Refresh Token 1 lần khi 401) |
| **Icons** | `lucide-react` (chuẩn mặc định đi kèm shadcn CLI) | Đồng bộ `strokeWidth={1.75}` hoặc `2`, kích thước `size-4` (16px) / `size-5` (20px) |

---

## 2. Cấu Trúc Thư Mục (`FE/src`) & Quy Tắc Phân Tách Component

> **QUY TẮC BẮT BUỘC (Component Decomposition Rule):**
> - **Tuyệt đối KHÔNG dồn toàn bộ code vào 1 file Page.**
> - Các thành phần giao diện con (Form, Card, Bảng, Bộ lọc, Banner, Alert, Ô nhập liệu đặc thù...) phải được tách thành **Component con độc lập** trong `FE/src/components/<feature>/`.
> - Các file trang trong `FE/src/pages/<feature>/*Page.tsx` chỉ đóng vai trò **Page Composer** (kết nối route/params và ghép các component con lại với nhau).

```text
FE/
├── .env.example                        # Biến môi trường mẫu (VITE_API_URL=http://localhost:8080)
├── .gitignore                          # Loại bỏ node_modules, dist, .env khỏi Git
├── components.json                     # Cấu hình shadcn/ui CLI
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── components/
    │   ├── ui/                         # 10 nguyên tử giao diện chuẩn từ shadcn/ui
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── separator.tsx
    │   │   └── skeleton.tsx
    │   ├── layout/                     # Khung ứng dụng sau khi đăng nhập (Không dùng icon)
    │   │   ├── AppShell.tsx            # Bố cục chính: Sidebar (trái) + Header (trên) + Outlet (nội dung)
    │   │   ├── Sidebar.tsx             # Menu điều hướng tự động lọc theo vai trò (ADMIN/STAFF/CUSTOMER)
    │   │   ├── Header.tsx              # Tiêu đề trang hiện tại + Badge Role + Avatar Dropdown
    │   │   └── FeaturePlaceholder.tsx  # Khung chờ chuẩn hóa cho các màn hình nghiệp vụ Phase sau
    │   ├── auth/                       # Các component con của phân hệ Xác thực
    │   │   ├── AuthCardLayout.tsx      # Khung Card xác thực + Logo quả cầu lông + Header/Footer
    │   │   ├── PasswordField.tsx       # Ô nhập mật khẩu kèm nút ẩn/hiện dùng chung
    │   │   ├── AuthAlert.tsx           # Hộp hiển thị thông báo lỗi / thành công / cảnh báo
    │   │   ├── LoginForm.tsx           # Form đăng nhập
    │   │   ├── RegisterForm.tsx        # Form đăng ký tài khoản
    │   │   ├── ForgotPasswordForm.tsx  # Form gửi email khôi phục mật khẩu
    │   │   └── ResetPasswordForm.tsx   # Form đặt lại mật khẩu mới
    │   ├── booking/                    # Các component con của phân hệ Đặt sân (Online, POS & Check-in)
    │   │   ├── BookingDateToolbar.tsx       # Thanh chọn ngày [hôm nay, +30 ngày] & lọc cụm sân
    │   │   ├── CourtAvailabilityGrid.tsx    # Lưới hiển thị sân và các khung giờ (FREE/BOOKED/PASSED/UNAVAILABLE)
    │   │   ├── BookingConfirmPanel.tsx      # Panel xác nhận đặt sân online cho CUSTOMER
    │   │   ├── BookingSuccessCard.tsx       # Biên nhận đặt sân online thành công (PENDING)
    │   │   ├── MyBookingsFilterBar.tsx      # Bộ lọc trạng thái, khoảng ngày & sắp xếp lịch đặt
    │   │   ├── MyBookingsTable.tsx          # Bảng lịch sử đặt sân của CUSTOMER
    │   │   ├── CancelBookingDialog.tsx      # Hộp thoại xác nhận hủy lịch đặt sân
    │   │   ├── RescheduleBookingDialog.tsx  # Hộp thoại đổi lịch đặt sân
    │   │   ├── PosBookingConfirmPanel.tsx   # Panel đặt sân tại quầy (POS) với quy tắc XOR khách hàng
    │   │   ├── PosBookingSuccessCard.tsx    # Biên nhận đặt sân tại quầy thành công (CONFIRMED)
    │   │   ├── CheckInFormCard.tsx          # Form nhập mã đơn check-in & 4 điều kiện hợp lệ
    │   │   └── CheckInResultCard.tsx        # Thẻ kết quả xác nhận khách đã nhận sân (CHECKED_IN)
    │   ├── voucher/                    # Các component con của phân hệ Khuyến mãi / Voucher
    │   │   ├── AdminVouchersView.tsx        # View tổng hợp quản lý voucher dành cho ADMIN
    │   │   ├── AdminVoucherFilterBar.tsx    # Thanh tìm kiếm, lọc trạng thái, sắp xếp và nút tạo mới
    │   │   ├── AdminVoucherTable.tsx        # Bảng danh sách voucher, bật/tắt nhanh, sửa, xóa
    │   │   ├── VoucherFormDialog.tsx        # Modal tạo mới và cập nhật thông tin voucher
    │   │   ├── DeleteVoucherDialog.tsx      # Modal xác nhận xóa voucher (hard delete vs soft deactivate)
    │   │   ├── CustomerVouchersView.tsx     # View voucher khả dụng & form áp mã cho CUSTOMER
    │   │   ├── ActiveVoucherCard.tsx        # Thẻ voucher hoạt động (sao chép mã + áp dụng ngay)
    │   │   ├── ApplyVoucherForm.tsx         # Form nhập mã đơn & voucher kèm chọn nhanh đơn PENDING
    │   │   ├── ConfirmApplyVoucherDialog.tsx # Modal cảnh báo hành động 1 chiều trước khi áp mã
    │   │   └── ApplyVoucherResultCard.tsx   # Thẻ biên nhận số tiền giảm và tổng thanh toán sau áp mã
    │   └── dashboard/                  # Các component con của trang Tổng quan
    │       ├── DashboardWelcomeBanner.tsx    # Banner chào mừng người dùng theo vai trò
    │       ├── DashboardStatCard.tsx         # Thẻ KPI đơn lẻ (số monospace + tonal badge)
    │       ├── DashboardStatsGrid.tsx        # Lưới 4 thẻ KPI theo từng vai trò (ADMIN/STAFF/CUSTOMER)
    │       └── DashboardChartPlaceholder.tsx # Khung chờ biểu đồ doanh thu & công suất
    ├── context/
    │   └── AuthContext.tsx             # AuthProvider: user, loading, login, logout, refreshUser
    ├── hooks/
    │   └── useAuth.ts                  # Hook truy cập nhanh AuthContext có kiểm tra null-safety
    ├── lib/
    │   ├── utils.ts                    # Hàm cn() (clsx + tailwind-merge) của shadcn
    │   ├── api.ts                      # Axios instance + Request/Response Interceptors
    │   ├── auth.ts                     # Các hàm lưu/xóa localStorage và chuẩn hóa Role
    │   ├── booking.ts                  # Các hàm gọi API và tiện ích đặt sân / check-in
    │   └── voucher.ts                  # Các hàm gọi API và tiện ích định dạng voucher
    ├── pages/                          # Các trang Page mỏng (chỉ ghép nối các component con)
    │   ├── auth/
    │   │   ├── LoginPage.tsx           # /login (ghép AuthCardLayout + LoginForm)
    │   │   ├── RegisterPage.tsx        # /register (ghép AuthCardLayout + RegisterForm)
    │   │   ├── ForgotPasswordPage.tsx  # /forgot-password (ghép AuthCardLayout + ForgotPasswordForm)
    │   │   └── ResetPasswordPage.tsx   # /reset-password (ghép AuthCardLayout + ResetPasswordForm)
    │   ├── booking/
    │   │   ├── CustomerBookingPage.tsx # /booking (Đặt sân trực tuyến cho CUSTOMER)
    │   │   ├── MyBookingsPage.tsx      # /my-bookings (Lịch đặt của tôi cho CUSTOMER)
    │   │   ├── PosBookingPage.tsx      # /pos (Đặt sân tại quầy cho STAFF / ADMIN)
    │   │   └── CheckInPage.tsx         # /check-in (Check-in khách vào sân cho STAFF / ADMIN)
    │   ├── voucher/
    │   │   └── VouchersPage.tsx        # /vouchers (Ghép AdminVouchersView hoặc CustomerVouchersView)
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx       # / (ghép Banner + StatsGrid + ChartPlaceholder)
    │   └── errors/
    │       ├── ForbiddenPage.tsx       # /403 (Không có quyền truy cập)
    │       └── NotFoundPage.tsx        # * (404 Không tìm thấy trang)
    ├── router/
    │   ├── index.tsx                   # Khai báo toàn bộ bảng định tuyến (Route Table)
    │   └── guards.tsx                  # ProtectedRoute (yêu cầu đăng nhập) & RoleRoute (kiểm tra quyền)
    ├── types/
    │   ├── auth.ts                     # TypeScript interfaces khớp 100% với Backend DTO Auth/User
    │   ├── booking.ts                  # TypeScript interfaces khớp 100% với Backend DTO Booking
    │   └── voucher.ts                  # TypeScript interfaces khớp 100% với Backend DTO Voucher
    ├── App.tsx
    ├── main.tsx
    └── index.css                       # Khai báo CSS Variables tông màu chuẩn shadcn/ui Zinc + Slate
```

---

## 3. Bản Đồ Trang & Phân Quyền Route (Page & RBAC Map)

Hệ thống Frontend bao gồm tổng cộng **16 đường dẫn (Routes)**, chia thành 3 nhóm:

### 3.1. Nhóm Xác thực Công khai (Public Auth Routes — 4 trang)
| STT | Đường dẫn | Tên màn hình | Trạng thái Phase 1 |
|:---:|---|---|---|
| 1 | `/login` | Đăng nhập hệ thống | **Hoàn thiện 100% (Nối API thật)** |
| 2 | `/register` | Đăng ký tài khoản khách hàng | **Hoàn thiện 100% (Nối API thật)** |
| 3 | `/forgot-password` | Yêu cầu khôi phục mật khẩu | **Hoàn thiện 100% (Nối API thật)** |
| 4 | `/reset-password` | Đặt lại mật khẩu mới (`?token=...`) | **Hoàn thiện 100% (Nối API thật)** |

### 3.2. Nhóm Ứng dụng Nội bộ theo Vai trò (Protected App Shell Routes — 10 trang)
| STT | Đường dẫn | Tên hiển thị trên Sidebar | `ADMIN` | `STAFF` | `CUSTOMER` | Trạng thái |
|:---:|---|---|:---:|:---:|:---:|---|
| 5 | `/` | Tổng quan (Dashboard) | ✅ | ✅ | *(Redirect `/booking` hoặc xem tổng quan)* | **AppShell + 4 Stat Cards + Panel chờ** |
| 6 | `/bookings` | Quản lý đặt sân | ✅ | ❌ | ❌ | Placeholder + Badge `"Phase sau"` |
| 7 | `/courts` | Quản lý sân & Khung giờ | ✅ | ❌ | ❌ | Placeholder + Badge `"Phase sau"` |
| 8 | `/users` | Quản lý người dùng | ✅ | ❌ | ❌ | Placeholder + Badge `"Phase sau"` |
| 9 | `/payments` | Thanh toán & Hoàn tiền | ✅ | ✅ | ❌ | Placeholder + Badge `"Phase sau"` |
| 10 | `/vouchers` | Khuyến mãi / Ưu đãi | ✅ *(Quản lý)* | ❌ | ✅ *(Xem mã & áp mã)* | **Hoàn thiện 100% (Nối API thật)** |
| 11 | `/reports` | Báo cáo thống kê | ✅ | ❌ | ❌ | Placeholder + Badge `"Phase sau"` |
| 12 | `/pos` | Đặt sân tại quầy (POS) | ✅ | ✅ | ❌ | **Hoàn thiện 100% (Nối API thật)** |
| 13 | `/check-in` | Check-in khách đến sân | ✅ | ✅ | ❌ | **Hoàn thiện 100% (Nối API thật)** |
| 14 | `/booking` | Đặt sân trực tuyến | ❌ | ❌ | ✅ | **Hoàn thiện 100% (Nối API thật)** |
| 15 | `/my-bookings` | Lịch đặt của tôi | ❌ | ❌ | ✅ | **Hoàn thiện 100% (Nối API thật)** |

### 3.3. Nhóm Trang Lỗi (Error Routes — 2 trang)
| STT | Đường dẫn | Tên màn hình | Mô tả |
|:---:|---|---|---|
| 16 | `/403` | Không có quyền truy cập | Hiển thị khi `RoleRoute` phát hiện user không có quyền vào route mục tiêu |
| 17 | `*` | Không tìm thấy trang (404) | Hiển thị khi truy cập URL không tồn tại |

---

## 4. Chỉ Mục Tài Liệu Frontend

1. 🎨 **Hệ thống Thiết kế UI/UX & Bảng màu Zinc (Design System):** [`docs/frontend/design-system.md`](design-system.md)
2. 🔐 **Đặc tả Chi tiết Phase 1 (Auth + App Shell + Wireframes):** [`docs/frontend/phase-1-auth-appshell.md`](phase-1-auth-appshell.md)
3. 🏸 **Đặc tả Chi tiết Phase 2 (Customer Booking + My Bookings):** [`docs/frontend/phase-2-customer-booking.md`](phase-2-customer-booking.md)
4. 🏪 **Đặc tả Chi tiết Phase 3 (POS Booking + Check-in):** [`docs/frontend/phase-3-pos-checkin.md`](phase-3-pos-checkin.md)
5. 🎟️ **Đặc tả Chi tiết Phase 4 (Voucher Management + Apply Voucher):** [`docs/frontend/phase-4-vouchers.md`](phase-4-vouchers.md)
