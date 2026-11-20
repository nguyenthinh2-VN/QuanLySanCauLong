# ĐẶC TẢ CHI TIẾT PHASE 10: ĐẶT LỊCH CỐ ĐỊNH HÀNG TUẦN — RECURRING (M5)

> **Màn hình:** `/recurring`  
> **Quyền hạn truy cập:** Dành riêng cho Khách hàng (`CUSTOMER`). `STAFF` và `ADMIN` khi truy cập sẽ bị `RoleRoute` chặn và chuyển hướng sang `/403`.  
> **API Backend:** Module 5 — `POST /api/v1/bookings/recurring`.

---

## 1. Tổng Quan Nghiệp Vụ

Tính năng **Đặt lịch cố định hàng tuần (Recurring Booking)** cho phép khách hàng chủ động giữ trước một khung giờ cố định tại một sân cụ thể, lặp lại vào cùng một thứ mỗi tuần trong khoảng từ **1 đến 12 tuần**.

### Đặc thù phân quyền & phạm vi:
- Chỉ áp dụng cho **CUSTOMER tự đặt cho chính mình**: Backend tự động trích xuất `currentUserId` từ JWT Token của phiên đăng nhập (`SecurityUtils.getCurrentUserId()`). Request không chứa `userId` hay `guestName`.
- **Không hỗ trợ đặt chuỗi cho POS**: Nhân viên tại quầy không thể đặt chuỗi hộ khách qua endpoint này (nhân viên đặt lẻ qua `/pos`).

---

## 2. Danh Sách & Phân Trách Nhiệm Các Component Con

Tuân thủ nghiêm ngặt **Component Decomposition Rule**, trang `RecurringBookingPage.tsx` chỉ đóng vai trò Thin Composer điều phối các sub-components trong `FE/src/components/booking/`:

| Component | Trách nhiệm |
|---|---|
| **`RecurringBookingForm.tsx`** | Form 5 bước cấu hình: chọn Cụm sân $\rightarrow$ Sân con (loại trừ sân bảo trì), chọn Khung giờ (vô hiệu hóa khung đã qua nếu ngày đầu rơi vào hôm nay), chọn Thứ trong tuần (7 nút `MONDAY`...`SUNDAY`), chọn Ngày bắt đầu và Số tuần (1–12), Ghi chú. |
| **`RecurringPreviewTable.tsx`** | Bảng danh sách các ngày trong chuỗi sau căn chỉnh thứ. Tự động gọi `fetchCourtAvailability` kiểm tra slot trống từng ngày, tính tổng tiền tạm tính, cảnh báo vượt 90 ngày và hiển thị danh sách ngày xung đột khi nhận lỗi 409 từ server. |
| **`ConfirmRecurringDialog.tsx`** | Modal popup xác nhận thông tin chi tiết trước khi gửi API, cảnh báo khách hàng rằng hệ thống sẽ tạo N đơn độc lập và cần thanh toán riêng từng đơn. |
| **`RecurringSuccessCard.tsx`** | Thẻ biên nhận thành công liệt kê đầy đủ N đơn đặt sân vừa tạo (`PENDING`), bảng chi tiết từng đơn, tổng tiền chuỗi và 2 nút điều hướng ("Xem lịch đặt của tôi" $\rightarrow$ `/my-bookings` và "Đặt chuỗi khác"). |
| **`RecurringBookingPage.tsx`** | Thin Page Composer (<150 dòng) quản lý state, kết nối API, điều phối luồng giao diện giữa Form, Preview, Dialog và SuccessCard. |

---

## 3. Công Thức Tính Ngày & 7 Bẫy Nghiệp Vụ Đã Kiểm Chứng

### 🔄 Bẫy 1: Ngày bắt đầu (`startDate`) KHÔNG phải là ngày đặt đầu tiên (`firstDate`)
- Backend căn chỉnh tịnh tiến: từ `startDate`, tìm ngày gần nhất khớp với `dayOfWeek` đã chọn (`BookingServiceImpl.java:483-486`).
- **Ví dụ:** Khách chọn `startDate` là Thứ Tư (20/11), nhưng chọn thứ lặp lại là `MONDAY` $\rightarrow$ Ngày thi đấu đầu tiên sẽ là Thứ Hai tuần tiếp theo (25/11), hoàn toàn không phải ngày 20/11.
- **Xử lý FE:** Hàm `computeRecurringDates` trong `FE/src/lib/booking.ts` mirror chính xác 100% thuật toán này và bảng Preview luôn hiển thị `firstDate` thực tế sau căn chỉnh.

