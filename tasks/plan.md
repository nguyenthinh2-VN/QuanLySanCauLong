# Implementation Plan: FE Phase 2 — Đặt sân trực tuyến (Customer Booking, Module 4) + Sửa 2 Nits Phase 1

## 1. Overview
Xây dựng **FE Phase 2** cho hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong`:
1. **Mục 0 (Sửa 2 Nits Phase 1 trước khi làm màn hình mới):**
   - **0.1:** Nối checkbox `"Ghi nhớ đăng nhập"` (`rememberMe`) xuyên suốt từ `LoginForm` $\rightarrow$ `LoginPage` $\rightarrow$ `AuthContext.login` $\rightarrow$ `src/lib/auth.ts` (`localStorage` khi tick, `sessionStorage` khi bỏ tick, bảo toàn storage khi Axios tự động refresh token 401, xóa sạch cả 2 storage khi logout).
   - **0.2:** Chuyển đổi toàn bộ màu nhấn chủ đạo từ `emerald` sang **Zinc thuần (`bg-zinc-900`, `text-zinc-900`, `border-zinc-900`)** trên toàn bộ UI primitives, Layout (`Sidebar`, `Header`), Dashboard, Auth pages và cập nhật đồng bộ tài liệu `docs/frontend/README.md` & `docs/frontend/design-system.md`. Chỉ giữ `emerald` cho ngữ nghĩa thành công (`AuthAlert variant="success"` và hộp `"Đã gửi email"` trong `ForgotPasswordForm`).
2. **Mục 1 (`/booking` — Đặt sân trực tuyến cho CUSTOMER):**
   - Bộ chọn ngày (`[hôm nay, hôm nay + 30 ngày]`) kèm nút lùi/tiến ngày.
   - Lưới lịch trống theo thời gian thực (`GET /api/v1/bookings/availability?date=YYYY-MM-DD`), nhóm theo từng sân kèm cụm sân, hiển thị rõ 4 trạng thái slot (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`) và trạng thái sân (`AVAILABLE`, `MAINTENANCE`).
   - Panel xác nhận đặt sân khi chọn 1 slot `FREE` (hiển thị sân, ngày, khung giờ, giá ước tính tham khảo, ô nhập `note` tùy chọn) $\rightarrow$ gọi `POST /api/v1/bookings` $\rightarrow$ nhận `201 Created` $\rightarrow$ hiển thị màn hình đặt thành công với mã đơn, trạng thái `PENDING`, `totalAmount` chuẩn từ BE và nút chuyển sang `/my-bookings`.
   - Xử lý race condition `409 SLOT_ALREADY_BOOKED` (tự động refetch availability, xóa slot đang chọn và hiển thị thông báo lỗi tiếng Việt từ BE).
3. **Mục 2 (`/my-bookings` — Lịch đặt của tôi cho CUSTOMER):**
   - Bảng danh sách lịch đặt (`GET /api/v1/bookings/my`) có bộ lọc trạng thái (`Tất cả`, `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`), lọc khoảng ngày (`fromDate`, `toDate`), sắp xếp trong whitelist BE (`bookingDate`, `createdAt`, `totalAmount`) và phân trang (`size=10`).
   - Thao tác **Hủy lịch** (`DELETE /api/v1/bookings/{id}`) qua hộp thoại xác nhận và **Đổi lịch** (`PUT /api/v1/bookings/{id}`) qua hộp thoại chọn ngày & slot trống tái sử dụng lưới availability.
4. **Mục 3 (Dashboard CUSTOMER — Nối số liệu thật):**
   - Nối 2 thẻ thống kê đầu tiên của `CUSTOMER` trên `DashboardStatsGrid` với dữ liệu thật từ `GET /api/v1/bookings/my` (`totalElements` cho *"Lịch đặt sắp tới"* và *"Đã hoàn thành"*).

---

## 2. Code Review Phase 1 (Theo `/code-review-and-quality` — 5 Trục Đánh Giá)

