# TÀI LIỆU TÍCH HỢP API — MODULE 8: THỐNG KÊ & BÁO CÁO (REPORTS / DASHBOARD)

> **Mục tiêu:** Cung cấp thông tin đặc tả chi tiết 2 RESTful endpoints phục vụ trang Báo cáo Quản trị (Admin Dashboard) của hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong`.  
> **Quyền hạn truy cập:** Dành riêng cho Quản trị viên (`ADMIN`).  
> **Base URL:** `/api/v1/reports`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`).

---

## 1. Danh Sách Endpoints

| # | Phương thức | Endpoint | Mô tả | Quyền hạn |
|:---:|:---:|---|---|:---:|
| 1 | `GET` | `/api/v1/reports/revenue` | Báo cáo doanh thu thuần toàn kỳ & theo ngày/tuần/tháng | `ROLE_ADMIN` |
| 2 | `GET` | `/api/v1/reports/occupancy` | Báo cáo tỉ lệ lấp đầy sân (công suất sử dụng) | `ROLE_ADMIN` |

---

## 2. Chi Tiết Từng Endpoint

### 2.1. Báo cáo Doanh thu (`GET /api/v1/reports/revenue`)

Thống kê doanh thu gộp (`grossRevenue`), tiền hoàn lại (`refundedAmount`), doanh thu thuần (`netRevenue = gross - refunded`), tổng số giao dịch thành công, phân tích theo phương thức thanh toán (`byPaymentMethod`) và dòng thời gian (`timeline`).

#### Query Parameters:
- `from` (*LocalDate*, ISO `yyyy-MM-dd`, optional): Ngày bắt đầu. Mặc định: `to - 29 ngày`.
- `to` (*LocalDate*, ISO `yyyy-MM-dd`, optional): Ngày kết thúc. Mặc định: hôm nay (`LocalDate.now()`).
- `groupBy` (*String*, optional): Chế độ gom nhóm thời gian. Giá trị hợp lệ: `DAY`, `WEEK`, `MONTH`. Mặc định: `DAY`.
  - `DAY`: Mỗi ngày 1 bucket (`period = yyyy-MM-dd`).
  - `WEEK`: Gom theo tuần Thứ Hai–Chủ Nhật (`period = yyyy-MM-dd` của ngày Thứ Hai đầu tuần).
  - `MONTH`: Gom theo tháng (`period = yyyy-MM`).

> [!NOTE]
> Bảng thời gian `timeline` luôn sinh đầy đủ dải chu kỳ từ `from` đến `to`. Nếu một ngày/tuần/tháng không có thanh toán nào, các chỉ số doanh thu sẽ bằng `0.00` và `transactionCount = 0` giúp biểu đồ Frontend vẽ liền mạch không bị đứt đoạn.

#### Response Thành công (`200 OK`):
```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "from": "2026-11-01",
    "to": "2026-11-03",
    "groupBy": "DAY",
    "totals": {
      "grossRevenue": 3500000.00,
      "refundedAmount": 200000.00,
      "netRevenue": 3300000.00,
      "transactionCount": 14
    },
    "byPaymentMethod": [
      {
        "paymentMethod": "BANK_TRANSFER",
        "grossRevenue": 2000000.00,
        "transactionCount": 8
      },
      {
        "paymentMethod": "CASH",
        "grossRevenue": 1500000.00,
        "transactionCount": 6
      }
    ],
    "timeline": [
      {
        "period": "2026-11-01",
        "grossRevenue": 1500000.00,
        "refundedAmount": 0.00,
        "netRevenue": 1500000.00,
        "transactionCount": 6
      },
      {
        "period": "2026-11-02",
        "grossRevenue": 0.00,
        "refundedAmount": 0.00,
        "netRevenue": 0.00,
        "transactionCount": 0
      },
      {
        "period": "2026-11-03",
        "grossRevenue": 2000000.00,
        "refundedAmount": 200000.00,
        "netRevenue": 1800000.00,
        "transactionCount": 8
      }
    ]
  }
}
```

---

### 2.2. Báo cáo Tỉ lệ Lấp đầy Sân (`GET /api/v1/reports/occupancy`)

Thống kê tỉ lệ lấp đầy sân (công suất sử dụng thực tế) dựa trên các booking có trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`. Booking `CANCELLED` bị loại bỏ hoàn toàn.

#### Mẫu số Công suất (Total Slots):
$$\text{Mẫu số} = \text{Số sân AVAILABLE (hoặc 1 nếu lọc courtId)} \times \text{Số TimeSlot} \times \text{Số ngày trong kỳ}$$
- Sân `MAINTENANCE` không tính vào mẫu số.
- Nếu không có sân `AVAILABLE` hoặc chưa cấu hình `TimeSlot`, hệ thống trả `overallRate = 0.00` an toàn, không bị lỗi chia cho 0.

#### Query Parameters:
- `from` (*LocalDate*, ISO `yyyy-MM-dd`, optional): Ngày bắt đầu. Mặc định: `to - 29 ngày`.
- `to` (*LocalDate*, ISO `yyyy-MM-dd`, optional): Ngày kết thúc. Mặc định: hôm nay.
- `courtId` (*Long*, optional): Lọc theo một sân cụ thể. Nếu sân không tồn tại, trả về `404 Not Found`.

#### Response Thành công (`200 OK`):
```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "from": "2026-11-01",
    "to": "2026-11-02",
    "overallRate": 62.50,
    "bookedSlots": 10,
    "totalSlots": 16,
    "byCourt": [
      {
        "courtId": 1,
        "courtName": "Sân A1",
        "bookedSlots": 6,
        "totalSlots": 8,
        "occupancyRate": 75.00
      },
      {
        "courtId": 2,
        "courtName": "Sân A2",
        "bookedSlots": 4,
        "totalSlots": 8,
        "occupancyRate": 50.00
      }
    ],
    "daily": [
      {
        "date": "2026-11-01",
        "bookedSlots": 6,
        "totalSlots": 8,
        "occupancyRate": 75.00
      },
      {
        "date": "2026-11-02",
        "bookedSlots": 4,
        "totalSlots": 8,
        "occupancyRate": 50.00
      }
    ]
  }
}
```

---

## 3. Các Phản Hồi Lỗi Thường Gặp (Error Responses)

### 3.1. Ngày bắt đầu sau ngày kết thúc (`400 Bad Request`)
```json
{
  "success": false,
  "errorCode": "BAD_REQUEST",
  "message": "Ngày bắt đầu không được sau ngày kết thúc",
  "data": null
}
```

### 3.2. Khoảng thời gian vượt quá 366 ngày (`400 Bad Request`)
```json
{
  "success": false,
  "errorCode": "BAD_REQUEST",
  "message": "Khoảng thời gian báo cáo không được vượt quá 366 ngày",
  "data": null
}
```

### 3.3. Chưa đăng nhập / Thiếu JWT token (`401 Unauthorized`)
```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "Bạn cần đăng nhập để truy cập tài nguyên này",
  "data": null
}
```

### 3.4. Sai vai trò người dùng (CUSTOMER / STAFF gọi API) (`403 Forbidden`)
```json
{
  "success": false,
  "errorCode": "ACCESS_DENIED",
  "message": "Bạn không có quyền thực hiện thao tác này",
  "data": null
}
```

### 3.5. Không tìm thấy sân theo `courtId` (`404 Not Found`)
```json
{
  "success": false,
  "errorCode": "COURT_NOT_FOUND",
  "message": "Không tìm thấy sân cầu lông trong hệ thống",
  "data": null
}
```

