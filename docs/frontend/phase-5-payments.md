# ĐẶC TẢ CHI TIẾT FE PHASE 5: THANH TOÁN & HOÀN TIỀN (MODULE 6)

> **Mục tiêu Phase 5:**
> 1. Xây dựng hoàn chỉnh luồng **Khách hàng thanh toán đơn đặt sân (`CUSTOMER`)** trực tiếp tại trang **Lịch đặt của tôi (`/my-bookings`)**:
>    - Thêm nút **"Thanh toán"** chỉ dành riêng cho các đơn đặt sân đang ở trạng thái `PENDING`.
>    - Hộp thoại thanh toán (`PaymentDialog.tsx`) hiển thị tóm tắt đơn, xem trước số tiền cho 2 hình thức: `FULL` (100%) và `DEPOSIT` (50%), lựa chọn phương thức thanh toán, ghi chú và cảnh báo bắt buộc về hệ quả đặt cọc.
>    - Gọi trực tiếp `POST /api/v1/payments`, hiển thị biên nhận giao dịch (`PaymentResultCard.tsx`), tự động làm mới danh sách đơn (chuyển sang `CONFIRMED`, nút thanh toán tự động ẩn đi).
> 2. Xây dựng hoàn chỉnh màn hình **Thanh toán & Hoàn tiền (`/payments` — `PaymentsPage.tsx`)** dành cho vai trò `STAFF` và `ADMIN`:
>    - Công cụ (a): **Thu tiền tại quầy cho đơn PENDING** (`PaymentCollectCard.tsx`), phục vụ khách đặt online hoặc khách vãng lai (không có tài khoản) trả tiền trực tiếp.
>    - Công cụ (b): **Hoàn tiền giao dịch** (`PaymentRefundCard.tsx` + `ConfirmRefundDialog.tsx`), hủy giao dịch chuyển sang `REFUNDED` và tự động hủy đơn đặt sân liên quan (`CANCELLED`).
> 3. **Ràng buộc kiến trúc cốt lõi từ Backend (PaymentController):**
>    - Backend chỉ có **đúng 2 endpoint POST**: `POST /api/v1/payments` và `POST /api/v1/payments/{id}/refund`.
>    - **Tuyệt đối KHÔNG có endpoint GET** lấy danh sách hay chi tiết thanh toán. Do đó, Phase 5 tuân thủ đúng pattern nhập ID thủ công (tương tự màn hình Check-in Phase 3), không tự ý xây dựng bảng lịch sử giao dịch hay gọi endpoint không tồn tại.

---

## 1. Luồng Khách Hàng Thanh Toán (`/my-bookings`)

### 1.1. Điều Kiện Hiển Thị Nút "Thanh toán"
- Nút **"Thanh toán"** (`variant="default"`, tông Zinc đậm `bg-zinc-900`) chỉ hiển thị trên các dòng/thẻ có trạng thái `booking.status === 'PENDING'`.
- Các đơn đã ở trạng thái `CONFIRMED`, `CHECKED_IN`, `COMPLETED` hoặc `CANCELLED` tuyệt đối không hiển thị nút này.
- Khi người dùng bấm "Thanh toán", mở hộp thoại `PaymentDialog.tsx`.

### 1.2. Hộp Thoại Thanh Toán (`PaymentDialog.tsx`)
- **Tóm tắt đơn đặt sân:**
  - Mã đơn `#id`, tên sân, cụm sân, ngày đặt sân và khung giờ thi đấu.
  - Tổng tiền đơn `booking.totalAmount` (đã phản ánh chiết khấu voucher nếu có từ Phase 4).
- **Lựa chọn loại thanh toán (`PaymentType`):**
  - `FULL` (Thanh toán đủ 100%): Xem trước số tiền `booking.totalAmount`.
  - `DEPOSIT` (Đặt cọc 50%): Xem trước số tiền `Math.round(booking.totalAmount * 0.5)` (máy chủ làm tròn `HALF_UP` 2 chữ số thập phân).
  - *Ghi chú minh bạch:* Số tiền xem trước để người dùng nắm rõ, số tiền thanh toán chính thức do máy chủ tính toán trực tiếp từ CSDL (FE không gửi trường `amount`).
