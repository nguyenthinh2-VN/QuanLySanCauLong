# Implementation Plan: Module 7 - Promotions & Voucher Management

## 1. Overview
Module 7 xây dựng phân hệ **Khuyến mãi & Quản lý Voucher (Promotions & Vouchers)** cho nền tảng quản lý sân cầu lông **QuanLySanCauLong**.
Phân hệ cung cấp các năng lực then chốt:
1. **Quản trị Voucher (`ADMIN`):** Tạo mới, cập nhật, kích hoạt/vô hiệu hóa, xóa và phân trang tìm kiếm danh sách voucher với các quy tắc chiết khấu linh hoạt (`PERCENTAGE` hoặc `FIXED_AMOUNT`), hạn mức sử dụng toàn hệ thống và hạn mức sử dụng theo từng người dùng.
2. **Khám phá Khuyến mãi (`CUSTOMER` & Khách vãng lai):** Xem danh sách các voucher đang hoạt động và còn thời hạn hiệu lực để chọn mã ưu đãi.
3. **Áp dụng Voucher vào Đơn đặt sân (`POST /api/v1/vouchers/apply`):** Khách hàng áp mã giảm giá vào đơn đặt sân đang ở trạng thái `PENDING` (trước khi thanh toán ở Module 6). Hệ thống kiểm tra 7 chốt chặn bảo vệ nghiêm ngặt (thời hạn, trạng thái, giá trị đơn tối thiểu, tổng lượt dùng, lượt dùng cá nhân, quyền sở hữu, chống áp lặp), tính toán số tiền giảm bằng **Strategy Pattern**, và cập nhật lại số tiền cần thanh toán của đơn đặt sân một cách nguyên tử trong cùng một `@Transactional`.
4. **Kiểm soát đồng thời (Concurrency Control):** Áp dụng cơ chế **Pessimistic Lock (`SELECT ... FOR UPDATE`)** trên bản ghi Voucher khi áp mã, chống triệt để tình trạng vượt quá hạn mức phát hành (`usageLimit`) khi có nhiều khách hàng cùng tranh chấp mã giảm giá tại cùng một thời điểm.

---

## 2. Architecture Decisions

### 2.1. Áp dụng Strategy Pattern cho Thuật toán Tính Chiết Khấu (Discount Strategy)
- **Vấn đề:** Hiện tại hệ thống hỗ trợ 2 hình thức giảm giá: theo phần trăm (`PERCENTAGE`, có trần `maxDiscountAmount`) và theo số tiền cố định (`FIXED_AMOUNT`, không vượt quá giá trị đơn). Nếu viết toàn bộ logic tính toán bằng `switch-case` hoặc `if-else` lồng nhau trong Service, code sẽ nhanh chóng phình to và vi phạm nguyên tắc **Open/Closed Principle (OCP)** khi sau này cần mở rộng các loại khuyến mãi nâng cao (ví dụ: `TIERED_DISCOUNT` giảm theo bậc thang giá trị, `COMBO_DISCOUNT` giảm khi đặt cụm nhiều giờ).
- **Giải pháp:** Định nghĩa interface `DiscountStrategy` với phương thức `BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount)`. Tạo 2 implementation độc lập: `PercentageDiscountStrategy` và `FixedAmountDiscountStrategy`. `DiscountStrategyFactory` hoặc Service sẽ tự động nạp danh sách Strategy qua Spring IoC Container và điều phối tương ứng với `voucher.getDiscountType()`. Khi bổ sung loại giảm giá mới, lập trình viên chỉ cần tạo class mới implement interface mà không phải sửa một dòng code nào trong `VoucherServiceImpl`.

