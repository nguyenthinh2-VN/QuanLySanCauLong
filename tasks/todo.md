# Tasks Checklist: FE Phase 2 — Đặt sân trực tuyến (Customer Booking, M4) + Sửa 2 Nits Phase 1

## Task 1: Sửa 2 Nits Phase 1 (`rememberMe` Storage & Đổi Accent `emerald` $\rightarrow$ `zinc`)
**Description:** Nối checkbox `"Ghi nhớ đăng nhập"` từ `LoginForm` qua `LoginPage` và `AuthContext` xuống `src/lib/auth.ts` (`localStorage` khi tick, `sessionStorage` khi bỏ tick, xóa cả 2 khi logout). Đồng thời chuyển toàn bộ màu nhấn `emerald` sang `zinc` trên toàn bộ UI components, Layout, Dashboard, Auth pages và cập nhật lại `docs/frontend/README.md` + `docs/frontend/design-system.md`.

**Acceptance criteria:**
- [x] `LoginForm.tsx` truyền `rememberMe` qua `onLoginSubmit(email, password, rememberMe)`; `LoginPage.tsx` truyền tiếp vào `AuthContext.login(email, password, rememberMe)`.
- [x] `src/lib/auth.ts`:
  - `setTokens(access, refresh, rememberMe?)`: tick $\rightarrow$ `localStorage`, không tick $\rightarrow$ `sessionStorage` (nếu không truyền `rememberMe` khi auto-refresh 401 thì giữ nguyên storage hiện tại).
  - `getAccessToken()`, `getRefreshToken()`, `getStoredUser()`: đọc `localStorage` trước, fallback sang `sessionStorage`.
  - `setStoredUser(user, rememberMe?)`: ghi vào cùng storage với token.
  - `clearAuthStorage()` / `clearTokens()`: xóa sạch cả 3 key (`accessToken`, `refreshToken`, `authUser`) ở **cả 2** `localStorage` và `sessionStorage`.
- [x] Đổi toàn bộ accent `emerald` sang `zinc` (`bg-zinc-900`, `text-zinc-900`, `border-zinc-900`, variant `zinc` cho `Badge`), ngoại trừ ngữ nghĩa thành công (`AuthAlert variant="success"` và hộp `"Đã gửi email"` trong `ForgotPasswordForm.tsx`).
- [x] Cập nhật `docs/frontend/README.md` và `docs/frontend/design-system.md` sang tông màu chủ đạo `shadcn/ui Zinc`.

**Verification:**
- [ ] Build succeeds: `npm run build` trong `FE/`
- [ ] Grep check: `Select-String -Path "FE/src/**" -Pattern "emerald"` chỉ còn ở `AuthAlert.tsx` và `ForgotPasswordForm.tsx`.
- [ ] Docs check: `Select-String -Path "docs/frontend/*" -Pattern "emerald"` không còn dòng nào gọi `emerald` là màu chủ đạo/brand color.

**Dependencies:** None

**Files likely touched:**
- `FE/src/lib/auth.ts`
- `FE/src/context/AuthContext.tsx`
- `FE/src/components/auth/LoginForm.tsx`
- `FE/src/pages/auth/LoginPage.tsx`
- `FE/src/pages/auth/RegisterPage.tsx`
- `FE/src/pages/auth/ForgotPasswordPage.tsx`
- `FE/src/pages/auth/ResetPasswordPage.tsx`
- `FE/src/pages/errors/NotFoundPage.tsx`
- `FE/src/index.css`
- `FE/src/components/ui/button.tsx`
- `FE/src/components/ui/checkbox.tsx`
- `FE/src/components/ui/input.tsx`
- `FE/src/components/ui/badge.tsx`
- `FE/src/components/auth/AuthCardLayout.tsx`
- `FE/src/components/layout/Sidebar.tsx`
- `FE/src/components/layout/Header.tsx`
- `FE/src/components/layout/FeaturePlaceholder.tsx`
- `FE/src/components/dashboard/DashboardWelcomeBanner.tsx`
- `FE/src/components/dashboard/DashboardStatCard.tsx`
- `FE/src/components/dashboard/DashboardStatsGrid.tsx`
- `docs/frontend/README.md`
- `docs/frontend/design-system.md`

**Estimated scope:** Medium

---

## Checkpoint 1: Mục 0 Hoàn Tất
- [x] `npm run build` PASS
- [x] `rememberMe` hoạt động đúng cho cả `localStorage` và `sessionStorage`
- [x] Toàn bộ giao diện chuyển sang tông `zinc` thống nhất

---

## Task 2: Định nghĩa Types & API Helpers cho Module 4 (`src/types/booking.ts`, `src/lib/booking.ts`)
**Description:** Tạo các interface TypeScript khớp 100% với DTO của `BookingController.java` và viết các hàm tiện ích gọi API đặt sân, định dạng tiền tệ VNĐ, tính thời lượng khung giờ và kiểm tra khoảng ngày hợp lệ `[hôm nay, hôm nay + 30 ngày]`.

