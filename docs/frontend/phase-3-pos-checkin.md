# ĐẶC TẢ CHI TIẾT FE PHASE 3: ĐẶT SÂN TẠI QUẦY (POS) + CHECK-IN (MODULE 5, LUỒNG NHÂN VIÊN)

> **Mục tiêu Phase 3:**
> 1. Xây dựng hoàn chỉnh màn hình **Đặt sân tại quầy (`/pos` — `PosBookingPage.tsx`)** dành cho vai trò `STAFF` và `ADMIN`, tái sử dụng `BookingDateToolbar` và `CourtAvailabilityGrid` từ Phase 2, nối trực tiếp với `POST /api/v1/bookings/pos`.
> 2. Xây dựng hoàn chỉnh màn hình **Check-in khách vào sân (`/check-in` — `CheckInPage.tsx`)** dành cho `STAFF` và `ADMIN`, nối trực tiếp với `POST /api/v1/bookings/{id}/check-in`.

---

## 1. Màn Hình Đặt Sân Tại Quầy (`/pos` — `PosBookingPage.tsx`)

### 1.1. Quy Tắc Nghiệp Vụ & Tái Sử Dụng Component
- **Tái sử dụng 100% từ Phase 2:**
  - `BookingDateToolbar.tsx`: Chọn ngày đặt trong khoảng `[hôm nay, hôm nay + 30 ngày]`, nút chuyển nhanh ngày trước / ngày sau / hôm nay, lọc theo cụm sân (`complexName`).
  - `CourtAvailabilityGrid.tsx`: Hiển thị lưới khung giờ (`FREE`, `BOOKED`, `PASSED`, `UNAVAILABLE`) từ `GET /api/v1/bookings/availability?date=YYYY-MM-DD`.
- **Chọn đối tượng khách hàng (Quy tắc XOR tuyệt đối):**
  - Chuyển đổi (toggle) giữa 2 chế độ:
    1. **Khách vãng lai (`GUEST`):** Bắt buộc nhập đồng thời cả `guestName` (tối đa 100 ký tự) và `guestPhone` (tối đa 20 ký tự).
    2. **Khách thành viên (`MEMBER`):** Nhập mã ID thành viên (`userId`, số nguyên dương).
  - **Tra cứu thành viên trước khi đặt (Dành riêng cho `ADMIN`):**
    - Vì endpoint `GET /api/v1/admin/users/{id}` trên Backend (`AdminUserController`) được bảo vệ bằng `@PreAuthorize("hasRole('ADMIN')")`, nút **"Kiểm tra"** chỉ hiển thị khi tài khoản đang đăng nhập có role `ADMIN` để hiện trước Họ tên, Email, SĐT và trạng thái hoạt động của thành viên.
    - Khi đăng nhập bằng tài khoản `STAFF`, nút này được ẩn đi (tránh lỗi `403 Forbidden`); nhân viên nhập `userId` và Backend sẽ trực tiếp kiểm tra sự tồn tại của thành viên khi gửi `POST /api/v1/bookings/pos`.
  - **Validate XOR tại Client:** Kiểm tra chặt tại `PosBookingConfirmPanel.tsx` trước khi gọi API — chỉ gửi `userId` HOẶC (`guestName` + `guestPhone`), tuyệt đối không gửi cả hai hoặc bỏ trống.
- **Kết quả đặt sân tại quầy (`201 Created`):**
  - Hiển thị `PosBookingSuccessCard.tsx` với mã đơn `#id`, sân & cụm sân, ngày & khung giờ, thông tin khách hàng (tên thành viên hoặc tên + SĐT khách vãng lai), tổng tiền chính thức từ `booking.totalAmount` của BE, và trạng thái **`CONFIRMED`** (đã xác nhận ngay tại quầy, khác với đặt online là `PENDING`).
- **Xử lý lỗi:**
  - `409 SLOT_ALREADY_BOOKED` / `COURT_NOT_AVAILABLE`: Tự động xóa slot đang chọn, gọi lại `fetchCourtAvailability(selectedDate)` để cập nhật lưới sân mới nhất và hiển thị nguyên văn thông báo lỗi tiếng Việt từ server.
  - `400 INVALID_POS_REQUEST` / `INVALID_BOOKING_DATE`, `404 USER_NOT_FOUND` / `COURT_NOT_FOUND` / `TIMESLOT_NOT_FOUND`: Hiển thị thông báo lỗi trên `AuthAlert`.