### 2.2. Thời điểm Áp Dụng Voucher và Liên Kết với Module 6 (Payments)
- **Vấn đề:** Trong chu trình đặt sân, khách hàng tạo đơn đặt sân ở Module 4 (status `PENDING`, `totalAmount = pricePerHour * hours`), sau đó thanh toán ở Module 6 (`POST /api/v1/payments`). Nếu gom việc áp mã voucher vào lúc thanh toán, payload của thanh toán sẽ bị phình to, vi phạm Single Responsibility Principle và làm vỡ hợp đồng API `CreatePaymentRequest` của Module 6 đã nghiệm thu.
- **Giải pháp:** Tách biệt rõ ràng:
  - Khách hàng gọi `POST /api/v1/vouchers/apply` nhận `{ bookingId, code }` trước khi thanh toán.
  - Khi áp mã thành công, hệ thống tính `discountAmount`, ghi nhận bản ghi kiểm toán `VoucherUsage`, đồng thời cập nhật `booking.totalAmount = booking.totalAmount - discountAmount`.
  - Nhờ đó, khi khách hàng tiến hành gọi `POST /api/v1/payments` (Module 6), số tiền thanh toán `FULL` hoặc `DEPOSIT` sẽ tự động tính toán server-side chính xác trên số tiền sau giảm mà không cần sửa đổi bất kỳ logic thanh toán nào của Module 6.

### 2.3. Khóa Bi Quan (Pessimistic Lock) Chống Vượt Hạn Mức Voucher (Budget Protection)
- **Vấn đề:** Một chiến dịch khuyến mãi phát hành 100 voucher giảm giá số lượng có hạn (`usageLimit = 100`). Khi số lượng còn lại là 1 (`usedCount = 99`), nếu 10 khách hàng cùng bấm áp mã tại cùng một thời điểm microsecond, nếu chỉ đọc dữ liệu thông thường, cả 10 giao dịch đều thấy `usedCount = 99 < 100` và cùng áp mã thành công, dẫn đến `usedCount = 109` (thất thoát ngân sách khuyến mãi của chủ sân).
- **Giải pháp:** Áp dụng khóa bi quan `findByIdForUpdate(Long id)` trên `VoucherRepository` trong phương thức `applyVoucher`. Transaction đầu tiên sẽ khóa dòng voucher đó trong DB, tăng `usedCount` lên 100; các transaction sau khi lấy được lock sẽ thấy `usedCount >= usageLimit` và lập tức nhận lỗi `400 VOUCHER_USAGE_EXCEEDED`, đảm bảo an toàn tài chính tuyệt đối.

### 2.4. Lưu vết Sử Dụng Độc Lập qua Entity `VoucherUsage`
- **Vấn đề:** Để kiểm soát quy định "mỗi tài khoản chỉ được sử dụng mã khuyến mãi này tối đa N lần" (`userUsageLimit`), hệ thống không thể chỉ dựa vào một con số tổng `usedCount` trong bảng `vouchers`.
- **Giải pháp:** Tạo bảng `voucher_usages` lưu trữ cặp quan hệ `(voucher_id, user_id, booking_id, discount_amount, used_at)`. Câu lệnh kiểm tra `countByVoucherIdAndUserId(voucherId, userId) < voucher.userUsageLimit` giúp xác thực chính xác lịch sử của từng khách hàng, đồng thời cung cấp dữ liệu báo cáo đối soát doanh thu khuyến mãi ở Module 8 sau này.

---

## 3. Task List

### Phase 1: Foundation (Domain Models, Enums, Error Codes & Strategy)
- [ ] **Task 1: Error Codes, Domain Entities, Enums & Strategy Pattern**
  - Thêm 9 mã lỗi voucher vào `ErrorCode.java`: `VOUCHER_NOT_FOUND` (404), `VOUCHER_CODE_EXISTS` (409), `VOUCHER_NOT_ACTIVE` (400), `VOUCHER_EXPIRED` (400), `VOUCHER_NOT_STARTED` (400), `VOUCHER_USAGE_EXCEEDED` (400), `VOUCHER_USER_LIMIT_EXCEEDED` (400), `VOUCHER_MIN_AMOUNT_NOT_MET` (400), `VOUCHER_ALREADY_APPLIED` (409).
  - Tạo enum `DiscountType` (`PERCENTAGE`, `FIXED_AMOUNT`).
  - Tạo entity `Voucher` (kế thừa `BaseEntity`, bảng `vouchers`, indexes trên `code`, `active`, `startDate`, `endDate`).
  - Tạo entity `VoucherUsage` (kế thừa `BaseEntity`, bảng `voucher_usages`, indexes trên `(voucher_id, user_id)` và `booking_id`).
  - Xây dựng Discount Strategy Pattern: interface `DiscountStrategy`, class `PercentageDiscountStrategy`, class `FixedAmountDiscountStrategy`, class `DiscountStrategyFactory`.
  - Tạo `VoucherRepository` (với `findByIdForUpdate`, `findByCode`, `existsByCode`) và `VoucherUsageRepository`.
  - **Verification:** `.\mvnw.cmd compile` thành công.

