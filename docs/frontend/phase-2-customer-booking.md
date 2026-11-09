# ĐẶC TẢ CHI TIẾT FE PHASE 2: ĐẶT SÂN TRỰC TUYẾN (CUSTOMER BOOKING, M4) & CHUẨN HÓA ZINC THEME

> **Mục tiêu Phase 2:**
> 1. Khắc phục 2 điểm tồn đọng từ Phase 1: nối checkbox `"Ghi nhớ đăng nhập"` (`localStorage` vs `sessionStorage`) và chuyển toàn bộ màu nhấn sang **shadcn/ui Zinc thuần (`bg-zinc-900`)**.
> 2. Xây dựng hoàn chỉnh luồng **Đặt sân trực tuyến (`/booking`)** và **Lịch đặt của tôi (`/my-bookings`)** cho vai trò `CUSTOMER`, nối trực tiếp với Backend Module 4 (`BookingController`).
> 3. Nối dữ liệu thật từ `GET /api/v1/bookings/my` cho 2 thẻ thống kê đầu tiên của `CUSTOMER` trên trang Tổng quan (`/`).

---

## 1. Chuẩn Hóa Mục 0: Lưu Phiên `rememberMe` & Tông Màu Zinc Thuần

### 1.1. Cơ Chế Lưu Phiên Theo `"Ghi nhớ đăng nhập"` (`rememberMe`)
- Khi người dùng đăng nhập tại `/login`:
  - **Có tick `"Ghi nhớ đăng nhập"` (`rememberMe = true`, mặc định):** Lưu `accessToken`, `refreshToken`, `authUser` vào `localStorage` (giữ phiên khi đóng/mở lại trình duyệt).
  - **Bỏ tick (`rememberMe = false`):** Lưu `accessToken`, `refreshToken`, `authUser` vào `sessionStorage` (F5 vẫn giữ phiên, đóng tab là tự động mất phiên).
- **Đọc dữ liệu (`getAccessToken`, `getRefreshToken`, `getStoredUser`):** Ưu tiên đọc từ `localStorage`, nếu không có thì fallback sang `sessionStorage`.
- **Bảo toàn Storage khi Auto-Refresh 401:** Khi Axios Interceptor gọi `POST /api/v1/auth/refresh-token` và gọi `setTokens(newAccess, newRefresh)`, hàm `setTokens` tự động kiểm tra token cũ đang nằm ở storage nào để ghi đè đúng vào storage đó (tránh ghi nhầm phiên `sessionStorage` sang `localStorage`).
- **Đăng xuất (`clearAuthStorage` / `clearTokens`):** Xóa đồng thời cả 3 key (`accessToken`, `refreshToken`, `authUser`) trên **cả `localStorage` và `sessionStorage`**.

### 1.2. Quy Chuẩn Bảng Màu Zinc Thuần (`shadcn/ui Zinc`)
- Toàn bộ các thành phần tương tác chính (`Button` default/link, `Checkbox` checked, `Input` focus ring, `Badge` variant `zinc`, `Sidebar` active item & logo, `Header` avatar & hover, `AuthCardLayout` top border & logo, `DashboardStatCard` accent bar) sử dụng tông **`zinc-900` (`#18181B`)** và **`zinc-100` (`#F4F4F5`)**.
- **Ngoại lệ duy nhất giữ màu `emerald`:** Chỉ dùng cho thông báo mang ngữ nghĩa thành công (`AuthAlert variant="success"` và hộp xác nhận `"Đã gửi email"` trong `ForgotPasswordForm`).

---

## 2. Wireframes & Bố Cục Chi Tiết Màn Hình Phase 2

