# TÀI LIỆU API CHI TIẾT - MODULE 6: PAYMENTS & REFUNDS

> **Base URL:** `http://localhost:8080/api/v1/payments`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`) trên tất cả các endpoint.

---

## Danh Mục Các Endpoints

| STT | Phương thức | Endpoint URI | Quyền hạn | Mô tả |
|:---:|---|---|---|---|
| 1 | `POST` | `/` | `Authenticated` (Chủ booking hoặc `STAFF`/`ADMIN`) | Thanh toán đơn đặt sân (FULL hoặc DEPOSIT). Status booking chuyển sang `CONFIRMED`. Trả về `201 Created`. |
| 2 | `POST` | `/{id}/refund` | `STAFF`, `ADMIN` | Hoàn tiền giao dịch (Payment $\rightarrow$ `REFUNDED`, Booking $\rightarrow$ `CANCELLED`). Trả về `200 OK`. |
| 3 | `GET` | `/` | `STAFF`, `ADMIN` | Lấy lịch sử giao dịch toàn hệ thống (phân trang, lọc, sắp xếp). Trả về `200 OK`. |
| 4 | `GET` | `/my` | `Authenticated` | Lấy lịch sử giao dịch thanh toán của chính người dùng đang đăng nhập. Trả về `200 OK`. |
| 5 | `GET` | `/{id}` | `Authenticated` (Chủ booking hoặc `STAFF`/`ADMIN`) | Lấy chi tiết hóa đơn giao dịch thanh toán (`PaymentDetailResponse`). Trả về `200 OK`. |

---

## 1. Thanh Toán Đơn Đặt Sân (Create Payment)

Cho phép khách hàng thanh toán cho đơn đặt sân của chính mình qua cổng thanh toán trực tuyến, hoặc Nhân viên Lễ tân/Quản trị viên thu tiền và xác nhận thanh toán trực tiếp cho khách.

- **Endpoint:** `POST /api/v1/payments`
- **Quyền hạn:** `@PreAuthorize("isAuthenticated()")`
- **Kiểm tra quyền tại Service:** Người gọi phải là chủ sở hữu của đơn đặt sân (`booking.user.id == currentUserId`) hoặc có vai trò `STAFF` / `ADMIN`. Khách hàng thông thường cố tình thanh toán cho đơn của người khác sẽ bị từ chối với mã **403 Forbidden (`ACCESS_DENIED`)**.
- **Headers:** `Authorization: Bearer <access_token>`

### 1.1. Ràng Buộc Nghiệp Vụ & An Toàn Tài Chính:
1. **Tính tiền Server-side Tuyệt Đối:** Request body **không có trường `amount`**. Số tiền thanh toán được backend tính toán trực tiếp từ `booking.totalAmount` đã snapshot:
   - `FULL`: 100% `booking.totalAmount`.
   - `DEPOSIT`: 50% `booking.totalAmount` (làm tròn 2 chữ số thập phân, `RoundingMode.HALF_UP`).
2. **Chống Thanh Toán Trùng Lặp (Double-Charge Protection):** Nếu đơn đặt sân đã tồn tại một giao dịch mang trạng thái `SUCCESS` $\rightarrow$ ném lỗi **409 Conflict (`BOOKING_ALREADY_PAID`)**.
3. **Kiểm Tra Trạng Thái Đơn:** Đơn đặt sân bắt buộc phải ở trạng thái **`PENDING`**. Nếu đơn đã `CONFIRMED`, `CHECKED_IN`, hoặc `CANCELLED` $\rightarrow$ ném lỗi **409 Conflict (`BOOKING_NOT_PAYABLE`)**.
4. **Đồng Bộ Trạng Thái Nguyên Tử (Atomic State Transition):** Khi cổng thanh toán phản hồi thành công (`chargeResult.success == true`):
   - Tạo bản ghi `Payment` với `status = SUCCESS`, lưu `paidAt = now()` và `transactionRef = "MOCK-<UUID>"`.
   - Cập nhật `booking.status = CONFIRMED` trong cùng một giao dịch database `@Transactional`.

### 1.2. Request Body Mẫu - Thanh Toán Toàn Phần (FULL):
```json
{
  "bookingId": 10,
  "paymentType": "FULL",
  "paymentMethod": "E_WALLET",
  "note": "Khách thanh toán toàn phần qua ví điện tử"
}
```

### 1.3. Request Body Mẫu - Đặt Cọc 50% (DEPOSIT):
```json
{
  "bookingId": 10,
  "paymentType": "DEPOSIT",
  "paymentMethod": "BANK_TRANSFER",
  "note": "Khách đặt cọc 50% chuyển khoản ngân hàng"
}
```

### 1.4. Response Thành Công (201 Created):
```json
{
  "code": 201,
  "message": "Thanh toán thành công",
  "data": {
    "id": 1,
    "bookingId": 10,
    "amount": 400000.00,
    "paymentType": "FULL",
    "paymentMethod": "E_WALLET",
    "status": "SUCCESS",
    "transactionRef": "MOCK-550e8400-e29b-41d4-a716-446655440000",
    "paidAt": "2026-10-22T10:15:30",
    "note": "Khách thanh toán toàn phần qua ví điện tử",
    "createdAt": "2026-10-22T10:15:30",
    "updatedAt": "2026-10-22T10:15:30"
  }
}
```

### 1.5. Các Mã Lỗi Thường Gặp:
- **400 Bad Request (`VALIDATION_FAILED`):** Thiếu `bookingId`, `paymentType` hoặc `paymentMethod`.
- **401 Unauthorized:** Không có JWT Token hoặc Token hết hạn.
- **403 Forbidden (`ACCESS_DENIED`):** Khách hàng `CUSTOMER` cố tình thanh toán cho đơn của người dùng khác.
- **404 Not Found (`BOOKING_NOT_FOUND`):** `bookingId` không tồn tại trong hệ thống.
- **409 Conflict (`BOOKING_NOT_PAYABLE`):** Đơn đặt sân không ở trạng thái `PENDING` (đã bị hủy hoặc đã hoàn tất).
- **409 Conflict (`BOOKING_ALREADY_PAID`):** Đơn đặt sân này đã được thanh toán thành công trước đó.

---

## 2. Hoàn Tiền Giao Dịch (Refund Payment)

Dành cho Nhân viên Lễ tân (`STAFF`) hoặc Quản trị viên (`ADMIN`) thực hiện hoàn tiền cho khách hàng khi hủy lịch đặt sân hợp lệ.

- **Endpoint:** `POST /api/v1/payments/{id}/refund`
- **Quyền hạn:** `@PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")`
- **Headers:** `Authorization: Bearer <staff_or_admin_jwt_token>`

