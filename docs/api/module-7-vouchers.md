# TÀI LIỆU API CHI TIẾT - MODULE 7: PROMOTIONS & VOUCHERS

> **Base URL:** `http://localhost:8080/api/v1/vouchers`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`) trừ endpoint công khai `GET /active`.

---

## Danh Mục Các Endpoints

| STT | Phương thức | Endpoint URI | Quyền hạn | Mô tả |
|:---:|---|---|---|---|
| 1 | `POST` | `/api/v1/vouchers` | `ROLE_ADMIN` | Tạo mới voucher khuyến mãi với loại PERCENTAGE hoặc FIXED_AMOUNT. Trả về `201 Created`. |
| 2 | `GET` | `/api/v1/vouchers` | `ROLE_ADMIN` | Lấy danh sách voucher quản trị (hỗ trợ phân trang, tìm kiếm theo keyword và lọc theo trạng thái active). Trả về `200 OK`. |
| 3 | `GET` | `/api/v1/vouchers/{id}` | `ROLE_ADMIN` | Lấy thông tin chi tiết một voucher theo ID. Trả về `200 OK`. |
| 4 | `PUT` | `/api/v1/vouchers/{id}` | `ROLE_ADMIN` | Cập nhật thông tin voucher. Trả về `200 OK`. |
| 5 | `PATCH` | `/api/v1/vouchers/{id}/status` | `ROLE_ADMIN` | Đảo ngược trạng thái hoạt động (bật/tắt active) của voucher. Trả về `200 OK`. |
| 6 | `DELETE` | `/api/v1/vouchers/{id}` | `ROLE_ADMIN` | Xóa voucher (xóa cứng nếu usedCount == 0, chuyển active=false nếu đã có lượt dùng). Trả về `200 OK`. |
| 7 | `GET` | `/api/v1/vouchers/active` | `Public` (permitAll) | Khách hàng và khách vãng lai xem danh sách voucher đang hoạt động và còn thời hạn hiệu lực. Trả về `200 OK`. |
| 8 | `POST` | `/api/v1/vouchers/apply` | `Authenticated` (Chủ booking hoặc `STAFF`/`ADMIN`) | Áp dụng mã voucher vào đơn đặt sân PENDING trước khi thanh toán, tự động trừ tiền đơn. Trả về `200 OK`. |

---

## 1. Tạo Mới Voucher (Create Voucher)

- **Endpoint:** `POST /api/v1/vouchers`
- **Quyền hạn:** `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`
- **Headers:** `Authorization: Bearer <admin_access_token>`

### 1.1. Request Body Mẫu - Voucher Giảm Theo Phần Trăm (PERCENTAGE):
```json
{
  "code": "SUMMER2026",
  "name": "Khuyến mãi chào hè 2026",
  "description": "Giảm 20% tối đa 50.000đ cho đơn đặt sân từ 100.000đ",
  "discountType": "PERCENTAGE",
  "discountValue": 20.00,
  "maxDiscountAmount": 50000.00,
  "minOrderAmount": 100000.00,
  "usageLimit": 100,
  "userUsageLimit": 2,
  "startDate": "2026-06-01T00:00:00",
  "endDate": "2026-08-31T23:59:59",
  "active": true
}
```

### 1.2. Request Body Mẫu - Voucher Giảm Số Tiền Cố Định (FIXED_AMOUNT):
```json
{
  "code": "GIAM30K",
  "name": "Ưu đãi thành viên mới",
  "description": "Giảm ngay 30.000đ trực tiếp vào đơn đặt sân",
  "discountType": "FIXED_AMOUNT",
  "discountValue": 30000.00,
  "minOrderAmount": 80000.00,
  "usageLimit": 500,
  "userUsageLimit": 1,
  "startDate": "2026-01-01T00:00:00",
  "endDate": "2026-12-31T23:59:59",
  "active": true
}
```

### 1.3. Response Thành Công (201 Created):
```json
{
  "success": true,
  "message": "Tạo voucher thành công",
  "data": {
    "id": 1,
    "code": "SUMMER2026",
    "name": "Khuyến mãi chào hè 2026",
    "description": "Giảm 20% tối đa 50.000đ cho đơn đặt sân từ 100.000đ",
    "discountType": "PERCENTAGE",
    "discountValue": 20.00,
    "maxDiscountAmount": 50000.00,
    "minOrderAmount": 100000.00,
    "usageLimit": 100,
    "usedCount": 0,
    "userUsageLimit": 2,
    "startDate": "2026-06-01T00:00:00",
    "endDate": "2026-08-31T23:59:59",
    "active": true,
    "createdAt": "2026-10-31T10:00:00",
    "updatedAt": "2026-10-31T10:00:00"
  },
  "timestamp": "2026-10-31T03:00:00Z"
}
```

---

## 2. Quản Trị Danh Sách Voucher (Admin Get Vouchers)

- **Endpoint:** `GET /api/v1/vouchers`
- **Quyền hạn:** `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`
- **Query Params:**
  - `keyword` (tùy chọn): Tìm kiếm gần đúng theo mã hoặc tên voucher.
  - `active` (tùy chọn): Lọc theo trạng thái `true` / `false`.
  - `page` (mặc định 0), `size` (mặc định 10), `sort` (mặc định `createdAt,desc`).
- **Response Thành Công (200 OK):**
```json
{
  "success": true,
  "message": "Lấy danh sách voucher thành công",
  "data": {
    "items": [
      {
        "id": 1,
        "code": "SUMMER2026",
        "name": "Khuyến mãi chào hè 2026",
        "discountType": "PERCENTAGE",
        "discountValue": 20.00,
        "usedCount": 5,
        "usageLimit": 100,
        "active": true
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

## 3. Khám Phá Khuyến Mãi Công Khai (Public Active Vouchers)

- **Endpoint:** `GET /api/v1/vouchers/active`
- **Quyền hạn:** `Public` (Không yêu cầu token)
- **Query Params:** `page`, `size`, `sort`
- **Mô tả:** Chỉ trả về các voucher có `active = true` và `startDate <= now <= endDate`.

---

## 4. Áp Dụng Voucher Vào Đơn Đặt Sân (Apply Voucher)

- **Endpoint:** `POST /api/v1/vouchers/apply`
- **Quyền hạn:** `@PreAuthorize("isAuthenticated()")`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
```json
{
  "bookingId": 10,
  "code": "SUMMER2026"
}
```
- **Response Thành Công (200 OK):**
```json
{
  "success": true,
  "message": "Áp dụng voucher thành công",
  "data": {
    "bookingId": 10,
    "voucherCode": "SUMMER2026",
    "voucherName": "Khuyến mãi chào hè 2026",
    "discountType": "PERCENTAGE",
    "originalAmount": 200000.00,
    "discountAmount": 40000.00,
    "finalAmount": 160000.00
  },
  "timestamp": "2026-10-31T03:00:00Z"
}
```

---

## 5. Danh Mục Mã Lỗi Phổ Biến Của Module 7

| HTTP Status | Error Code | Ý nghĩa |
|---|---|---|
| `400 BAD_REQUEST` | `VOUCHER_NOT_ACTIVE` | Voucher đang bị tắt kích hoạt |
| `400 BAD_REQUEST` | `VOUCHER_EXPIRED` | Voucher đã quá thời hạn kết thúc |
| `400 BAD_REQUEST` | `VOUCHER_NOT_STARTED` | Voucher chưa tới thời điểm bắt đầu |
| `400 BAD_REQUEST` | `VOUCHER_USAGE_EXCEEDED` | Voucher đã hết lượt sử dụng toàn hệ thống |
| `400 BAD_REQUEST` | `VOUCHER_USER_LIMIT_EXCEEDED` | Khách hàng đã sử dụng hết lượt cho phép |
| `400 BAD_REQUEST` | `VOUCHER_MIN_AMOUNT_NOT_MET` | Giá trị đơn đặt sân chưa đạt mức tối thiểu |
| `403 FORBIDDEN` | `ACCESS_DENIED` | Khách hàng cố tình áp mã cho đơn của người khác |
| `404 NOT_FOUND` | `VOUCHER_NOT_FOUND` | Mã voucher không tồn tại trong hệ thống |
| `404 NOT_FOUND` | `BOOKING_NOT_FOUND` | Đơn đặt sân không tồn tại |
| `409 CONFLICT` | `VOUCHER_CODE_EXISTS` | Tạo voucher trùng mã code đã có |
| `409 CONFLICT` | `BOOKING_NOT_PAYABLE` | Đơn đặt sân không ở trạng thái PENDING |
| `409 CONFLICT` | `VOUCHER_ALREADY_APPLIED` | Đơn đặt sân này đã được áp dụng voucher trước đó |