### 2.1. Màn Hình Đặt Sân Trực Tuyến (`/booking` — `CustomerBookingPage.tsx`)

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Đặt sân trực tuyến                                        [CUSTOMER]  [Nguyễn Văn A (NA)]|
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (bg-slate-50 / p-6)                                                                 |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | THANH CHỌN NGÀY & CỤM SÂN (BookingDateToolbar)                                               | |
| | [ < Ngày trước ]  [ 📅 2026-11-10 ]  [ Ngày sau > ]  [ Hôm nay ]     Cụm sân: [ Tất cả cụm v]| |
| | Chú thích: [• Còn trống (FREE)]  [• Đã đặt (BOOKED)]  [• Đã qua giờ (PASSED)]  [• Bảo trì]   | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +------------------------------------------------------------+ +-------------------------------+ |
| | LƯỚI SÂN & KHUNG GIỜ (CourtAvailabilityGrid - 8 cột)       | | XÁC NHẬN ĐẶT SÂN (4 cột)      | |
| |                                                            | | (BookingConfirmPanel)         | |
| | +-- Card: Sân 1 (Thảm Victor) ----------------------------+| |-------------------------------| |
| | | Cụm Sân Cầu Lông Cầu Giấy          [Badge: Sẵn sàng]    || | Sân:   Sân 1 (Thảm Victor)    | |
| | |---------------------------------------------------------|| | Cụm:   Cụm Sân Cầu Giấy       | |
| | | +------------------------+  +------------------------+  || | Ngày:  10/11/2026             | |
| | | | Sáng sớm 05:00–08:00   |  | Hành chính 08:00–16:00 |  || | Giờ:   16:00 – 21:00 (5 giờ)  | |
| | | | 05:00 - 08:00          |  | 08:00 - 16:00          |  || | Giá:   150.000 ₫ / giờ        | |
| | | | 80.000 ₫/giờ           |  | 100.000 ₫/giờ          |  || |-------------------------------| |
| | | | [Đã qua giờ] (disabled)|  | [Đã đặt] (disabled)    |  || | Tạm tính: 750.000 ₫           | |
| | | +------------------------+  +------------------------+  || |                               | |
| | |                                                         || | Ghi chú (tùy chọn):           | |
| | | +========================+  +------------------------+  || | [ Thuê thêm 2 vợt...        ] | |
| | | |*Giờ vàng 16:00–21:00  *|  | Đêm muộn 21:00–23:00   |  || |                               | |
| | | |*16:00 - 21:00         *|  | 21:00 - 23:00          |  || | [     Đặt sân (bg-zinc-900) ] | |
| | | |*150.000 ₫/giờ         *|  | 120.000 ₫/giờ          |  || | [     Bỏ chọn               ] | |
| | | |*[Đang chọn - FREE]    *|  | [Còn trống - FREE]     |  || +-------------------------------+ |
| | | +========================+  +------------------------+  ||                                   |
| | +---------------------------------------------------------+|                                   |
| +------------------------------------------------------------+                                   |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Màn Hình Lịch Đặt Của Tôi (`/my-bookings` — `MyBookingsPage.tsx`)

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Lịch đặt của tôi                                          [CUSTOMER]  [Nguyễn Văn A (NA)]|
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (bg-slate-50 / p-6)                                                                 |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | BỘ LỌC (MyBookingsFilterBar)                                                                 | |
| | Trạng thái: [Tất cả] [PENDING] [CONFIRMED] [CHECKED_IN] [COMPLETED] [CANCELLED]              | |
| | Từ ngày: [ 2026-11-01 ]  Đến ngày: [ 2026-11-30 ]  Sắp xếp: [ Ngày tạo mới nhất          v ] | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | BẢNG LỊCH SỬ ĐẶT SÂN (MyBookingsTable)                                     [ + Đặt sân mới ] | |
| |----------------------------------------------------------------------------------------------| |
| | MÃ ĐƠN | SÂN & CỤM SÂN             | NGÀY ĐẶT   | KHUNG GIỜ     | TỔNG TIỀN | TRẠNG THÁI | THAO TÁC        |
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #15    | Sân 1 (Thảm Victor)       | 2026-11-15 | 16:00 – 21:00 | 750.000 ₫ | [PENDING]  | [Đổi lịch] [Hủy]|
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #12    | Sân 2 (Thảm Yonex)        | 2026-11-12 | 08:00 – 16:00 | 800.000 ₫ | [CONFIRMED]| [Đổi lịch] [Hủy]|
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #08    | Sân 1 (Thảm Victor)       | 2026-10-20 | 16:00 – 21:00 | 750.000 ₫ | [COMPLETED]| —               |
| |----------------------------------------------------------------------------------------------| |
| | Trang 1 / 1 (Tổng 3 đơn đặt sân)                                [ < Trang trước ] [ Trang sau > ] |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Phân Tách Component (`src/components/booking/`)

| Component | Vai trò & Trách nhiệm |
|---|---|
| `BookingDateToolbar.tsx` | Chọn ngày trong khoảng `[hôm nay, hôm nay + 30 ngày]`, nút chuyển nhanh ngày trước/sau/hôm nay, lọc theo cụm sân (`complexName`). |
| `CourtAvailabilityGrid.tsx` | Hiển thị danh sách các sân và lưới khung giờ (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`), hiển thị badge bảo trì cho sân `MAINTENANCE`, hỗ trợ dùng lại trong cả màn hình `/booking` và hộp thoại đổi lịch. |
| `BookingConfirmPanel.tsx` | Hiển thị tóm tắt slot `FREE` đang chọn, tính số giờ & giá ước tính tham khảo, nhập `note`, gọi `POST /api/v1/bookings` và xử lý lỗi xung đột 409. |
| `BookingSuccessCard.tsx` | Hiển thị biên nhận đặt sân thành công (`201 Created`) với mã đơn, trạng thái `PENDING` ("đơn đang chờ thanh toán"), `totalAmount` chuẩn từ BE và điều hướng sang `/my-bookings`. |
| `MyBookingsFilterBar.tsx` | Thanh lọc theo `BookingStatus`, khoảng ngày `fromDate` – `toDate`, và sắp xếp theo đúng whitelist (`bookingDate`, `createdAt`, `totalAmount`). |
| `MyBookingsTable.tsx` | Bảng danh sách đơn đặt sân, badge trạng thái ngữ nghĩa, điều khiển phân trang, Empty State (có icon + hướng dẫn + nút sang `/booking`), kích hoạt hộp thoại Đổi lịch / Hủy lịch. |
| `CancelBookingDialog.tsx` | Hộp thoại xác nhận hủy đơn (`DELETE /api/v1/bookings/{id}`), hiển thị lỗi từ server nếu quá giờ hủy (`409 BOOKING_NOT_CANCELLABLE`). |
| `RescheduleBookingDialog.tsx` | Hộp thoại đổi lịch (`PUT /api/v1/bookings/{id}`), cho phép chọn ngày mới và slot `FREE` mới trên `CourtAvailabilityGrid`, bắt lỗi `409 BOOKING_NOT_RESCHEDULABLE` / `409 SLOT_ALREADY_BOOKED`. |

