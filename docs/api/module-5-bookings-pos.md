# TÀI LIỆU API CHI TIẾT - MODULE 5: COURT OPERATIONS (POS, CHECK-IN & RECURRING)

> **Base URL:** `http://localhost:8080/api/v1/bookings`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`) trên tất cả các endpoint.

---

## Danh Mục Các Endpoints

| STT | Phương thức | Endpoint URI | Quyền hạn | Mô tả |
|:---:|---|---|---|---|
| 1 | `POST` | `/pos` | `STAFF`, `ADMIN` | Đặt sân trực tiếp tại quầy (Thành viên hoặc Khách vãng lai; Status: `CONFIRMED`) |
| 2 | `POST` | `/{id}/check-in` | `STAFF`, `ADMIN` | Xác nhận khách vào sân trong ngày (Status -> `CHECKED_IN`) |
| 3 | `POST` | `/recurring` | `Authenticated` | Đặt lịch cố định theo tuần (All-or-Nothing, Status: `PENDING`) |

---

## 1. Đặt Sân Tại Quầy (POS Booking)

Dành cho Nhân viên Lễ tân hoặc Quản trị viên phục vụ khách đặt sân trực tiếp tại quầy cơ sở. Hỗ trợ 2 đối tượng khách hàng với quy tắc **XOR tuyệt đối**:
1. **Khách thành viên:** Cung cấp `userId` hợp lệ đã đăng ký trong hệ thống.
2. **Khách vãng lai:** Không cần tài khoản, cung cấp đồng thời cả `guestName` và `guestPhone`.

Khác với quy trình đặt online (bắt đầu bằng `PENDING` chờ thanh toán cổng điện tử), đơn POS được khởi tạo ngay với trạng thái **`CONFIRMED`** vì khách đang có mặt trực tiếp và thanh toán tại quầy với nhân viên.

- **Endpoint:** `POST /api/v1/bookings/pos`
- **Quyền hạn:** `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")`
- **Headers:** `Authorization: Bearer <staff_or_admin_jwt_token>`

### 1.1. Request Body - Đặt cho Khách Thành Viên:
```json
{
  "userId": 100,
  "courtId": 1,
  "bookingDate": "2026-10-25",
  "timeSlotId": 2,
  "note": "Khách hội viên đặt tại quầy thanh toán tiền mặt"
}
```

### 1.2. Request Body - Đặt cho Khách Vãng Lai:
```json
{
  "guestName": "Nguyễn Văn Khách",
  "guestPhone": "0912345678",
  "courtId": 1,
  "bookingDate": "2026-10-25",
  "timeSlotId": 2,
  "note": "Khách vãng lai chơi giao lưu"
}
```

### 1.3. Response Thành Công (201 Created):
```json
{
  "code": 201,
  "message": "Đặt sân tại quầy thành công",
  "data": {
    "id": 85,
    "userId": null,
    "userFullName": null,
    "userEmail": null,
    "guestName": "Nguyễn Văn Khách",
    "guestPhone": "0912345678",
    "courtId": 1,
    "courtName": "Sân 1 (Thảm Victor)",
    "complexId": 1,
    "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
    "bookingDate": "2026-10-25",
    "timeSlotId": 2,
    "timeSlotName": "Giờ hành chính 08:00–16:00",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "totalAmount": 800000.00,
    "status": "CONFIRMED",
    "note": "Khách vãng lai chơi giao lưu",
    "createdAt": "2026-10-18T10:00:00",
    "updatedAt": "2026-10-18T10:00:00"
  }
}
```

### 1.4. Các Case Lỗi Thường Gặp:
- **400 Bad Request (`INVALID_POS_REQUEST`):** Vi phạm quy tắc XOR (truyền cả `userId` và thông tin khách vãng lai, hoặc không truyền trường nào, hoặc chỉ truyền `guestName` mà thiếu `guestPhone`).
  ```json
  {
    "code": 400,
    "message": "Yêu cầu POS phải chỉ định hoặc userId, hoặc cả guestName và guestPhone",
    "data": null
  }
  ```
