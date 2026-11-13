# Tasks Checklist: FE Phase 5 — Thanh Toán & Hoàn Tiền (Module 6)

## Task 1: Sửa nit Phase 4 (Accent indigo -> zinc)
- [x] Đổi badge và hộp mức giảm trong `ActiveVoucherCard.tsx` sang tông `zinc`.
- [x] Đổi pill mức giảm trong `AdminVoucherTable.tsx` sang tông `zinc`.
- [x] Đổi badge "Áp mã thành công" trong `ApplyVoucherResultCard.tsx` sang tông `zinc`.
- [x] Đổi badge "Ưu đãi thành viên" trong `CustomerVouchersView.tsx` sang tông `zinc`.

---

## Task 2: Khởi tạo Types & API helpers (`src/types/payment.ts`, `src/lib/payment.ts`)
- [x] `FE/src/types/payment.ts`:
  - `PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'E_WALLET'`
  - `PaymentType = 'FULL' | 'DEPOSIT'`
  - `PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'`
  - `CreatePaymentRequest`, `RefundPaymentRequest`
  - `PaymentResponse`, `Payment`
  - Labels map: `PAYMENT_METHOD_LABELS`, `PAYMENT_TYPE_LABELS`, `PAYMENT_STATUS_LABELS`
- [x] `FE/src/lib/payment.ts`:
  - `createPayment(request: CreatePaymentRequest): Promise<PaymentResponse>` (`POST /api/v1/payments`)
  - `refundPayment(id: number, request?: RefundPaymentRequest): Promise<PaymentResponse>` (`POST /api/v1/payments/{id}/refund`)

---

## Task 3: Xây dựng các sub-components trong `src/components/payment/`
- [x] `PaymentResultCard.tsx`: Thẻ kết quả chi tiết giao dịch (mã GD, mã đơn, số tiền, loại, phương thức, ref, paidAt, status badge, ghi chú).
- [x] `PaymentDialog.tsx`: Dialog thanh toán cho CUSTOMER tại `/my-bookings` (tóm tắt đơn, chọn FULL/DEPOSIT có preview tiền, cảnh báo bắt buộc về DEPOSIT->CONFIRMED, chọn phương thức, ghi chú, bắt lỗi 409/404/403/400).
- [x] `PaymentCollectCard.tsx`: Form thu tiền đơn PENDING cho STAFF/ADMIN (nhập bookingId, chọn loại, phương thức, note, giải thích đơn online PENDING vs đơn POS).
- [x] `PaymentRefundCard.tsx`: Form hoàn tiền giao dịch cho STAFF/ADMIN (nhập paymentId, reason, nút mở dialog xác nhận).
- [x] `ConfirmRefundDialog.tsx`: Dialog xác nhận hoàn tiền (cảnh báo một chiều: payment REFUNDED + booking CANCELLED).

---

## Task 4: Tích hợp nút "Thanh toán" & dialog vào `/my-bookings`
- [x] `FE/src/components/booking/MyBookingsTable.tsx`: Thêm nút "Thanh toán" khi `status === 'PENDING'` ở cả desktop table và mobile cards.
- [x] `FE/src/pages/booking/MyBookingsPage.tsx`: Quản lý state mở `PaymentDialog`, refetch khi thanh toán xong hoặc khi gặp 409, hiển thị `PaymentResultCard` khi thanh toán thành công.

---

## Task 5: Tạo `PaymentsPage.tsx` và gắn vào router
- [x] `FE/src/pages/payment/PaymentsPage.tsx`: Page composer mỏng (< 80 dòng) chứa `PaymentCollectCard` và `PaymentRefundCard`.
- [x] `FE/src/router/index.tsx`: Thay `FeaturePlaceholder` của `/payments` bằng `<PaymentsPage />`.

---

## Task 6: Cập nhật tài liệu
- [x] Tạo `docs/frontend/phase-5-payments.md` mô tả 2 luồng, ràng buộc BE chỉ có 2 POST, hệ quả DEPOSIT và REFUND.
- [x] Cập nhật `docs/frontend/README.md` (cấu trúc thư mục §2, trạng thái route §3.2, liên kết §4).

---

## Task 7: Build verification
- [x] Chạy `npm run build` (`tsc -b && vite build`) PASS 100%.

---

## Task 8: Cập nhật code-review-graph
- [x] Cập nhật kho code-review-graph qua MCP tool.
