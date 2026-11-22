# Phase 11 — Bảng Điều Hành Đặt Sân Cho STAFF / ADMIN (`/bookings`, M4/M5)

## 1. Mục tiêu & Bối cảnh
- Tuyến đường `/bookings` trước đây là màn hình giữ chỗ (`FeaturePlaceholder`), chỉ dành cho `ADMIN`.
- Sau khi Backend bổ sung 2 endpoint đọc booking cho nhân viên (`GET /api/v1/bookings` và `GET /api/v1/bookings/{id}`), Phase 11 triển khai giao diện bảng điều hành hoàn chỉnh cho cả `STAFF` và `ADMIN`.
- Khách hàng (`CUSTOMER`) không được phép truy cập trang này (nếu vào sẽ bị chuyển hướng sang `/403` qua `RoleRoute allowed={['STAFF', 'ADMIN']}`).

## 2. Các thành phần chính

### 2.1. Router & Menu Sidebar
- Route `/bookings` được cấu hình dưới `RoleRoute allowed={['STAFF', 'ADMIN']}`.
- Menu Sidebar của nhân viên (`STAFF`) được bổ sung mục:
  - Nhãn: **Quản lý đặt sân**
  - Tuyến đường: `/bookings`
  - Icon: `calendar-check`

### 2.2. Bộ lọc (`StaffBookingFilterBar.tsx`)
- **Ngày đặt sân (`bookingDate`):** Luôn bắt buộc truyền, mặc định là ngày hôm nay (`today`). Không hỗ trợ chế độ xem mọi ngày cùng lúc.
- **Trạng thái (`status`):** Tất cả hoặc một trong các trạng thái: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`.
- **Cụm sân (`complexId`):** Lựa chọn cụm sân đang hoạt động. Khi thay đổi cụm sân, bộ chọn sân con tự động reset.
- **Sân con (`courtId`):** Lọc theo từng sân con thuộc cụm sân đã chọn.
- **Số điện thoại khách (`guestPhone`):** Tìm kiếm tương đối (chứa 1 phần SĐT, map với `LIKE %...%` ở BE).
- **ID thành viên (`userId`):** Tìm kiếm chính xác theo ID người dùng.
- **Nút xóa lọc:** Đặt lại toàn bộ tiêu chí về mặc định (ngày hôm nay, xóa toàn bộ filter phụ, đưa về trang đầu tiên).

### 2.3. Bảng danh sách (`StaffBookingsTable.tsx`)
- Bảng hiển thị thông tin: `#Đơn`, `Khách` (Thành viên / Khách vãng lai), `Cụm / Sân`, `Ngày`, `Khung giờ`, `Trạng thái` (badge màu chuẩn Zinc theme), `Tổng tiền`, `Thao tác`.
- Phân trang chuẩn với `PageResponse<BookingResponse>`.
- **Phân quyền tác vụ trên dòng:**
  - **Chi tiết:** Cả STAFF và ADMIN đều có thể xem modal chi tiết đầy đủ của đơn.
  - **Check-in:** Hiển thị cho đơn ở trạng thái `PENDING` hoặc `CONFIRMED`. Nút chỉ kích hoạt (enable) khi đơn thuộc **ngày hôm nay** và thời điểm hiện tại **chưa qua giờ kết thúc** (`endTime`) của slot. Nếu không thỏa mãn, nút bị disabled kèm tooltip giải thích lý do.
  - **Đổi lịch:** Chỉ `ADMIN` mới nhìn thấy nút (ẩn hoàn toàn với `STAFF` vì Backend chặn quyền đổi lịch của STAFF). Chỉ áp dụng cho đơn có trạng thái thao tác được (`PENDING`, `CONFIRMED`).
  - **Hủy đơn:** Chỉ `ADMIN` mới nhìn thấy nút (ẩn hoàn toàn với `STAFF`). Chỉ áp dụng cho đơn `PENDING`, `CONFIRMED`.

### 2.4. Modal chi tiết (`BookingDetailDialog.tsx`)
- Đọc dữ liệu chi tiết từ `GET /api/v1/bookings/{id}`.
- Trình bày toàn bộ thông tin đơn: ID, Khách hàng, Cụm sân, Sân con, Ngày đặt, Khung giờ, Trạng thái, Tổng tiền, Ghi chú, Thời gian tạo / cập nhật.
- Tích hợp các nút thao tác nhanh (Check-in, Đổi lịch, Hủy đơn) tuân thủ đúng logic phân quyền tương tự bảng danh sách.

### 2.5. Tái sử dụng các Dialog nghiệp vụ đã kiểm chứng
- **Đổi lịch:** Tái sử dụng `RescheduleBookingDialog.tsx` từ Module Đặt sân (tự động cập nhật lịch trống qua WebSocket).
- **Hủy đơn:** Tái sử dụng `CancelBookingDialog.tsx`.
- Sau khi Check-in / Đổi lịch / Hủy đơn thành công, danh sách booking trên trang tự động refetch ngay lập tức mà không cần F5.

## 3. Quy tắc kiểm thử & Xác thực
- TypeScript strictly typed, không sử dụng `any`.
- Tuân thủ Quy tắc Kiến trúc Component Frontend: Page file `StaffBookingsPage.tsx` đóng vai trò composer, các khối giao diện được tách biệt tại `FE/src/components/booking/`.
- Chạy lệnh build kiểm tra:
  ```bash
  npm --prefix FE run build
  ```