### Checkpoint 1: Domain, Enums, Strategy & Repositories Ready
- [ ] Build succeeds: `.\mvnw.cmd compile`
- [ ] Các entity JPA, enums, strategies và repositories biên dịch sạch sẽ.

### Phase 2: Core Features (Admin CRUD & Customer Application)
- [ ] **Task 2: Admin Voucher Management (CRUD, Status Toggle & Pagination)**
  - Tạo DTOs quản trị: `CreateVoucherRequest`, `UpdateVoucherRequest`, `VoucherResponse`.
  - Tạo `VoucherMapper` (MapStruct).
  - Tạo `VoucherAdminService` & `VoucherAdminServiceImpl` (@Transactional):
    - `createVoucher`: Validate code trùng (409), validate `endDate > startDate` (400), lưu voucher mới.
    - `getVouchers`: Phân trang, tìm kiếm theo code/name, lọc theo active.
    - `getVoucherById`: Lấy chi tiết voucher theo ID (404).
    - `updateVoucher`: Cập nhật thông tin voucher (404).
    - `toggleVoucherStatus`: Bật/tắt trạng thái hoạt động của voucher.
    - `deleteVoucher`: Xóa voucher nếu chưa có lượt sử dụng (`usedCount == 0`), nếu đã dùng thì de-activate.
  - Tạo `VoucherAdminController` tại `/api/v1/vouchers`:
    - `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")` trên các endpoint quản trị.
  - **Verification:** `.\mvnw.cmd compile` thành công.

- [ ] **Task 3: Customer Voucher Application & Public Active Vouchers**
  - Tạo DTOs khách hàng: `ApplyVoucherRequest`, `ApplyVoucherResponse`.
  - Tạo `VoucherService` & `VoucherServiceImpl` (@Transactional):
    - `getActiveVouchers`: Lấy danh sách voucher đang active và còn hạn (`startDate <= now <= endDate`).
    - `applyVoucher(ApplyVoucherRequest)`:
      - Khóa bi quan `voucherRepository.findByIdForUpdate(voucher.getId())`.
      - 7 Guards: Booking tồn tại (404), Booking status == PENDING (409), Owner/Staff authorization (403), Booking chưa áp voucher (409), Voucher active & in-date (400), Booking totalAmount >= minOrderAmount (400), Chưa vượt usageLimit và userUsageLimit (400).
      - Tính tiền giảm qua `DiscountStrategyFactory`.
      - Cập nhật `booking.totalAmount = max(0, totalAmount - discountAmount)`.
      - Tạo bản ghi `VoucherUsage` và tăng `voucher.usedCount`.
  - Tạo `VoucherController`:
    - `GET /api/v1/vouchers/active`: `permitAll` $\rightarrow$ Trả về 200 OK.
    - `POST /api/v1/vouchers/apply`: `@PreAuthorize("isAuthenticated()")` $\rightarrow$ Trả về 200 OK kèm chi tiết số tiền giảm và số tiền còn lại.
  - **Verification:** `.\mvnw.cmd compile` thành công.

### Checkpoint 2: All Module 7 Endpoints Implemented
- [ ] Build succeeds: `.\mvnw.cmd compile`
- [ ] Cả 8 endpoints (6 Admin + 2 Customer/Public) biên dịch trơn tru, logic guards và phân quyền SpEL sẵn sàng.