**Acceptance criteria:**
- [x] Tạo `FE/src/types/booking.ts` gồm: `SlotStatus`, `CourtStatus`, `BookingStatus`, `TimeSlotAvailability`, `CourtAvailabilityResponse`, `CreateBookingRequest`, `UpdateBookingRequest`, `BookingResponse`, `PageResponse<T>`, `BookingSortField`, `MyBookingsQueryParams`.
- [x] Tạo `FE/src/lib/booking.ts` gồm:
  - Các hàm API: `getCourtAvailability`, `createBooking`, `getMyBookings`, `updateBooking`, `cancelBooking`.
  - Các hàm tiện ích: `getTodayIso()`, `getMaxBookingDateIso()` (+30 ngày), `shiftDateIso(dateStr, days)`, `calculateSlotHours(startTime, endTime)`, `formatCurrencyVnd(amount)`, `formatTimeShort(timeStr)`.

**Verification:**
- [x] Typecheck passes: `npm run typecheck`

**Dependencies:** Task 1

**Files likely touched:**
- `FE/src/types/booking.ts`
- `FE/src/lib/booking.ts`

**Estimated scope:** Small (2 files)

---

## Task 3: Màn hình `/booking` — Đặt sân trực tuyến (`CustomerBookingPage`)
**Description:** Xây dựng giao diện đặt sân trực tuyến cho khách hàng với thanh chọn ngày (`[hôm nay, hôm nay + 30 ngày]`), lưới lịch trống theo từng sân (`GET /api/v1/bookings/availability`), panel xác nhận đặt sân (`POST /api/v1/bookings`), xử lý xung đột `409 SLOT_ALREADY_BOOKED` và màn hình thông báo thành công (`201 Created`).

**Acceptance criteria:**
- [x] Tạo `FE/src/components/booking/BookingDateToolbar.tsx`: Chọn ngày bằng input `date` + nút Ngày trước / Ngày sau / Hôm nay + lọc theo cụm sân.
- [x] Tạo `FE/src/components/booking/CourtAvailabilityGrid.tsx`: Hiển thị từng sân kèm cụm sân, badge bảo trì nếu `courtStatus === 'MAINTENANCE'`, các ô slot với trạng thái `FREE` (bấm chọn được), `BOOKED` / `PASSED` / `UNAVAILABLE` (disabled + ghi rõ lý do). Có Skeleton khi tải và nút thử lại khi lỗi mạng.
- [x] Tạo `FE/src/components/booking/BookingConfirmPanel.tsx`: Hiển thị thông tin slot đang chọn, giá ước tính (`pricePerHour * số giờ`), ô nhập `note` tùy chọn, nút `"Đặt sân"`. Khi gặp `409 SLOT_ALREADY_BOOKED` tự động gọi lại `onRefetchAvailability()`, bỏ chọn slot cũ và hiện đúng message từ server.
- [x] Tạo `FE/src/components/booking/BookingSuccessCard.tsx`: Hiển thị mã đơn, trạng thái `PENDING` ("đơn đang chờ thanh toán"), tổng tiền lấy trực tiếp từ `booking.totalAmount` của BE, nút `"Xem lịch đặt của tôi"` (`/my-bookings`) và nút `"Đặt thêm khung giờ khác"`.
- [x] Tạo `FE/src/pages/booking/CustomerBookingPage.tsx`: Page Composer mỏng kết nối các component trên.

**Verification:**
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 2

**Files likely touched:**
- `FE/src/components/booking/BookingDateToolbar.tsx`
- `FE/src/components/booking/CourtAvailabilityGrid.tsx`
- `FE/src/components/booking/BookingConfirmPanel.tsx`
- `FE/src/components/booking/BookingSuccessCard.tsx`
- `FE/src/pages/booking/CustomerBookingPage.tsx`

**Estimated scope:** Medium (5 files)

---

## Task 4: Màn hình `/my-bookings` — Lịch đặt của tôi (`MyBookingsPage`)
**Description:** Xây dựng giao diện quản lý lịch sử đặt sân của khách hàng (`GET /api/v1/bookings/my`), hỗ trợ lọc theo trạng thái, khoảng ngày, sắp xếp trong whitelist (`bookingDate`, `createdAt`, `totalAmount`), phân trang, cùng 2 hộp thoại **Hủy lịch** (`DELETE /api/v1/bookings/{id}`) và **Đổi lịch** (`PUT /api/v1/bookings/{id}` tái sử dụng lưới availability).

