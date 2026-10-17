# TÀI LIỆU API CHI TIẾT - MODULE 4: BOOKINGS & CONCURRENCY CONTROL

> **Base URL:** `http://localhost:8080/api/v1/bookings`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`) đối với các endpoint bảo mật.

---

## Danh Mục Các Endpoints

| STT | Phương thức | Endpoint URI | Quyền hạn | Mô tả |
|:---:|---|---|---|---|
| 1 | `GET` | `/availability` | Public (permitAll) | Xem danh sách slot trống theo ngày cho từng sân |
| 2 | `POST` | `/` | Authenticated | Đặt sân online cho chính mình (Status: `PENDING`) |
| 3 | `GET` | `/my` | Authenticated | Lịch sử đặt sân của user hiện tại (phân trang, lọc, sort) |
| 4 | `PUT` | `/{id}` | Owner hoặc ADMIN | Đổi lịch đặt sân trước giờ bắt đầu |
| 5 | `DELETE` | `/{id}` | Owner hoặc ADMIN | Hủy lịch đặt sân (Soft-Cancel -> `CANCELLED`) |

---

## 1. Xem Lịch Trống Theo Ngày

- **Endpoint:** `GET /api/v1/bookings/availability`
- **Quyền hạn:** Public (`permitAll`) — Không yêu cầu token.
- **Query Parameters:**
  - `date` (*bắt buộc*, `LocalDate`, định dạng `YYYY-MM-DD`): Ngày cần tra cứu. Hợp lệ trong khoảng `[hôm nay, hôm nay + 30 ngày]`.
  - `courtId` (*tùy chọn*, `Long`): Lọc theo ID sân con cụ thể.
  - `complexId` (*tùy chọn*, `Long`): Lọc theo ID cụm sân cụ thể.

### Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Tra cứu lịch trống sân thành công",
  "data": [
    {
      "courtId": 1,
      "courtName": "Sân 1 (Thảm Victor)",
      "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
      "courtStatus": "AVAILABLE",
      "slots": [
        {
          "timeSlotId": 1,
          "name": "Sáng sớm 05:00–08:00",
          "startTime": "05:00:00",
          "endTime": "08:00:00",
          "pricePerHour": 80000.00,
          "slotStatus": "PASSED"
        },
        {
          "timeSlotId": 2,
          "name": "Giờ hành chính 08:00–16:00",
          "startTime": "08:00:00",
          "endTime": "16:00:00",
          "pricePerHour": 100000.00,
          "slotStatus": "BOOKED"
        },
        {
          "timeSlotId": 3,
          "name": "Giờ vàng chiều tối 16:00–21:00",
          "startTime": "16:00:00",
          "endTime": "21:00:00",
          "pricePerHour": 150000.00,
          "slotStatus": "FREE"
        },
        {
          "timeSlotId": 4,
          "name": "Đêm muộn 21:00–23:00",
          "startTime": "21:00:00",
          "endTime": "23:00:00",
          "pricePerHour": 120000.00,
          "slotStatus": "FREE"
        }
      ]
    },
    {
      "courtId": 6,
      "courtName": "Sân 3 (Đang bảo trì)",
      "complexName": "Cụm Sân Cầu Lông Thanh Xuân",
      "courtStatus": "MAINTENANCE",
      "slots": [
        {
          "timeSlotId": 1,
          "name": "Sáng sớm 05:00–08:00",
          "startTime": "05:00:00",
          "endTime": "08:00:00",
          "pricePerHour": 80000.00,
          "slotStatus": "UNAVAILABLE"
        }
      ]
    }
  ]
}
```

---

## 2. Đặt Sân Online

- **Endpoint:** `POST /api/v1/bookings`
- **Quyền hạn:** Authenticated (`@PreAuthorize("isAuthenticated()")`).
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Request Body:**
```json
{
  "courtId": 1,
  "bookingDate": "2026-10-25",
  "timeSlotId": 3,
  "note": "Thuê thêm 2 vợt cầu lông và 1 hộp cầu"
}
```