### 📅 Bẫy 2: Giới hạn 30 ngày chỉ áp dụng cho `startDate` trước căn chỉnh
- Backend chỉ kiểm tra `startDate` nằm trong khoảng `[hôm nay, hôm nay + 30 ngày]`.
- Nếu sau khi căn chỉnh, `firstDate` bị đẩy sang ngày thứ 35 hay 36, Backend vẫn chấp nhận hợp lệ. Frontend không tự ý siết thêm quy tắc này.

### ⏳ Bẫy 3: Giới hạn ngày cuối chuỗi $\le$ Hôm nay + 90 ngày (`RECURRING_HORIZON_EXCEEDED`)
- `lastDate = firstDate + (weeks - 1) tuần`. Nếu `lastDate > LocalDate.now().plusDays(90)`, Backend ném 400.
- **Xử lý FE:** Frontend tính trước cờ `exceedsHorizon` ngay trong lúc preview. Nếu vượt quá, hiển thị thông báo đỏ và vô hiệu hóa nút gửi để khách giảm bớt số tuần hoặc dời ngày bắt đầu.

### ⛔ Bẫy 4: Lỗi 409 `RECURRING_SLOT_CONFLICT` là All-or-Nothing
- Nếu bất kỳ ngày nào trong chuỗi bị trùng lịch (đã có người đặt), **không có đơn nào được tạo** (0 đơn, giao dịch rollback hoàn toàn).
- Backend trả về mảng các ngày bị xung đột trong trường `data` của response (`string[]` định dạng ISO).
- **Xử lý FE:** Trích xuất mảng ngày này qua `extractRecurringConflicts(error)` và hiển thị danh sách các ngày bị trùng màu đỏ nổi bật trên bảng Preview để khách hàng nắm rõ và chọn khung giờ khác. Không có chế độ "bỏ qua ngày trùng để tạo các ngày còn lại".

### 🧩 Bẫy 5: Không có khái niệm "chuỗi đơn" sau khi tạo
- Backend không lưu trữ `seriesId` hay gom nhóm — mỗi buổi là 1 entity `Booking` độc lập.
- **Không có API liệt kê cả chuỗi và không có tính năng hủy cả chuỗi.** Hủy một buổi tại `/my-bookings` hoàn toàn không ảnh hưởng tới các buổi khác.

### 💳 Bẫy 6: Mỗi đơn PENDING thanh toán riêng lẻ
- Tất cả các đơn trong chuỗi được tạo ở trạng thái `PENDING` với cùng `totalAmount` của 1 buổi.
- **Không có API thanh toán gộp:** Khách hàng vào `/my-bookings` để thanh toán lẻ từng đơn (thanh toán đủ 100% hoặc cọc 50%). Số tiền tổng hiển thị trong chuỗi chỉ mang tính tham khảo.

### ⚡ Bẫy 7: Broadcast WebSocket Realtime
- Backend phát broadcast sự kiện `BOOKED` cho từng đơn trong chuỗi lên topic `/topic/availability`.
- Client WebSocket (Phase 7) tự động refetch bảng lịch trống theo ngày đang xem khi quay lại `/booking` mà không cần thêm code socket mới nào.

---

## 4. Contract API Backend

- **Endpoint:** `POST /api/v1/bookings/recurring`
- **Call site FE:** `api.post('/bookings/recurring', payload)` (qua `api` instance đã có prefix `/api/v1`).
- **Request Body (`CreateRecurringBookingRequest`):**
  ```json
  {
    "courtId": 1,
    "timeSlotId": 3,
    "dayOfWeek": "MONDAY",
    "startDate": "2026-11-20",
    "weeks": 4,
    "note": "Nhóm cầu lông định kỳ"
  }
  ```
- **Response Thành Công (201 Created — `RecurringBookingResponse`):**
  ```json
  {
    "code": 201,
    "message": "Đặt lịch cố định thành công",
    "data": {
      "createdCount": 4,
      "bookings": [
        {
          "id": 110,
          "userId": 10,
          "bookingDate": "2026-11-23",
          "courtId": 1,
          "timeSlotId": 3,
          "status": "PENDING",
          "totalAmount": 750000.00
        }
      ]
    }
  }
  ```