**Acceptance criteria:**
- [x] Tạo `FE/src/components/booking/MyBookingsFilterBar.tsx`: Lọc theo trạng thái (`Tất cả`, `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`), lọc `fromDate` / `toDate`, chọn sắp xếp chỉ trong whitelist (`createdAt,desc`, `bookingDate,desc`, `bookingDate,asc`, `totalAmount,desc`, `totalAmount,asc`).
- [x] Tạo `FE/src/components/booking/MyBookingsTable.tsx`: Hiển thị danh sách đơn đặt, badge trạng thái, tổng tiền, phân trang, empty state (icon + câu hướng dẫn + nút sang `/booking`), nút **Hủy** và **Đổi lịch** cho các đơn còn hiệu lực (`PENDING` / `CONFIRMED` chưa qua giờ bắt đầu).
- [x] Tạo `FE/src/components/booking/CancelBookingDialog.tsx`: Hộp thoại xác nhận hủy đơn (`DELETE /api/v1/bookings/{id}`), hiển thị lỗi tiếng Việt từ BE nếu gặp `409 BOOKING_NOT_CANCELLABLE`.
- [x] Tạo `FE/src/components/booking/RescheduleBookingDialog.tsx`: Hộp thoại đổi lịch (`PUT /api/v1/bookings/{id}`), cho phép chọn ngày và slot `FREE` mới từ lưới availability, hiển thị lỗi tiếng Việt từ BE nếu gặp `409 BOOKING_NOT_RESCHEDULABLE` hoặc `409 SLOT_ALREADY_BOOKED`.
- [x] Tạo `FE/src/pages/booking/MyBookingsPage.tsx`: Page Composer mỏng kết nối bộ lọc, bảng và 2 hộp thoại.

**Verification:**
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `FE/src/components/booking/MyBookingsFilterBar.tsx`
- `FE/src/components/booking/MyBookingsTable.tsx`
- `FE/src/components/booking/CancelBookingDialog.tsx`
- `FE/src/components/booking/RescheduleBookingDialog.tsx`
- `FE/src/pages/booking/MyBookingsPage.tsx`

**Estimated scope:** Medium (5 files)

---

## Task 5: Nối số thật cho Dashboard `CUSTOMER`, Cập nhật Router & Tài liệu
**Description:** Kết nối 2 thẻ thống kê đầu tiên của `CUSTOMER` trên trang Tổng quan (`/`) với API `GET /api/v1/bookings/my`, đăng ký `CustomerBookingPage` và `MyBookingsPage` vào `src/router/index.tsx`, và cập nhật tài liệu `docs/frontend/README.md`.

**Acceptance criteria:**
- [x] Khi đăng nhập với vai trò `CUSTOMER` tại `/`:
  - Thẻ 1 (`"Lịch đặt sắp tới"`): hiển thị `totalElements` từ `GET /api/v1/bookings/my?fromDate=<hôm nay>&size=1`.
  - Thẻ 2 (`"Đã hoàn thành"`): hiển thị `totalElements` từ `GET /api/v1/bookings/my?status=COMPLETED&size=1`.
  - 2 thẻ còn lại giữ nguyên như Phase 1.
- [x] `FE/src/router/index.tsx`: Gắn `<CustomerBookingPage />` vào `/booking` và `<MyBookingsPage />` vào `/my-bookings`.
- [x] `docs/frontend/README.md` §3.2: Cập nhật trạng thái `/booking` và `/my-bookings` thành **"Hoàn thiện 100% (Nối API thật)"** và bổ sung cấu trúc thư mục `booking/` vào cây thư mục.

**Verification:**
- [x] `npm run build` (`tsc -b && vite build`) PASS 100% không lỗi.

**Dependencies:** Task 3, Task 4

**Files likely touched:**
- `FE/src/components/dashboard/DashboardStatsGrid.tsx`
- `FE/src/router/index.tsx`
- `docs/frontend/README.md`

**Estimated scope:** Small (3 files)

---

## Checkpoint 2: Hoàn Tất Phase 2 & Kiểm Tra Definition of Done
- [x] Mục 0 xong: `npm run build` PASS; `rememberMe` hoạt động chuẩn; grep `emerald` trong `FE/src/` chỉ còn ở `AuthAlert.tsx` & `ForgotPasswordForm.tsx`; docs FE không còn gọi `emerald` là màu chủ đạo.
- [x] `/booking` chạy chuẩn với BE thật: chọn ngày $\rightarrow$ xem slot trống $\rightarrow$ đặt sân nhận 201 `PENDING` + tổng tiền từ BE; xử lý đúng 409 `SLOT_ALREADY_BOOKED`.
- [x] `/my-bookings` lọc, sắp xếp đúng whitelist, phân trang chuẩn; hủy đơn $\rightarrow$ `CANCELLED`; đổi lịch $\rightarrow$ cập nhật slot mới; bắt lỗi 409/403 chuẩn xác.
- [x] Dashboard `CUSTOMER` hiển thị đúng 2 chỉ số thật từ `/api/v1/bookings/my`.