### Response Thành Công (201 Created):
```json
{
  "code": 201,
  "message": "Đặt sân thành công, đơn đặt đang chờ thanh toán",
  "data": {
    "id": 15,
    "userId": 3,
    "userFullName": "Khách Hàng Thân Thiết",
    "userEmail": "customer@badminton.com",
    "courtId": 1,
    "courtName": "Sân 1 (Thảm Victor)",
    "complexId": 1,
    "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
    "bookingDate": "2026-10-25",
    "timeSlotId": 3,
    "timeSlotName": "Giờ vàng chiều tối 16:00–21:00",
    "startTime": "16:00:00",
    "endTime": "21:00:00",
    "status": "PENDING",
    "totalAmount": 750000.00,
    "note": "Thuê thêm 2 vợt cầu lông và 1 hộp cầu",
    "createdAt": "2026-10-17T10:20:00",
    "updatedAt": "2026-10-17T10:20:00"
  }
}
```

---

## 3. Xem Lịch Sử Đặt Sân Của Mình

- **Endpoint:** `GET /api/v1/bookings/my`
- **Quyền hạn:** Authenticated (`@PreAuthorize("isAuthenticated()")`).
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Query Parameters:**
  - `status` (*tùy chọn*, `BookingStatus`): Lọc theo trạng thái (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`).
  - `fromDate` (*tùy chọn*, `LocalDate`): Lọc từ ngày.
  - `toDate` (*tùy chọn*, `LocalDate`): Lọc đến ngày.
  - `page` (*tùy chọn*, `int`, default = `0`): Trang số.
  - `size` (*tùy chọn*, `int`, default = `10`): Số bản ghi trên trang.
  - `sort` (*tùy chọn*, `String`, default = `createdAt,desc`): Sắp xếp. Whitelist cho phép: `bookingDate`, `createdAt`, `totalAmount`.

### Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Lấy lịch sử đặt sân thành công",
  "data": {
    "items": [
      {
        "id": 15,
        "userId": 3,
        "userFullName": "Khách Hàng Thân Thiết",
        "userEmail": "customer@badminton.com",
        "courtId": 1,
        "courtName": "Sân 1 (Thảm Victor)",
        "complexId": 1,
        "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
        "bookingDate": "2026-10-25",
        "timeSlotId": 3,
        "timeSlotName": "Giờ vàng chiều tối 16:00–21:00",
        "startTime": "16:00:00",
        "endTime": "21:00:00",
        "status": "PENDING",
        "totalAmount": 750000.00,
        "note": "Thuê thêm 2 vợt cầu lông và 1 hộp cầu",
        "createdAt": "2026-10-17T10:20:00",
        "updatedAt": "2026-10-17T10:20:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

---

## 4. Đổi Lịch Đặt Sân

- **Endpoint:** `PUT /api/v1/bookings/{id}`
- **Quyền hạn:** Chủ sở hữu đơn (`@bookingSecurity.isOwner(#id)`) hoặc `ROLE_ADMIN`.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Request Body:** Ít nhất 1 trường thay đổi (`courtId`, `bookingDate`, `timeSlotId`, `note`):
```json
{
  "courtId": 2,
  "bookingDate": "2026-10-26",
  "timeSlotId": 2,
  "note": "Đổi sang sân 2 vào sáng hôm sau"
}
```

### Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Đổi lịch đặt sân thành công",
  "data": {
    "id": 15,
    "userId": 3,
    "userFullName": "Khách Hàng Thân Thiết",
    "userEmail": "customer@badminton.com",
    "courtId": 2,
    "courtName": "Sân 2 (Thảm Yonex)",
    "complexId": 1,
    "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
    "bookingDate": "2026-10-26",
    "timeSlotId": 2,
    "timeSlotName": "Giờ hành chính 08:00–16:00",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "status": "PENDING",
    "totalAmount": 800000.00,
    "note": "Đổi sang sân 2 vào sáng hôm sau",
    "createdAt": "2026-10-17T10:20:00",
    "updatedAt": "2026-10-17T10:25:30"
  }
}
```

---

## 5. Hủy Lịch Đặt Sân (Soft-Cancel)

- **Endpoint:** `DELETE /api/v1/bookings/{id}`
- **Quyền hạn:** Chủ sở hữu đơn (`@bookingSecurity.isOwner(#id)`) hoặc `ROLE_ADMIN`.
- **Headers:** `Authorization: Bearer <jwt_token>`

### Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Hủy lịch đặt sân thành công",
  "data": {
    "id": 15,
    "userId": 3,
    "userFullName": "Khách Hàng Thân Thiết",
    "userEmail": "customer@badminton.com",
    "courtId": 2,
    "courtName": "Sân 2 (Thảm Yonex)",
    "complexId": 1,
    "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
    "bookingDate": "2026-10-26",
    "timeSlotId": 2,
    "timeSlotName": "Giờ hành chính 08:00–16:00",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "status": "CANCELLED",
    "totalAmount": 800000.00,
    "note": "Đổi sang sân 2 vào sáng hôm sau",
    "createdAt": "2026-10-17T10:20:00",
    "updatedAt": "2026-10-17T10:28:15"
  }
}
```

---

## 6. Các Phản Hồi Lỗi Nghiệp Vụ Thực Tế

### 400 Bad Request — Ngày Đặt Sân Không Hợp Lệ (`INVALID_BOOKING_DATE`):
*(Xảy ra khi đặt sân ngày quá khứ, quá 30 ngày tới, hoặc slot hôm nay đã kết thúc)*
```json
{
  "code": 400,
  "message": "Ngày đặt sân không hợp lệ (chỉ được đặt trong vòng 30 ngày tới)",
  "data": null
}
```

### 400 Bad Request — Trường Sắp Xếp Không Hợp Lệ (`INVALID_SORT_FIELD`):
```json
{
  "code": 400,
  "message": "Trường sắp xếp không hợp lệ: 'hackField'. Các trường hợp lệ: [bookingDate, createdAt, totalAmount]",
  "data": null
}
```

### 401 Unauthorized — Chưa Đăng Nhập (`UNAUTHORIZED`):
```json
{
  "code": 401,
  "message": "Bạn cần đăng nhập để truy cập tài nguyên này",
  "data": null
}
```

### 403 Forbidden — Không Phải Chủ Sở Hữu Đơn (`ACCESS_DENIED`):
*(Chặn bởi `@PreAuthorize` qua `BookingSecurity.isOwner(#id)` trước khi vào service, giúp bảo vệ tính tồn tại của resource)*
```json
{
  "code": 403,
  "message": "Bạn không có quyền thực hiện thao tác này",
  "data": null
}
```

### 404 Not Found — Không Tìm Thấy Sân / Slot / Booking:
```json
{
  "code": 404,
  "message": "Không tìm thấy thông tin đặt sân",
  "data": null
}
```

### 409 Conflict — Khung Giờ Đã Bị Đặt (`SLOT_ALREADY_BOOKED`):
*(Xảy ra khi có 2 request đồng thời hoặc slot đã có người giữ chỗ PENDING/CONFIRMED/CHECKED_IN)*
```json
{
  "code": 409,
  "message": "Khung giờ này đã được đặt hoặc đang chờ thanh toán",
  "data": null
}
```

### 409 Conflict — Sân Đang Bảo Trì (`COURT_NOT_AVAILABLE`):
```json
{
  "code": 409,
  "message": "Sân hiện đang bảo trì hoặc không khả dụng",
  "data": null
}
```

### 409 Conflict — Không Thể Hủy Đơn Quá Giờ Bắt Đầu (`BOOKING_NOT_CANCELLABLE`):
```json
{
  "code": 409,
  "message": "Không thể hủy đơn đặt sân ở trạng thái hiện tại hoặc đã quá giờ bắt đầu",
  "data": null
}
```

### 409 Conflict — Không Thể Đổi Lịch Đơn Quá Giờ Bắt Đầu (`BOOKING_NOT_RESCHEDULABLE`):
```json
{
  "code": 409,
  "message": "Không thể đổi lịch đơn đặt sân ở trạng thái hiện tại hoặc đã quá giờ bắt đầu",
  "data": null
}
```