| Trục Review | Phát hiện (Findings) trong Codebase Phase 1 hiện tại | Giải pháp khắc phục tại Mục 0 |
|---|---|---|
| **1. Correctness** | **Required (Nit 0.1):** `LoginForm.tsx:24` có state `rememberMe` (mặc định `true`) nhưng `onLoginSubmit(email, password)` chỉ truyền 2 tham số. `src/lib/auth.ts` ghi cứng vào `localStorage`.<br>**Subtle Bug khi Refresh 401:** `api.ts:75` gọi `setTokens(payload.accessToken, payload.refreshToken)` không truyền `rememberMe`. Nếu user không tick `rememberMe` (lưu ở `sessionStorage`), khi token hết hạn sau 15 phút, interceptor refresh sẽ ghi nhầm token mới sang `localStorage`. | - Mở rộng chữ ký `onLoginSubmit(email, password, rememberMe)` và `AuthContext.login(email, password, rememberMe = true)`.<br>- Trong `src/lib/auth.ts`, khi `rememberMe` không được truyền vào `setTokens` / `setStoredUser` (như lúc refresh 401 hoặc `/auth/me`), tự động kiểm tra nơi đang lưu token hiện tại (`localStorage` hay `sessionStorage`) để ghi đúng vào storage đó.<br>- `clearTokens()` / `clearAuthStorage()` xóa cả 2 storage. |
| **2. Consistency & Design System** | **Required (Nit 0.2):** `emerald` đang xuất hiện tại **18 files** trong `FE/src/` (bao gồm cả `index.css`, `NotFoundPage.tsx:16`, `ForgotPasswordPage.tsx:20`, `ResetPasswordPage.tsx:17`, `RegisterPage.tsx:18,29`) và 2 files tài liệu trong `docs/frontend/`. | - Đổi toàn bộ accent sang `zinc-900` / `zinc-100`.<br>- Chuyển toast của `RegisterPage.tsx` sang dùng `AuthAlert variant="success"` (hoặc style zinc) để khi chạy `grep emerald FE/src/` **chỉ còn đúng 2 nơi ngữ nghĩa success**: `AuthAlert.tsx` và `ForgotPasswordForm.tsx`.<br>- Cập nhật `docs/frontend/README.md` và `docs/frontend/design-system.md` sang tông màu chủ đạo `shadcn/ui Zinc`. |
| **3. Architecture** | Tuân thủ tốt quy tắc **Component Decomposition**: `pages/` mỏng, tách biệt rõ với `components/`. Tuy nhiên `DashboardStatsGrid.tsx` đang thuần tĩnh. | - Tạo `src/types/booking.ts` và `src/lib/booking.ts` (hoặc service helpers) tách biệt.<br>- Tách bộ component đặt sân vào `src/components/booking/*`. |
| **4. Security** | `RoleRoute` và `ProtectedRoute` hoạt động chuẩn. Lưu ý ở `/my-bookings`: chỉ cho phép truyền `sort` thuộc whitelist `['bookingDate', 'createdAt', 'totalAmount']`. | - Định nghĩa kiểu chặt `BookingSortField = 'bookingDate' | 'createdAt' | 'totalAmount'` để ngăn truyền trường sort ngoài whitelist gây lỗi 400. |
| **5. Performance** | Khi `CUSTOMER` vào Dashboard, cần lấy 2 chỉ số thật mà không tải thừa dữ liệu. | - Gọi song song `Promise.all` với `size=1` (`GET /api/v1/bookings/my?fromDate=<today>&size=1` và `GET /api/v1/bookings/my?status=COMPLETED&size=1`), đọc `data.totalElements` siêu nhẹ. |

---

## 3. Thiết Kế Mock UI (ASCII Wireframes — Tông Zinc Thuần)

