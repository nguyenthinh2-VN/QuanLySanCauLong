# CHI TIẾT MODULE 7: PROMOTIONS & VOUCHER MANAGEMENT (QUẢN LÝ KHUYẾN MÃI & VOUCHER)

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Chiến lược giảm giá đa thuật toán (Strategy Pattern), quản trị voucher linh hoạt, cơ chế khóa kép bi quan (Double-Resource Pessimistic Lock) và bảo vệ an toàn ngân sách khuyến mãi.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problems Solved)

1. **Khuyến mãi linh hoạt & Tăng trưởng doanh thu (Revenue Growth & Promotions):**
   - Nền tảng cần cơ chế kích cầu thông qua các chiến dịch ưu đãi đa dạng: giảm giá theo phần trăm (`PERCENTAGE`, có trần tối đa) hoặc giảm theo số tiền trực tiếp (`FIXED_AMOUNT`).
   - Hỗ trợ ràng buộc giá trị đơn tối thiểu (`minOrderAmount`), thời gian hiệu lực và phân quyền quản trị toàn diện cho `ROLE_ADMIN`.

2. **Áp mã mượt mà trước thanh toán (Pre-Payment Voucher Application):**
   - Khách hàng có thể khám phá voucher đang hoạt động qua endpoint công khai `GET /api/v1/vouchers/active`.
   - Áp voucher vào đơn đặt sân `PENDING` qua `POST /api/v1/vouchers/apply`. Hệ thống tính chiết khấu và tự động khấu trừ `booking.totalAmount` một cách nguyên tử. Nhờ đó, khi tiến hành thanh toán ở Module 6, số tiền `FULL` hoặc `DEPOSIT` được tính trên số tiền chính xác sau giảm mà không làm xáo trộn hợp đồng API thanh toán.

3. **Chống thất thoát ngân sách khuyến mãi & Chống Race Condition (Budget & Race Protection):**
   - Chiến dịch phát hành có giới hạn tổng lượt dùng (`usageLimit`) và giới hạn theo từng tài khoản (`userUsageLimit`).
   - Khóa bi quan kép (`Pessimistic Write Lock`) trên cả dòng Voucher và dòng Booking ngăn chặn triệt để tình trạng:
     - Vượt quá ngân sách khi nhiều người cùng tranh chấp voucher cuối cùng.
     - Áp đồng thời 2 voucher khác nhau vào 1 đơn đặt sân gây lỗi ghi đè đồng thời (last-writer-wins).
     - Xung đột giữa luồng áp voucher và luồng thanh toán (apply-vs-payment race).

4. **Lưu vết kiểm toán độc lập (Audit Trail via `VoucherUsage`):**
   - Bản ghi `VoucherUsage` lưu trữ quan hệ giữa voucher, khách hàng, đơn đặt sân, số tiền giảm và thời điểm sử dụng, phục vụ công tác đối soát kế toán và phân tích hiệu quả chiến dịch ở Module 8 Dashboard.

---

## 2. Bốn Quyết Định Thiết Kế Cốt Lõi (Key Architectural Decisions)

### 2.1. Áp dụng Strategy Pattern cho Thuật toán Tính Chiết Khấu (Discount Strategy)
- **Vấn đề:** Thay vì viết `switch-case` lồng nhau trong Service khiến code bị phình to và vi phạm nguyên tắc Open/Closed (OCP), hệ thống áp dụng Strategy Pattern.
- **Giải pháp:**
  - Định nghĩa interface `DiscountStrategy` với 2 method: `getDiscountType()` và `calculateDiscount(voucher, orderAmount)`.
  - Hai implementation độc lập: `PercentageDiscountStrategy` và `FixedAmountDiscountStrategy`.
  - `DiscountStrategyFactory` nạp danh sách strategy tự động qua Spring IoC Container. Khi cần thêm loại chiết khấu mới (như bậc thang `TIERED_DISCOUNT`), lập trình viên chỉ cần tạo class mới hiện thực interface mà không cần chỉnh sửa code lõi của `VoucherServiceImpl`.