- **400 Bad Request (`INVALID_BOOKING_DATE`):** Ngày đặt ở quá khứ, quá 30 ngày tới, hoặc đặt khung giờ trong ngày hôm nay nhưng giờ kết thúc đã trôi qua.
- **403 Forbidden:** Khách hàng thông thường (`CUSTOMER`) gọi vào endpoint POS.
- **404 Not Found (`USER_NOT_FOUND`):** `userId` chỉ định không tồn tại trong hệ thống.
- **404 Not Found (`COURT_NOT_FOUND` / `TIMESLOT_NOT_FOUND`):** Sân hoặc khung giờ không tồn tại.
- **409 Conflict (`SLOT_ALREADY_BOOKED`):** Khung giờ tại ngày đó đã có người đặt trước (trạng thái `PENDING`, `CONFIRMED` hoặc `CHECKED_IN`).

---

## 2. Check-in Khách Vào Sân

Xác nhận khách hàng có mặt tại sân để nhận sân chơi cầu.

- **Endpoint:** `POST /api/v1/bookings/{id}/check-in`
- **Quyền hạn:** `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")`
- **Headers:** `Authorization: Bearer <staff_or_admin_jwt_token>`

### 2.1. Các Điều Kiện Nghiệp Vụ (Guards):
1. **Booking tồn tại:** ID đơn đặt sân phải tồn tại trong cơ sở dữ liệu.
2. **Trạng thái hợp lệ:** Đơn phải ở trạng thái `PENDING` hoặc `CONFIRMED`. Nếu đơn đã `CHECKED_IN`, `COMPLETED` hoặc `CANCELLED` $\rightarrow$ ném 409.
3. **Đúng ngày thi đấu:** `bookingDate` phải bằng ngày hiện tại (`LocalDate.now()`). Không cho phép check-in trước ngày hoặc check-in bù ngày hôm qua.
4. **Chưa quá giờ kết thúc:** Thời điểm check-in phải nghiêm ngặt diễn ra trước giờ kết thúc của khung giờ (`LocalTime.now().isBefore(slot.getEndTime())`).