- **Cảnh báo nghiệp vụ bắt buộc:**
  > [!WARNING]
  > **Lưu ý quan trọng:** Khi thanh toán thành công (kể cả chọn **Đặt cọc 50%**), đơn đặt sân sẽ chuyển ngay sang trạng thái **CONFIRMED** (Đã xác nhận). Hiện tại hệ thống chưa hỗ trợ thanh toán nốt 50% còn lại qua API (thanh toán lần 2 sẽ bị từ chối với lỗi `409 BOOKING_ALREADY_PAID`). Khách hàng phải hiểu rõ điều này trước khi chọn Đặt cọc.
- **Phương thức thanh toán (`PaymentMethod`):**
  - Chuyển khoản (`BANK_TRANSFER`), Ví điện tử (`E_WALLET`), Tiền mặt (`CASH`).
- **Ghi chú thanh toán:** Ô nhập văn bản tùy chọn (tối đa 500 ký tự).
- **Chống thanh toán trùng lặp (Double-charge):**
  - Nút xác nhận tự động vô hiệu hóa (`disabled`) khi request đang được gửi đi.
- **Xử lý phản hồi từ Backend (`POST /api/v1/payments`):**
  - **`201 Created`:** Đóng dialog, hiển thị biên nhận giao dịch `PaymentResultCard.tsx` tại đầu trang `/my-bookings`, đồng thời gọi refetch danh sách đơn (đơn chuyển `CONFIRMED`, nút Thanh toán biến mất).
  - **`409 BOOKING_NOT_PAYABLE`:** Đơn không còn ở trạng thái `PENDING` (ví dụ đã bị hủy hoặc đã thanh toán ở tab khác) -> Tự động refetch lại danh sách.
  - **`409 BOOKING_ALREADY_PAID`:** Đơn đã có giao dịch `SUCCESS` trước đó -> Tự động refetch lại danh sách.
  - **`403 ACCESS_DENIED`:** Người dùng không phải chủ sở hữu đơn và không có quyền STAFF/ADMIN.
  - **`400 BAD_REQUEST`:** Cổng thanh toán từ chối (hiển thị nguyên văn message từ `MockPaymentGateway`).

---

## 2. Màn Hình Quản Lý Thanh Toán Cho Nhân Viên & Quản Trị Viên (`/payments`)

Được bảo vệ bằng `RoleRoute allowed={['STAFF', 'ADMIN']}`. Khách hàng (`CUSTOMER`) truy cập đường dẫn này sẽ bị chặn và chuyển hướng sang `/403 Forbidden`.

Màn hình gồm 2 công cụ độc lập đặt trong lưới 2 cột (`lg:grid-cols-2`):

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Quản lý Thanh toán & Hoàn tiền                                [STAFF/ADMIN]  [Avatar]    |
+--------------------------------------------------------------------------------------------------+
| MAIN CONTENT (p-6)                                                                               |
|                                                                                                  |
| +-----------------------------------------------+ +--------------------------------------------+ |
| | CÔNG CỤ (A): THU TIỀN ĐƠN PENDING             | | CÔNG CỤ (B): HOÀN TIỀN GIAO DỊCH           | |
| | (PaymentCollectCard)                          | | (PaymentRefundCard)                        | |
| |-----------------------------------------------| |--------------------------------------------| |
| | Mã đơn đặt sân (Booking ID) *: [ 12         ] | | Mã giao dịch thanh toán (Payment ID) *:    | |
| |                                               | | [ 105                                    ] | |
| | Loại thanh toán:                              | |                                            | |
| | [ Thanh toán đủ (100%) ] [ Đặt cọc (50%)    ] | | Lý do hoàn tiền:                           | |
| |                                               | | [ Khách bận đột xuất xin hủy trước giờ...  ] | |
| | Phương thức:                                  | |                                            | |
| | [ Tiền mặt ] [ Chuyển khoản ] [ Ví điện tử  ] | |                                            | |
| |                                               | |                                            | |
| | Ghi chú: [ Khách gửi tiền mặt tại quầy...   ] | |                                            | |
| |                                               | |                                            | |
| | [ Xác nhận thu tiền                         ] | | [ Yêu cầu hoàn tiền                     ]  | |
| +-----------------------------------------------+ +--------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### 2.1. Công Cụ (a): Thu Tiền Đơn Đặt Sân (`PaymentCollectCard.tsx`)
- **Mục đích:** Nhân viên quầy thu tiền mặt/chuyển khoản cho khách hàng.
- **Trường nhập liệu:**
  - `bookingId`: Nhập tay ID đơn đặt sân (do khách cung cấp). Do Backend chưa có API danh sách đơn đặt cho nhân viên, việc nhập tay tuân thủ đúng kiến trúc hiện tại của Backend.
  - `paymentType`: `FULL` (100%) hoặc `DEPOSIT` (50%).
  - `paymentMethod`: `CASH`, `BANK_TRANSFER`, `E_WALLET`.
  - `note`: Ghi chú tùy chọn (≤ 500 ký tự).