### 2.2. Tách biệt Khâu Áp Voucher và Khâu Thanh Toán
- **Giải pháp:** Tách rõ: Khách gọi `POST /api/v1/vouchers/apply` để giảm `booking.totalAmount` trước, sau đó mới gọi `POST /api/v1/payments` (Module 6).
- **Lợi ích:** Đảm bảo Single Responsibility Principle, giữ payload thanh toán tinh gọn, không làm vỡ hợp đồng API `CreatePaymentRequest` đã nghiệm thu của Module 6.

### 2.3. Khóa Kép Bi Quan (Double-Resource Pessimistic Lock) & Quản Lý Cache Hibernate
- **Giải pháp:** Trong cùng 1 giao dịch `@Transactional`, hệ thống thực thi theo thứ tự:
  1. `voucherRepository.findByCode(...)`: Xác thực voucher tồn tại.
  2. `bookingRepository.findByIdForUpdate(bookingId)`: Khóa bi quan dòng Booking trước mọi guard.
  3. `voucherRepository.findByIdForUpdate(voucherId)`: Khóa bi quan dòng Voucher.
  4. `entityManager.refresh(lockedVoucher)`: Buộc Hibernate nạp lại trạng thái mới nhất từ dòng DB đã khóa, vượt qua cơ chế cache cấp 1 (1st-level cache) để nhận diện chính xác `usedCount` mà giao dịch khác vừa commit.
- **Lợi ích:** Triệt tiêu hoàn toàn race condition khi 2 luồng cùng tranh chấp 1 voucher giới hạn hoặc cùng áp voucher vào 1 đơn đặt sân.

### 2.4. Lưu Vết Độc Lập qua Entity `VoucherUsage`
- Bảng `voucher_usages` lưu snapshot giá trị đơn hàng trước giảm (`orderAmount`), số tiền thực tế được giảm (`discountAmount`), ID người dùng và ID đơn đặt sân.
- Cung cấp dữ liệu đối soát minh bạch, đồng thời hỗ trợ kiểm tra hạn mức cá nhân `countByVoucherIdAndUserId(...) < voucher.userUsageLimit`.

---

## 3. Bảng Đối Chiếu 5 Nguyên Tắc SOLID Trong Module 7

| Nguyên tắc | Mức độ áp dụng trong Module 7 | Minh chứng thực tế trong mã nguồn |
|---|:---:|---|
| **S - Single Responsibility** | 100% | Phân định rạch ròi: `VoucherAdminController` chỉ quản trị danh mục voucher; `VoucherController` phục vụ khách hàng; `PercentageDiscountStrategy` chỉ tính %; `VoucherServiceImpl` chỉ điều phối nghiệp vụ áp mã. |
| **O - Open/Closed** | 100% | `DiscountStrategy` cho phép mở rộng các quy tắc chiết khấu mới (Tiered, Combo, Flash sale) mà không phải sửa đổi dù chỉ 1 dòng mã trong `VoucherServiceImpl`. |
| **L - Liskov Substitution** | 100% | Mọi implementation của `DiscountStrategy` (`PercentageDiscountStrategy`, `FixedAmountDiscountStrategy`) đều có thể thay thế cho nhau hoàn hảo trong `DiscountStrategyFactory` mà không phá vỡ logic tính toán. |
| **I - Interface Segregation** | 100% | Tách biệt `VoucherAdminService` (quản trị, phân trang, CRUD) và `VoucherService` (áp mã, xem active) giúp các controller chỉ phụ thuộc vào đúng interface chúng cần. |
| **D - Dependency Inversion** | 100% | 100% dependencies được tiêm qua Constructor injection (`@RequiredArgsConstructor`). Service phụ thuộc vào abstractions `VoucherRepository`, `BookingRepository`, `DiscountStrategyFactory`, không phụ thuộc vào class cụ thể. |