### 2.2. Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Check-in thành công",
  "data": {
    "id": 85,
    "userId": null,
    "userFullName": null,
    "userEmail": null,
    "guestName": "Nguyễn Văn Khách",
    "guestPhone": "0912345678",
    "courtId": 1,
    "courtName": "Sân 1 (Thảm Victor)",
    "complexId": 1,
    "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
    "bookingDate": "2026-10-18",
    "timeSlotId": 2,
    "timeSlotName": "Giờ hành chính 08:00–16:00",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "totalAmount": 800000.00,
    "status": "CHECKED_IN",
    "note": "Khách vãng lai chơi giao lưu",
    "createdAt": "2026-10-18T08:30:00",
    "updatedAt": "2026-10-18T09:15:00"
  }
}
```

### 2.3. Các Case Lỗi Thường Gặp:
- **404 Not Found (`BOOKING_NOT_FOUND`):** Đơn đặt sân không tồn tại.
- **409 Conflict (`CHECK_IN_NOT_ALLOWED`):**
  - Đơn đặt không thuộc ngày hôm nay:
    ```json
    {
      "code": 409,
      "message": "Chỉ có thể check-in các lượt đặt sân trong ngày hôm nay",
      "data": null
    }
    ```
  - Khung giờ đã kết thúc:
    ```json
    {
      "code": 409,
      "message": "Khung giờ đặt sân đã kết thúc, không thể check-in",
      "data": null
    }
    ```
  - Đơn đã check-in rồi hoặc đã bị hủy:
    ```json
    {
      "code": 409,
      "message": "Trạng thái đặt sân không hợp lệ để check-in",
      "data": null
    }
    ```

---

## 3. Đặt Lịch Cố Định Theo Tuần (Recurring Bookings)

Cho phép khách hàng đặt trọn gói một khung giờ cố định lặp lại hàng tuần (ví dụ: thứ 2 hàng tuần trong 4 tuần liên tiếp) theo nguyên tắc **All-or-Nothing Transactional Policy**.

- **Endpoint:** `POST /api/v1/bookings/recurring`
- **Quyền hạn:** `@PreAuthorize("isAuthenticated()")`
- **Headers:** `Authorization: Bearer <access_token>`

### 3.1. Ràng Buộc Tham Số (Parameters Constraints):
- `courtId` (*bắt buộc*, `Long`): Sân con cần đặt.
- `timeSlotId` (*bắt buộc*, `Long`): Khung giờ cố định cần đặt.
- `dayOfWeek` (*bắt buộc*, `DayOfWeek` Enum): Thứ trong tuần (`MONDAY`, `TUESDAY`, ..., `SUNDAY`).
- `startDate` (*bắt buộc*, `LocalDate`): Ngày bắt đầu tìm kiếm chu kỳ. Nằm trong khoảng `[hôm nay, hôm nay + 30 ngày]`.
- `weeks` (*bắt buộc*, `int`): Số tuần đặt lặp lại. Hợp lệ từ **1 đến 12 tuần**.
- **Quy tắc tính toán ngày (Date Sequence):** Ngày đầu tiên được tính bằng ngày gần nhất kể từ `startDate` thỏa mãn đúng `dayOfWeek`. Các ngày tiếp theo là `firstDate.plusWeeks(i)`.
- **Giới hạn phạm vi (90-day Horizon):** Ngày cuối cùng trong chuỗi không được vượt quá `hôm nay + 90 ngày`. Nếu vượt quá $\rightarrow$ ném 400 `RECURRING_HORIZON_EXCEEDED`.

### 3.2. Request Body Mẫu:
```json
{
  "courtId": 1,
  "timeSlotId": 2,
  "dayOfWeek": "MONDAY",
  "startDate": "2026-10-19",
  "weeks": 4,
  "note": "Đặt cố định câu lạc bộ thứ 2 hàng tuần"
}
```

### 3.3. Response Thành Công (201 Created):
Toàn bộ $N$ lượt đặt sân được tạo thành công với trạng thái ban đầu `PENDING`.
```json
{
  "code": 201,
  "message": "Đặt lịch cố định thành công",
  "data": {
    "createdCount": 4,
    "bookings": [
      {
        "id": 101,
        "userId": 5,
        "userFullName": "Trần Thị B",
        "userEmail": "tranthib@gmail.com",
        "guestName": null,
        "guestPhone": null,
        "courtId": 1,
        "courtName": "Sân 1 (Thảm Victor)",
        "complexId": 1,
        "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
        "bookingDate": "2026-10-19",
        "timeSlotId": 2,
        "timeSlotName": "Giờ hành chính 08:00–16:00",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "totalAmount": 800000.00,
        "status": "PENDING",
        "note": "Đặt cố định câu lạc bộ thứ 2 hàng tuần",
        "createdAt": "2026-10-18T10:05:00",
        "updatedAt": "2026-10-18T10:05:00"
      },
      {
        "id": 102,
        "bookingDate": "2026-10-26",
        "status": "PENDING",
        "totalAmount": 800000.00
      },
      {
        "id": 103,
        "bookingDate": "2026-11-02",
        "status": "PENDING",
        "totalAmount": 800000.00
      },
      {
        "id": 104,
        "bookingDate": "2026-11-09",
        "status": "PENDING",
        "totalAmount": 800000.00
      }
    ]
  }
}
```

### 3.4. Response Lỗi Xung Đột Slot (409 Conflict):
Khi **bất kỳ ngày nào** trong chu kỳ đã có người đặt trước, toàn bộ giao dịch bị hủy bỏ (Rollback 100%), trả về mã `RECURRING_SLOT_CONFLICT` kèm danh sách cụ thể các ngày bị xung đột trong trường `data`:
```json
{
  "code": 409,
  "message": "Một hoặc nhiều ngày trong chu kỳ đã có người đặt",
  "data": [
    "2026-10-26"
  ]
}
```

### 3.5. Response Lỗi Vượt Phạm Vi Cho Phép (400 Bad Request):
```json
{
  "code": 400,
  "message": "Ngày đặt cuối cùng vượt quá giới hạn 90 ngày",
  "data": null
}
```