- **Quy tắc nghiệp vụ được giải thích rõ:**
  - Chỉ thu tiền được cho đơn đặt trực tuyến đang ở trạng thái `PENDING`.
  - Đơn POS tạo tại quầy đã ở trạng thái `CONFIRMED` sẵn từ lúc tạo (đã thu tiền ngay lúc đặt), nếu cố tình thu tiền sẽ trả về lỗi `409 BOOKING_NOT_PAYABLE` (đây là hành vi chuẩn xác của hệ thống, không phải lỗi).
  - Khách vãng lai (không có tài khoản trong hệ thống) chỉ có nhân viên quầy hoặc Admin mới có quyền thu tiền qua trang này.
- **Kết quả thành công (`201 Created`):**
  - Hiển thị `PaymentResultCard.tsx` với mã giao dịch, mã đơn, số tiền thu, phương thức, mã tham chiếu `transactionRef`, thời điểm `paidAt` và nút "Thu tiền đơn khác".

### 2.2. Công Cụ (b): Hoàn Tiền Giao Dịch (`PaymentRefundCard.tsx` + `ConfirmRefundDialog.tsx`)
- **Mục đích:** Xử lý hoàn tiền cho khách khi có yêu cầu hợp lệ trước giờ thi đấu.
- **Trường nhập liệu:**
  - `paymentId`: Mã giao dịch thanh toán (lấy từ biên nhận lúc thu tiền).
  - `reason`: Lý do hoàn tiền (tùy chọn, ≤ 500 ký tự).
- **Hộp thoại xác nhận 1 chiều (`ConfirmRefundDialog.tsx`):**
  - Nhắc nhở điều kiện: Giao dịch phải đang ở trạng thái `SUCCESS` và khách hàng **chưa nhận sân** (chưa `CHECKED_IN` hoặc `COMPLETED`).
  - Cảnh báo hệ quả một chiều: Hoàn tiền thành công sẽ chuyển trạng thái thanh toán sang **`REFUNDED`** đồng thời **tự động hủy đơn đặt sân tương ứng sang `CANCELLED`** để giải phóng slot giờ cho khách khác. Thao tác không thể đảo ngược.
- **Kết quả thành công (`200 OK`):**
  - Hiển thị `PaymentResultCard.tsx` với trạng thái `REFUNDED`, mã đơn, số tiền đã hoàn trả và thời điểm ghi nhận.
- **Xử lý lỗi:**
  - `404 PAYMENT_NOT_FOUND`: Mã giao dịch không tồn tại.
  - `409 REFUND_NOT_ALLOWED`: Giao dịch không ở trạng thái `SUCCESS` hoặc đơn đặt sân đã nhận sân/hoàn thành.

---

## 3. Danh Mục Sub-components Phân Tách (`FE/src/components/payment/`)

| STT | Tên Component | Vai trò & Trách nhiệm cụ thể |
|:---:|---|---|
| 1 | `PaymentResultCard.tsx` | Thẻ biên nhận chi tiết giao dịch (mã GD, mã đơn, số tiền, loại thanh toán, phương thức, mã tham chiếu cổng, thời điểm, badge trạng thái). Tái sử dụng ở cả luồng khách hàng và nhân viên. |
| 2 | `PaymentDialog.tsx` | Modal thanh toán cho khách hàng tại `/my-bookings` (tóm tắt đơn, chọn loại FULL/DEPOSIT có xem trước tiền, cảnh báo đặt cọc, chọn phương thức, ghi chú, chống double-charge và xử lý lỗi 409). |
| 3 | `PaymentCollectCard.tsx` | Khung công cụ thu tiền đơn PENDING dành cho nhân viên tại `/payments` (nhập bookingId, chọn loại/phương thức, ghi chú và hiển thị biên nhận sau thu). |
| 4 | `PaymentRefundCard.tsx` | Khung công cụ hoàn tiền giao dịch dành cho nhân viên tại `/payments` (nhập paymentId, lý do, kích hoạt modal xác nhận). |
| 5 | `ConfirmRefundDialog.tsx` | Modal xác nhận hoàn tiền cảnh báo giao dịch chuyển sang REFUNDED và đơn đặt sân tự động chuyển sang CANCELLED (thao tác 1 chiều). |
| 6 | `PaymentsPage.tsx` | Page Composer mỏng (< 40 dòng) tại `src/pages/payment/PaymentsPage.tsx`, điều phối `PaymentCollectCard` và `PaymentRefundCard` theo bố cục lưới 2 cột. |

