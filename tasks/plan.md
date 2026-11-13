# Implementation Plan: FE Phase 5 — Thanh Toán & Hoàn Tiền (Module 6)

## 1. Overview
Xây dựng **FE Phase 5** cho hệ thống Quản lý Sân Cầu Lông `QuanLySanCauLong`, hoàn thiện phân hệ Thanh Toán & Hoàn Tiền (Module 6):
1. **CUSTOMER thanh toán từ `/my-bookings`:**
   - Đơn ở trạng thái `PENDING` có nút "Thanh toán".
   - Mở dialog thanh toán (`PaymentDialog`):
     - Tóm tắt đơn: mã đơn, sân, ngày + giờ, `totalAmount`.
     - Chọn `paymentType`: `FULL` (100%) vs `DEPOSIT` (50% xem trước).
     - Cảnh báo bắt buộc: Đơn chuyển ngay sang `CONFIRMED` kể cả khi chọn DEPOSIT 50%, và chưa có luồng thu nốt 50% qua API.
     - Chọn `paymentMethod`: `CASH`, `BANK_TRANSFER`, `E_WALLET`.
     - Ghi chú tùy chọn (≤ 500 ký tự).
     - Chống double-submit (disable nút khi đang gửi request).
     - Gọi `POST /api/v1/payments` -> 201 -> hiển thị `PaymentResultCard`, đóng dialog và refetch danh sách đơn (nút Thanh toán biến mất vì đơn đã `CONFIRMED`).
     - Bắt lỗi: 409 `BOOKING_NOT_PAYABLE`, 409 `BOOKING_ALREADY_PAID`, 403, 404, 400; khi gặp 409 tự động refetch đơn.
2. **STAFF/ADMIN quản lý tại màn hình `/payments`:**
   - Thay thế `FeaturePlaceholder` bằng `PaymentsPage.tsx` (dưới `RoleRoute` `STAFF` + `ADMIN`).
   - Gồm 2 công cụ độc lập:
     - **(a) Thu tiền đơn PENDING (`PaymentCollectCard`):** Nhập tay `bookingId` + chọn loại + phương thức + ghi chú -> `POST /api/v1/payments` -> `PaymentResultCard`.
     - **(b) Hoàn tiền giao dịch (`PaymentRefundCard` + `ConfirmRefundDialog`):** Nhập `paymentId` + lý do -> dialog cảnh báo một chiều (giao dịch `REFUNDED` đồng thời đơn `CANCELLED`) -> `POST /api/v1/payments/{id}/refund` -> `PaymentResultCard`.
   - **Ràng buộc:** BE không có endpoint GET payments -> không dựng bảng lịch sử, chỉ dùng pattern nhập ID và trả thẻ kết quả.

---

## 2. Architecture & Design Decisions

### Quyết định 1: Phân tách Component theo Domain (`FE/src/components/payment/`)
```text
FE/src/
├── types/
│   └── payment.ts                      # Types: Payment, CreatePaymentRequest, RefundPaymentRequest, PaymentMethod, PaymentType, PaymentStatus
├── lib/
│   └── payment.ts                      # API helpers: createPayment, refundPayment
├── components/payment/
│   ├── PaymentResultCard.tsx           # Thẻ kết quả giao dịch (mã GD, mã đơn, số tiền, loại, phương thức, mã tham chiếu, paidAt, status)
│   ├── PaymentDialog.tsx               # Modal thanh toán cho CUSTOMER tại /my-bookings
│   ├── PaymentCollectCard.tsx          # Card công cụ thu tiền cho STAFF/ADMIN
│   ├── PaymentRefundCard.tsx           # Card công cụ hoàn tiền cho STAFF/ADMIN
│   └── ConfirmRefundDialog.tsx         # Modal xác nhận hoàn tiền cảnh báo giao dịch REFUNDED và đơn CANCELLED
└── pages/payment/
    └── PaymentsPage.tsx                # Page Composer mỏng (< 80 dòng) cho /payments
```

### Quyết định 2: Tái sử dụng helpers
- Sử dụng `formatVnd` và `formatDateTimeVi` từ `src/lib/voucher.ts`.
- Sử dụng `extractErrorMessage` từ `src/lib/auth.ts`.
- Bảng màu: Tuân thủ tông `zinc`, không dùng gradient, không icon ngoài auth pages.

---

## 3. Task List

- [x] **Task 1: Sửa nit Phase 4 (đã xong: chuyển toàn bộ accent indigo sang zinc)**
- [x] **Task 2: Khởi tạo Types & API helpers (`src/types/payment.ts`, `src/lib/payment.ts`)**
- [x] **Task 3: Tạo các sub-components trong `src/components/payment/`**
- [x] **Task 4: Tích hợp nút "Thanh toán" & dialog vào `MyBookingsTable` và `MyBookingsPage`**
- [x] **Task 5: Tạo `PaymentsPage.tsx` và gắn vào route `/payments`**
- [x] **Task 6: Cập nhật docs (`phase-5-payments.md` & `README.md`)**
- [x] **Task 7: Build verification (`npm run build`)**
- [x] **Task 8: Cập nhật kho code-review-graph**