### 2.1. Ràng Buộc Nghiệp Vụ Hoàn Tiền:
1. **Kiểm Tra Giao Dịch:** Giao dịch thanh toán phải tồn tại và đang ở trạng thái **`SUCCESS`**. Nếu giao dịch ở trạng thái `PENDING`, `FAILED` hoặc đã `REFUNDED` $\rightarrow$ ném lỗi **409 Conflict (`REFUND_NOT_ALLOWED`)**.
2. **Kiểm Tra Trạng Thái Sân:** Khách hàng **chưa vào sân** (`booking.status ∉ {CHECKED_IN, COMPLETED}`). Nếu khách đã nhận sân hoặc khung giờ thi đấu đã hoàn tất $\rightarrow$ ném lỗi **409 Conflict (`REFUND_NOT_ALLOWED`)**.
3. **Tự Động Hủy Lịch Đặt Sân (Auto Soft-Cancel):**
   - Chuyển `payment.status: SUCCESS -> REFUNDED`.
   - Ghi nhận lý do hoàn tiền vào trường `note`.
   - Tự động cập nhật `booking.status: CONFIRMED -> CANCELLED` (giải phóng slot ngay lập tức cho khách khác đặt và bảo toàn lịch sử giao dịch).

### 2.2. Request Body Mẫu:
```json
{
  "reason": "Khách báo bận việc đột xuất xin hủy trước giờ thi đấu"
}
```
*(Trường `reason` là tùy chọn, độ dài tối đa 500 ký tự).*