### 3.1. Màn hình `/booking` — Đặt sân trực tuyến (`CustomerBookingPage`)

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Đặt sân trực tuyến                                        [CUSTOMER]  [Nguyễn Văn A (NA)]|
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (bg-slate-50 / p-6)                                                                 |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | CHỌN NGÀY ĐẶT SÂN                                               Khoảng cho phép: 30 ngày tới | |
| | [ < Ngày trước ]  [ 📅 2026-11-10 (Thứ Ba) ]  [ Ngày sau > ]   [ Hôm nay ]   [Lọc cụm sân v] | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +------------------------------------------------------------+ +-------------------------------+ |
| | DANH SÁCH SÂN & KHUNG GIỜ TRỐNG (Cột trái - 8/12)          | | XÁC NHẬN ĐẶT SÂN (Cột phải 4) | |
| |                                                            | | (Sticky Panel)                | |
| | +-- Card: Sân 1 (Thảm Victor) ----------------------------+| |-------------------------------| |
| | | Cụm Sân Cầu Lông Cầu Giấy          [Badge: Sẵn sàng]    || | Sân đã chọn:                  | |
| | |---------------------------------------------------------|| | Sân 1 (Thảm Victor)           | |
| | | +------------------------+  +------------------------+  || | Cụm Sân Cầu Lông Cầu Giấy     | |
| | | | Sáng sớm 05:00–08:00   |  | Hành chính 08:00–16:00 |  || |                               | |
| | | | 05:00 - 08:00          |  | 08:00 - 16:00          |  || | Ngày đặt:     10/11/2026      | |
| | | | 80.000 ₫/giờ           |  | 100.000 ₫/giờ          |  || | Khung giờ:    16:00 – 21:00   | |
| | | | [Đã qua giờ - PASSED]  |  | [Đã có người đặt]      |  || | Số giờ:       5 giờ           | |
| | | +------------------------+  +------------------------+  || | Đơn giá:      150.000 ₫/giờ   | |
| | |                                                         || |-------------------------------| |
| | | +========================+  +------------------------+  || | Tạm tính:     750.000 ₫       | |
| | | |*Giờ vàng 16:00–21:00  *|  | Đêm muộn 21:00–23:00   |  || | (Tổng tiền chính thức do      | |
| | | |*16:00 - 21:00         *|  | 21:00 - 23:00          |  || |  hệ thống xác nhận khi tạo)   | |
| | | |*150.000 ₫/giờ         *|  | 120.000 ₫/giờ          |  || |                               | |
| | | |*[Đang chọn - FREE]    *|  | [Còn trống - FREE]     |  || | Ghi chú (tùy chọn):           | |
| | | +========================+  +------------------------+  || | [ Thuê thêm 2 vợt...        ] | |
| | +---------------------------------------------------------+| |                               | |
| |                                                            | | [   Xác nhận đặt sân (Zinc) ] | |
| | +-- Card: Sân 3 (Thảm Lining) ----------------------------+| | [   Bỏ chọn khung giờ       ] | |
| | | Cụm Sân Cầu Lông Thanh Xuân        [Badge: Đang bảo trì]|| +-------------------------------+ |
| | |---------------------------------------------------------||                                   |
| | | [ 05:00–08:00 Không khả dụng ] [ 08:00–16:00 Không... ] ||                                   |
| | +---------------------------------------------------------+|                                   |
| +------------------------------------------------------------+                                   |
+--------------------------------------------------------------------------------------------------+
```

#### Trạng thái sau khi đặt thành công (`201 Created` từ `POST /api/v1/bookings`):
```text
+--------------------------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------------------------+ |
| | [Badge: ĐẶT SÂN THÀNH CÔNG]                                                  Mã đơn: #BK-15  | |
| | Đơn đặt sân của bạn đã được ghi nhận và đang chờ thanh toán (PENDING)                        | |
| |----------------------------------------------------------------------------------------------| |
| |  • Sân cầu lông:   Sân 1 (Thảm Victor) — Cụm Sân Cầu Lông Cầu Giấy                           | |
| |  • Ngày & Giờ:     2026-11-10 · 16:00 – 21:00 (Giờ vàng chiều tối 16:00–21:00)               | |
| |  • Trạng thái:     [Badge amber: PENDING - Đang chờ thanh toán]                              | |
| |  • Tổng tiền:      750.000 ₫ (Số tiền chuẩn từ hệ thống Backend)                             | |
| |  • Ghi chú:        Thuê thêm 2 vợt cầu lông và 1 hộp cầu                                     | |
| |----------------------------------------------------------------------------------------------| |
| |  [ Xem lịch đặt của tôi (/my-bookings) ]            [ Đặt thêm khung giờ khác ]              | |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

---

