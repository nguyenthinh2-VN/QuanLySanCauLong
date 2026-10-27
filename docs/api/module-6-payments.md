# TÀI LIỆU API CHI TIẾT - MODULE 6: PAYMENTS & REFUNDS

> **Base URL:** `http://localhost:8080/api/v1/payments`  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer <access_token>`) trên tất cả các endpoint.

---

## Danh Mục Các Endpoints

| STT | Phương thức | Endpoint URI | Quyền hạn | Mô tả |
|:---:|---|---|---|---|
| 1 | `POST` | `/` | `Authenticated` (Chủ booking hoặc `STAFF`/`ADMIN`) | Thanh toán đơn đặt sân (FULL hoặc DEPOSIT). Status booking chuyển sang `CONFIRMED`. Trả về `201 Created`. |
| 2 | `POST` | `/{id}/refund` | `STAFF`, `ADMIN` | Hoàn tiền giao dịch (Payment $\rightarrow$ `REFUNDED`, Booking $\rightarrow$ `CANCELLED`). Trả về `200 OK`. |

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