### 2.3. Response Thành Công (200 OK):
```json
{
  "code": 200,
  "message": "Hoàn tiền giao dịch thành công",
  "data": {
    "id": 1,
    "bookingId": 10,
    "amount": 400000.00,
    "paymentType": "FULL",
    "paymentMethod": "E_WALLET",
    "status": "REFUNDED",
    "transactionRef": "MOCK-550e8400-e29b-41d4-a716-446655440000",
    "paidAt": "2026-10-22T10:15:30",
    "note": "Khách thanh toán toàn phần qua ví điện tử | Lý do hoàn tiền: Khách báo bận việc đột xuất xin hủy trước giờ thi đấu",
    "createdAt": "2026-10-22T10:15:30",
    "updatedAt": "2026-10-22T10:30:00"
  }
}
```

### 2.4. Các Mã Lỗi Thường Gặp:
- **401 Unauthorized:** Chưa đăng nhập.
- **403 Forbidden:** Khách hàng (`CUSTOMER`) cố tình gọi endpoint hoàn tiền.
- **404 Not Found (`PAYMENT_NOT_FOUND`):** Không tìm thấy giao dịch thanh toán với `id` cung cấp.
- **409 Conflict (`REFUND_NOT_ALLOWED`):**
  - Giao dịch chưa thanh toán thành công hoặc đã được hoàn tiền trước đó.
  - Đơn đặt sân tương ứng đã vào sân (`CHECKED_IN`) hoặc đã hoàn tất thi đấu (`COMPLETED`).

---

## 3. Lịch Sử Giao Dịch Toàn Hệ Thống (Get All Payments)

Dành cho Nhân viên Lễ tân (`STAFF`) hoặc Quản trị viên (`ADMIN`) tra cứu, đối soát lịch sử giao dịch trên toàn hệ thống.

- **Endpoint:** `GET /api/v1/payments`
- **Quyền hạn:** `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")`
- **Headers:** `Authorization: Bearer <staff_or_admin_jwt_token>`

### 3.1. Query Parameters (`PaymentFilterRequest` & Phân trang):
| Tham số | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `PaymentStatus` | — | Lọc theo trạng thái (`PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`). |
| `paymentMethod` | `PaymentMethod` | — | Lọc theo phương thức (`CASH`, `BANK_TRANSFER`, `E_WALLET`). |
| `bookingId` | `Long` | — | Lọc theo mã đơn đặt sân. |
| `fromDate` | `LocalDate` (`YYYY-MM-DD`) | — | Lọc giao dịch tạo từ đầu ngày `fromDate` (`createdAt >= fromDate 00:00:00`). |
| `toDate` | `LocalDate` (`YYYY-MM-DD`) | — | Lọc giao dịch tạo đến cuối ngày `toDate` (`createdAt <= toDate 23:59:59.999999999`). |
| `page` | `int` | `0` | Chỉ số trang (bắt đầu từ `0`). |
| `size` | `int` | `10` | Số lượng phần tử mỗi trang. |
| `sort` | `String` | `createdAt,desc` | Trường sắp xếp hợp lệ (whitelist): `id`, `amount`, `paidAt`, `createdAt` kèm chiều `asc` hoặc `desc`. |