### 3.2. Màn hình `/my-bookings` — Lịch đặt của tôi (`MyBookingsPage`)

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Lịch đặt của tôi                                          [CUSTOMER]  [Nguyễn Văn A (NA)]|
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (bg-slate-50 / p-6)                                                                 |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | BỘ LỌC & SẮP XẾP                                                                             | |
| | Trạng thái: [Tất cả (zinc)] [PENDING] [CONFIRMED] [CHECKED_IN] [COMPLETED] [CANCELLED]       | |
| | Từ ngày: [ 2026-11-01 ]  Đến ngày: [ 2026-11-30 ]  Sắp xếp: [ Mới tạo gần nhất (createdAt) v]| |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | DANH SÁCH LỊCH ĐẶT SÂN (Tổng: 12 đơn)                                      [ + Đặt sân mới ] | |
| |----------------------------------------------------------------------------------------------| |
| | MÃ ĐƠN | SÂN & CỤM SÂN             | NGÀY ĐẶT   | KHUNG GIỜ     | TỔNG TIỀN | TRẠNG THÁI | THAO TÁC        |
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #15    | Sân 1 (Thảm Victor)       | 2026-11-15 | 16:00 – 21:00 | 750.000 ₫ | [PENDING]  | [Đổi lịch] [Hủy]|
| |        | Cụm Sân Cầu Giấy          |            | Giờ vàng      |           | Chờ TT     |                 |
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #12    | Sân 2 (Thảm Yonex)        | 2026-11-12 | 08:00 – 16:00 | 800.000 ₫ | [CONFIRMED]| [Đổi lịch] [Hủy]|
| |        | Cụm Sân Cầu Giấy          |            | Hành chính    |           | Đã xác nhận|                 |
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #08    | Sân 1 (Thảm Victor)       | 2026-10-20 | 16:00 – 21:00 | 750.000 ₫ | [COMPLETED]| (Đã hoàn tất)   |
| |--------|---------------------------|------------|---------------|-----------|------------|-----------------|
| | #05    | Sân 3 (Thảm Lining)       | 2026-10-18 | 21:00 – 23:00 | 240.000 ₫ | [CANCELLED]| (Đã hủy)        |
| |----------------------------------------------------------------------------------------------| |
| | Trang 1 / 2 (Hiển thị 10 đơn mỗi trang)                         [ < Trang trước ] [ Trang sau > ] |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

#### Modal / Dialog Đổi Lịch Đặt Sân (`RescheduleBookingDialog`) & Hủy Lịch (`CancelBookingDialog`):
```text
+-----------------------------------------------------------------------+
| ĐỔI LỊCH ĐẶT SÂN — Đơn #15                                      [ X ] |
| Hiện tại: Sân 1 · Ngày 2026-11-15 · 16:00 – 21:00 (750.000 ₫)         |
|-----------------------------------------------------------------------|
| [!] Thông báo lỗi từ Server nếu có (VD: 409 BOOKING_NOT_RESCHEDULABLE)|
|                                                                       |
| 1. Chọn ngày mới:  [ < ] [ 2026-11-16 ] [ > ]                         |
| 2. Chọn sân & khung giờ trống mới (Tái sử dụng AvailabilityGrid):     |
|    +---------------------------------------------------------------+  |
|    | Sân 2 (Thảm Yonex) — Cụm Sân Cầu Giấy                         |  |
|    | [ 08:00–16:00 (100k/h) - Đang chọn ]  [ 16:00–21:00 - Đã đặt ]|  |
|    +---------------------------------------------------------------+  |
| 3. Ghi chú cập nhật: [ Đổi sang sáng Chủ Nhật...                    ] |
|-----------------------------------------------------------------------|
|                                    [ Đóng ]  [ Lưu thay đổi (Zinc) ]  |
+-----------------------------------------------------------------------+
```

---

## 4. Dependency Graph & Thứ Tự Triển Khai