### Phase 3: Comprehensive Testing (Unit Mockito & DataJpaTest & Concurrency)
- [ ] **Task 4: Comprehensive Testing (Unit Mockito & DataJpaTest)**
  - Tạo `VoucherAdminServiceTest` (Mockito):
    - Admin tạo voucher PERCENTAGE và FIXED_AMOUNT thành công (201).
    - Tạo voucher trùng code $\rightarrow$ 409 VOUCHER_CODE_EXISTS.
    - Tạo voucher startDate >= endDate $\rightarrow$ 400.
    - Cập nhật, toggle status, xóa voucher thành công.
  - Tạo `VoucherServiceTest` (Mockito):
    - Áp voucher PERCENTAGE thành công (tính đúng %, trần maxDiscountAmount).
    - Áp voucher FIXED_AMOUNT thành công (trừ đúng số tiền cố định).
    - Khách áp voucher cho booking người khác $\rightarrow$ 403 ACCESS_DENIED.
    - Áp voucher khi booking đã CONFIRMED/CANCELLED $\rightarrow$ 409 BOOKING_NOT_PAYABLE.
    - Áp voucher không tồn tại / inactive / hết hạn $\rightarrow$ 400/404.
    - Áp voucher khi đơn chưa đạt minOrderAmount $\rightarrow$ 400.
    - Áp voucher khi đã hết lượt dùng toàn hệ thống (usageLimit) $\rightarrow$ 400 VOUCHER_USAGE_EXCEEDED.
    - Áp voucher khi user đã dùng quá giới hạn (userUsageLimit) $\rightarrow$ 400 VOUCHER_USER_LIMIT_EXCEEDED.
    - Áp voucher lần 2 cho cùng 1 booking $\rightarrow$ 409 VOUCHER_ALREADY_APPLIED.
  - Tạo `VoucherRepositoryDataJpaTest` (@DataJpaTest trên H2):
    - Xác thực các truy vấn `findByCode`, `findActiveVouchers`, đếm `countByVoucherIdAndUserId`, và khóa bi quan `findByIdForUpdate`.
  - **Verification:** `.\mvnw.cmd clean test` pass 100% không hồi quy.

### Checkpoint 3: Tests Pass 100%
- [ ] Tests pass: `.\mvnw.cmd clean test`
- [ ] Toàn bộ test suites của Module 1 đến Module 7 pass xanh hoàn toàn.

### Phase 4: Polish & Documentation
- [ ] **Task 5: Documentation Synchronization & Review**
  - Tạo `docs/api/module-7-vouchers.md`: Chi tiết toàn bộ endpoints của Module 7, payload mẫu và danh mục mã lỗi.
  - Tạo `docs/architecture/modules/module-7-vouchers.md`: Mô tả kiến trúc Module 7, bảng đối chiếu 5 nguyên tắc SOLID, phân tích Strategy Pattern và Pessimistic Lock.
  - Cập nhật `docs/architecture/README.md` và đồng bộ `docs/architecture/rbac-matrix.md`.
  - Thực hiện code review qua `/open-code-review-delegate`.
  - **Verification:** Kiểm tra markdown links, chạy `.\mvnw.cmd clean compile`.

### Checkpoint 4: Module 7 Complete, Verified & Documented
- [ ] Toàn bộ tiêu chí nghiệm thu hoàn thành.
- [ ] 100% test pass, build clean, tài liệu đồng bộ.

---

## 4. Risks and Mitigations
| Nguy cơ | Mức độ | Biện pháp xử lý |
|---|---|---|
| Khách tranh chấp voucher số lượng giới hạn tại cùng thời điểm dẫn đến vượt ngân sách | Cao | Dùng `findByIdForUpdate(id)` khóa bi quan dòng voucher trong DB, tuần tự hóa giao dịch áp mã. |
| Người dùng lạm dụng tạo tài khoản phụ hoặc spam áp mã | Trung bình | Ràng buộc `userUsageLimit` qua bảng kiểm toán `voucher_usages`. Với khách vãng lai ở quầy POS, chỉ nhân viên có quyền mới được hỗ trợ áp mã. |
| Số tiền giảm lớn hơn tổng giá trị đơn dẫn đến số tiền âm | Cao | Hàm tính toán luôn chặn `discountAmount = min(calculatedDiscount, orderAmount)` và `finalAmount = max(0, orderAmount - discountAmount)`. |
| Áp đè voucher nhiều lần vào cùng một đơn đặt sân | Cao | Kiểm tra `voucherUsageRepository.existsByBookingId(bookingId)` trước khi xử lý, chặn đứng tình trạng giảm giá lặp. |

---

## 5. Open Questions
*Không có. Tất cả các yêu cầu và ranh giới kiến trúc đã được thiết kế tương thích hoàn hảo với Module 4, 5, 6 và quy chuẩn SOLID của dự án.*