---

## 4. Danh Mục Hàm API & Kiểu Dữ Liệu (`FE/src/lib/payment.ts`, `FE/src/types/payment.ts`)

- **Kiểu dữ liệu:**
  - `PaymentMethod`: `'CASH' | 'BANK_TRANSFER' | 'E_WALLET'`
  - `PaymentType`: `'FULL' | 'DEPOSIT'`
  - `PaymentStatus`: `'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'`
  - `CreatePaymentRequest`: `{ bookingId: number, paymentType: PaymentType, paymentMethod: PaymentMethod, note?: string }`
  - `RefundPaymentRequest`: `{ reason?: string }`
  - `PaymentResponse` / `Payment`: Khớp 100% với DTO Backend.
  - Từ điển nhãn tiếng Việt: `PAYMENT_METHOD_LABELS`, `PAYMENT_TYPE_LABELS`, `PAYMENT_STATUS_LABELS`.
- **Hàm API:**
  - `createPayment(request)`: `POST /api/v1/payments` (Auth)
  - `refundPayment(paymentId, request)`: `POST /api/v1/payments/{id}/refund` (STAFF/ADMIN)
  - `getPayments(params)`: `GET /api/v1/payments` (STAFF/ADMIN)
  - `getMyPayments(params)`: `GET /api/v1/payments/my` (Auth)
  - `getPaymentById(paymentId)`: `GET /api/v1/payments/{id}` (Auth — STAFF/ADMIN xem tất cả, CUSTOMER chỉ xem đơn của mình)
- **Tái sử dụng tiện ích:**
  - Tiền tệ: `formatVnd(amount)` từ `@/lib/voucher`.
  - Ngày giờ: `formatDateTimeVi(iso)` từ `@/lib/voucher`.
  - Xử lý lỗi: `extractErrorMessage(error)` từ `@/lib/auth`.

---

## 5. Bổ Sung: Lịch Sử Giao Dịch & Chi Tiết Hóa Đơn

### 5.1. API Backend Bổ Sung (`PaymentController`)
- `GET /api/v1/payments` (`STAFF`, `ADMIN`): Lịch sử giao dịch toàn hệ thống (phân trang, lọc theo `status`, `paymentMethod`, `bookingId`, `fromDate`, `toDate`, sắp xếp `createdAt`/`paidAt`/`amount`/`id`).
- `GET /api/v1/payments/my` (`Authenticated`): Lịch sử giao dịch của chính người dùng đang đăng nhập.
- `GET /api/v1/payments/{id}` (`Authenticated`): Chi tiết hóa đơn (`PaymentDetailResponse` gồm thông tin giao dịch + sân/cụm sân/khung giờ/khách hàng). `CUSTOMER` xem hóa đơn người khác hoặc đơn vãng lai bị chặn `403 ACCESS_DENIED`.

### 5.2. Thành Phần Giao Diện Bổ Sung (`FE/src/components/payment/`)
- `PaymentHistoryFilterBar.tsx`: Bộ lọc trạng thái, phương thức, mã đơn (cho STAFF/ADMIN), khoảng ngày (`fromDate`–`toDate`), sắp xếp và nút Đặt lại.
- `PaymentHistoryTable.tsx`: Bảng phân tách rõ `Mã GD (#id)` và `Mã đơn (#bookingId)`, nút **"Xem hóa đơn"** và nút **"Hoàn tiền"** (chỉ hiện với STAFF/ADMIN trên dòng `SUCCESS`) tự điền `paymentId` vào `PaymentRefundCard`.
- `PaymentInvoiceDialog.tsx`: Modal hiển thị chi tiết hóa đơn (gọi `GET /api/v1/payments/{id}`), hỗ trợ in (`window.print()`).
- `PaymentHistorySection.tsx`: Khối điều phối dùng chung cho cả `/payments` (`mode="staff"`) và tab **"Lịch sử giao dịch"** trong `/my-bookings` (`mode="customer"`).