```text
Task 1 (Mục 0.1 & 0.2): Sửa rememberMe (localStorage/sessionStorage) + Đổi theme Emerald -> Zinc + Cập nhật Docs FE
    │
    ├── Task 2: Khởi tạo Types & API Helpers cho Module 4 (src/types/booking.ts, src/lib/booking.ts)
    │       │
    │       ├── Task 3 (Mục 1): Màn hình /booking (DateBar + AvailabilityGrid + ConfirmPanel + SuccessView)
    │       │       │
    │       │       └── Task 4 (Mục 2): Màn hình /my-bookings (FilterBar + BookingsTable + CancelDialog + RescheduleDialog)
    │       │               │
    │       │               └── Task 5 (Mục 3): Nối API thật cho Dashboard CUSTOMER + Cập nhật Router & Docs README
```

---

## 5. Task List

### Phase 0: Sửa 2 Nits Phase 1 (`rememberMe` & Zinc Theme)
- [ ] **Task 1: Hoàn thiện `rememberMe` Storage & Chuyển đổi toàn bộ Accent `emerald` $\rightarrow$ `zinc`**
  - Sửa `src/lib/auth.ts`, `src/context/AuthContext.tsx`, `src/components/auth/LoginForm.tsx`, `src/pages/auth/LoginPage.tsx` để hỗ trợ lưu `localStorage` (khi tick) hoặc `sessionStorage` (khi bỏ tick) và xóa sạch cả 2 khi logout.
  - Đổi toàn bộ class `emerald` làm màu nhấn sang `zinc` trong `index.css`, `ui/button.tsx`, `ui/checkbox.tsx`, `ui/input.tsx`, `ui/badge.tsx`, `Sidebar.tsx`, `Header.tsx`, `FeaturePlaceholder.tsx`, `Dashboard*`, `AuthCardLayout.tsx`, `LoginForm.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `NotFoundPage.tsx`.
  - Cập nhật `docs/frontend/README.md` và `docs/frontend/design-system.md` sang tông màu Zinc thuần.

### Checkpoint 1: Kiểm chứng Mục 0
- [ ] `npm run build` PASS.
- [ ] Kiểm tra `grep emerald FE/src/` chỉ còn đúng ở `AuthAlert.tsx` và `ForgotPasswordForm.tsx`.
- [ ] Kiểm tra `grep emerald docs/frontend/` không còn dòng nào gọi emerald là màu chủ đạo/brand color.

### Phase 1: Hạ tầng Kiểu Dữ Liệu & Dịch Vụ Đặt Sân (Module 4 Foundation)
- [ ] **Task 2: Tạo `src/types/booking.ts` & `src/lib/booking.ts`**
  - Định nghĩa đầy đủ DTO khớp 100% Backend: `SlotStatus`, `CourtStatus`, `BookingStatus`, `TimeSlotAvailability`, `CourtAvailabilityResponse`, `CreateBookingRequest`, `UpdateBookingRequest`, `BookingResponse`, `PageResponse<T>`, `BookingSortField`.
  - Viết các hàm gọi API chuẩn qua `api.ts` và các hàm định dạng tiền tệ (`formatVnd`), ngày giờ (`formatDateVi`, `formatTimeRange`), tính số giờ ước tính của slot.

### Phase 2: Màn hình `/booking` — Đặt sân trực tuyến
- [ ] **Task 3: Xây dựng các Component Đặt sân (`src/components/booking/*`) & `CustomerBookingPage.tsx`**
  - `BookingDateToolbar.tsx`: Chọn ngày (`[hôm nay, hôm nay + 30 ngày]`), nút hôm nay / ngày trước / ngày sau, lọc theo cụm sân.
  - `CourtAvailabilityGrid.tsx`: Hiển thị danh sách sân và các ô slot (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`), xử lý sân `MAINTENANCE`, skeleton loading, retry khi lỗi.
  - `BookingConfirmPanel.tsx`: Panel xác nhận slot đang chọn, tính giá ước tính tham khảo, nhập `note`, nút `"Đặt sân"` gọi `POST /api/v1/bookings`, xử lý race 409 `SLOT_ALREADY_BOOKED` (tự động refetch availability).
  - `BookingSuccessCard.tsx`: Hiển thị kết quả `201 Created` với `totalAmount` từ BE, trạng thái `PENDING` ("đơn đang chờ thanh toán") và nút sang `/my-bookings`.
  - `src/pages/booking/CustomerBookingPage.tsx`: Page Composer ghép nối các component trên.

### Checkpoint 2: Kiểm chứng `/booking`
- [ ] `npm run build` PASS; luồng chọn ngày $\rightarrow$ chọn slot $\rightarrow$ đặt sân hoạt động trơn tru.

### Phase 3: Màn hình `/my-bookings` — Lịch đặt của tôi & Dashboard CUSTOMER
- [ ] **Task 4: Xây dựng các Component Lịch đặt của tôi & `MyBookingsPage.tsx`**
  - `MyBookingsFilterBar.tsx`: Lọc theo `BookingStatus`, `fromDate`, `toDate`, và `sort` trong whitelist (`bookingDate`, `createdAt`, `totalAmount`).
  - `MyBookingsTable.tsx`: Bảng lịch sử đặt sân, badge trạng thái, phân trang, empty state (kèm icon + câu hướng dẫn + nút sang `/booking`), kiểm tra điều kiện hiển thị nút **Đổi lịch** / **Hủy**.
  - `CancelBookingDialog.tsx`: Hộp thoại xác nhận gọi `DELETE /api/v1/bookings/{id}`, bắt lỗi 409 `BOOKING_NOT_CANCELLABLE`.
  - `RescheduleBookingDialog.tsx`: Hộp thoại đổi lịch gọi `PUT /api/v1/bookings/{id}`, tái sử dụng `CourtAvailabilityGrid` để chọn ngày/slot mới, bắt lỗi 409 `BOOKING_NOT_RESCHEDULABLE`.
  - `src/pages/booking/MyBookingsPage.tsx`: Page Composer mỏng.
- [ ] **Task 5: Nối dữ liệu thật cho Dashboard `CUSTOMER`, Cập nhật Router & Tài liệu**
  - Trong `DashboardStatsGrid.tsx` (hoặc `DashboardPage.tsx`), khi role là `CUSTOMER`, gọi `GET /api/v1/bookings/my?fromDate=<today>&size=1` và `GET /api/v1/bookings/my?status=COMPLETED&size=1` để lấy `totalElements` thật cho 2 thẻ `"Lịch đặt sắp tới"` và `"Đã hoàn thành"`.
  - Thay thế 2 `FeaturePlaceholder` của `/booking` và `/my-bookings` trong `src/router/index.tsx` bằng `CustomerBookingPage` và `MyBookingsPage`.
  - Cập nhật bảng trạng thái route trong `docs/frontend/README.md` §3.

### Checkpoint 3: Hoàn tất Phase 2 & Kiểm tra Definition of Done
- [ ] `npm run build` (`tsc -b && vite build`) PASS 100%, không lỗi TypeScript.
- [ ] Toàn bộ 4 mục trong Definition of Done đạt 100%.

---

## 6. Risks & Mitigations
| Nguy cơ (Risk) | Mức độ | Biện pháp xử lý (Mitigation) |
|---|---|---|
| **Mất `sessionStorage` khi Axios tự động Refresh Token 401** | Cao | Trong `src/lib/auth.ts`, `setTokens` và `setStoredUser` tự động phát hiện storage hiện hành nếu tham số `rememberMe` không được truyền vào, đảm bảo phiên không tick `"Ghi nhớ đăng nhập"` vẫn nằm ở `sessionStorage` sau khi refresh token. |
| **Race condition 409 `SLOT_ALREADY_BOOKED` khi 2 người đặt cùng lúc** | Cao | Khi nhận mã lỗi 409 hoặc `code === 'SLOT_ALREADY_BOOKED'`, lập tức gọi lại `fetchAvailability()`, bỏ chọn slot cũ và hiển thị rõ thông báo tiếng Việt từ server. |
| **Truyền trường `sort` ngoài whitelist ở `/my-bookings` gây lỗi 400** | Trung bình | Khóa chặt kiểu `BookingSortField = 'bookingDate' | 'createdAt' | 'totalAmount'` trong dropdown chọn sắp xếp. |
| **Hiển thị sai tổng tiền nếu tự tính ở Client sau khi tạo đơn** | Trung bình | Ở bước chọn slot chỉ ghi rõ *"Tạm tính (ước tính)"*; sau khi `POST /api/v1/bookings` trả về 201, hiển thị chính xác `booking.totalAmount` từ response của Backend. |