### 3.2. Response Thành Công (200 OK):
```json
{
  "success": true,
  "message": "Lấy lịch sử giao dịch thành công",
  "data": {
    "items": [
      {
        "id": 1,
        "bookingId": 10,
        "amount": 400000.00,
        "paymentType": "FULL",
        "paymentMethod": "E_WALLET",
        "status": "SUCCESS",
        "transactionRef": "MOCK-550e8400-e29b-41d4-a716-446655440000",
        "paidAt": "2026-10-22T10:15:30",
        "note": "Khách thanh toán toàn phần qua ví điện tử",
        "createdAt": "2026-10-22T10:15:30",
        "updatedAt": "2026-10-22T10:15:30"
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

### 3.3. Các Mã Lỗi Thường Gặp:
- **400 Bad Request (`BAD_REQUEST`):** `fromDate` lớn hơn `toDate`.
- **400 Bad Request (`INVALID_SORT_FIELD`):** Trường sắp xếp không nằm trong whitelist (`id`, `amount`, `paidAt`, `createdAt`).
- **401 Unauthorized:** Chưa đăng nhập.
- **403 Forbidden:** Khách hàng (`CUSTOMER`) không có quyền truy cập endpoint này.

---

## 4. Lịch Sử Giao Dịch Của Tôi (Get My Payments)

Cho phép người dùng đang đăng nhập xem lại toàn bộ các giao dịch thanh toán gắn với đơn đặt sân của chính mình (`booking.user.id == currentUserId`).

- **Endpoint:** `GET /api/v1/payments/my`
- **Quyền hạn:** `@PreAuthorize("isAuthenticated()")`
- **Headers:** `Authorization: Bearer <access_token>`

### 4.1. Query Parameters:
- Giống mục **3.1** (`status`, `paymentMethod`, `bookingId`, `fromDate`, `toDate`, `page`, `size`, `sort`), đồng thời hệ thống tự động ràng buộc thêm điều kiện chỉ trả về các giao dịch thuộc đơn đặt sân của `currentUserId`.

### 4.2. Response Thành Công (200 OK):
- Trả về `ApiResponse<PageResponse<PaymentResponse>>` với message `"Lấy lịch sử giao dịch của bạn thành công"` (cấu trúc giống mục **3.2**).

### 4.3. Các Mã Lỗi Thường Gặp:
- **400 Bad Request (`BAD_REQUEST`):** `fromDate` lớn hơn `toDate`.
- **400 Bad Request (`INVALID_SORT_FIELD`):** Trường sắp xếp không hợp lệ.
- **401 Unauthorized:** Chưa đăng nhập.

---

## 5. Chi Tiết Hóa Đơn Giao Dịch (Get Payment Detail / Invoice)

Trả về thông tin đầy đủ của một giao dịch thanh toán kèm thông tin đơn đặt sân, sân/cụm sân, khung giờ và thông tin khách hàng để hiển thị hoặc in hóa đơn.

- **Endpoint:** `GET /api/v1/payments/{id}`
- **Quyền hạn:** `@PreAuthorize("isAuthenticated()")`
- **Kiểm tra quyền tại Service:**
  - `STAFF` hoặc `ADMIN` có quyền xem bất kỳ hóa đơn nào (bao gồm đơn đặt tại quầy cho khách vãng lai).
  - `CUSTOMER` chỉ được xem hóa đơn thuộc đơn đặt sân của chính mình (`booking.user != null && booking.user.id == currentUserId`). Nếu cố tình xem hóa đơn của người khác hoặc đơn khách vãng lai (`booking.user == null`) $\rightarrow$ ném lỗi **403 Forbidden (`ACCESS_DENIED`)**.
- **Headers:** `Authorization: Bearer <access_token>`

### 5.1. Response Thành Công (200 OK):
```json
{
  "success": true,
  "message": "Lấy chi tiết hóa đơn giao dịch thành công",
  "data": {
    "id": 1,
    "bookingId": 10,
    "amount": 400000.00,
    "paymentType": "FULL",
    "paymentMethod": "E_WALLET",
    "status": "SUCCESS",
    "transactionRef": "MOCK-550e8400-e29b-41d4-a716-446655440000",
    "paidAt": "2026-10-22T10:15:30",
    "note": "Khách thanh toán toàn phần qua ví điện tử",
    "createdAt": "2026-10-22T10:15:30",
    "updatedAt": "2026-10-22T10:15:30",
    "bookingDate": "2026-11-15",
    "startTime": "18:00:00",
    "endTime": "19:00:00",
    "courtName": "Sân 1",
    "complexName": "Cụm Sân Cầu Giấy",
    "bookingStatus": "CONFIRMED",
    "bookingTotalAmount": 400000.00,
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0901234567",
    "customerEmail": "user@example.com"
  }
}
```
*(Lưu ý: Với đơn khách vãng lai đặt tại quầy, `customerName` và `customerPhone` lấy từ `guestName`/`guestPhone`, còn `customerEmail` có giá trị `null`).*

### 5.2. Các Mã Lỗi Thường Gặp:
- **401 Unauthorized:** Chưa đăng nhập.
- **403 Forbidden (`ACCESS_DENIED`):** Khách hàng (`CUSTOMER`) xem hóa đơn của người khác hoặc hóa đơn khách vãng lai.
- **404 Not Found (`PAYMENT_NOT_FOUND`):** Không tìm thấy giao dịch thanh toán với `id` cung cấp.