### 1.2. Wireframe Màn Hình `/pos`

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Đặt sân tại quầy (POS)                                         [STAFF]  [Trần Văn B (TB)]|
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (bg-slate-50 / p-6)                                                                 |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | THANH CHỌN NGÀY & CỤM SÂN (BookingDateToolbar - Dùng lại từ Phase 2)                         | |
| | [ < Ngày trước ]  [ 📅 2026-11-10 ]  [ Ngày sau > ]  [ Hôm nay ]     Cụm sân: [ Tất cả cụm v]| |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +------------------------------------------------------------+ +-------------------------------+ |
| | LƯỚI SÂN & KHUNG GIỜ (CourtAvailabilityGrid - 8 cột)       | | PHIẾU ĐẶT SÂN TẠI QUẦY (4 cột)| |
| | (Dùng lại từ Phase 2)                                      | | (PosBookingConfirmPanel)      | |
| |                                                            | |-------------------------------| |
| | +-- Card: Sân 1 (Thảm Victor) ----------------------------+| | Sân:   Sân 1 (Thảm Victor)    | |
| | | Cụm Sân Cầu Lông Cầu Giấy          [Badge: Sẵn sàng]    || | Ngày:  10/11/2026             | |
| | |---------------------------------------------------------|| | Giờ:   16:00 – 21:00 (5 giờ)  | |
| | | [ 05:00–08:00 Đã qua giờ ]  [ 08:00–16:00 Đã đặt ]      || | Tạm tính: 750.000 ₫           | |
| | | [*16:00–21:00 Đang chọn *]  [ 21:00–23:00 Còn trống ]   || |-------------------------------| |
| | +---------------------------------------------------------+| | ĐỐI TƯỢNG KHÁCH (XOR):        | |
| |                                                            | | [ Khách vãng lai ] [Thành viên]| |
| |                                                            | | Họ tên *: [ Nguyễn Văn Khách ]| |
| |                                                            | | SĐT *:    [ 0912345678       ]| |
| |                                                            | | Ghi chú:  [ Đã thu tiền mặt ] | |
| |                                                            | |                               | |
| |                                                            | | [ Xác nhận đặt sân tại quầy ] | |
| |                                                            | | [ Bỏ chọn khung giờ         ] | |
| +------------------------------------------------------------+ +-------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Màn Hình Check-in Khách Vào Sân (`/check-in` — `CheckInPage.tsx`)

### 2.1. Giới Hạn Kiến Trúc Quan Trọng Từ Backend
- Trong Backend hiện tại (`BookingController.java`), **không có endpoint `GET /api/v1/bookings/{id}`** và **không có endpoint lấy danh sách đơn đặt sân cho `STAFF` / `ADMIN`** (chỉ có `GET /api/v1/bookings/my` dành cho đơn của chính user đang đăng nhập).
- Do đó, màn hình `/check-in` **không** có bảng "Danh sách đơn hôm nay" và **không** có bước xem trước thông tin đơn trước khi bấm nút — nhân viên nhập trực tiếp **Mã đơn đặt sân (`bookingId`, số)** và bấm **"Check-in"** để gọi `POST /api/v1/bookings/{id}/check-in`.

### 2.2. Luồng Hoạt Động & 4 Điều Kiện Check-in
- Trang hiển thị cố định 4 điều kiện check-in hợp lệ để nhân viên lễ tân nắm rõ:
  1. **Mã đơn tồn tại:** ID đơn đặt sân phải có trong hệ thống (`404 BOOKING_NOT_FOUND` nếu không tồn tại).
  2. **Đúng ngày hôm nay:** `bookingDate` của đơn phải bằng ngày hiện tại (`LocalDate.now()`).
  3. **Trước giờ kết thúc khung giờ:** Thời điểm check-in phải diễn ra trước `endTime` của ca đặt.
  4. **Trạng thái hợp lệ:** Đơn đang ở trạng thái `PENDING` hoặc `CONFIRMED` (nếu đã `CHECKED_IN`, `COMPLETED` hoặc `CANCELLED` sẽ trả về `409 CHECK_IN_NOT_ALLOWED`).
- Khi `POST /api/v1/bookings/{id}/check-in` trả về `200 OK`, hiển thị thẻ `CheckInResultCard.tsx` gồm mã đơn, khách nhận sân (tên thành viên hoặc tên + SĐT khách vãng lai), sân & cụm sân, ngày & khung giờ, trạng thái mới **`CHECKED_IN`**, tổng tiền và nút **"Check-in đơn khác"**.

---

## 3. Phân Tách Component Phase 3 (`src/components/booking/`)

| Component | Vai trò & Trách nhiệm |
|---|---|
| `PosBookingConfirmPanel.tsx` | Panel xác nhận đặt sân tại quầy: toggle XOR (`Khách vãng lai` vs `Khách thành viên`), nút `"Kiểm tra"` thành viên cho `ADMIN`, validate dữ liệu tại client và gửi `POST /api/v1/bookings/pos`. |
| `PosBookingSuccessCard.tsx` | Thẻ biên nhận đặt sân tại quầy thành công (`201 Created`, trạng thái `CONFIRMED`), hiển thị thông tin khách hàng, tổng tiền chuẩn từ BE và nút `"Đặt đơn khác"`. |
| `CheckInFormCard.tsx` | Form nhập mã đơn đặt sân (`bookingId`) kèm 4 thẻ hướng dẫn điều kiện check-in hợp lệ và hiển thị thông báo lỗi `404` / `409` từ server. |
| `CheckInResultCard.tsx` | Thẻ kết quả sau khi check-in thành công (`200 OK`, trạng thái `CHECKED_IN`) kèm nút `"Check-in đơn khác"`. |

