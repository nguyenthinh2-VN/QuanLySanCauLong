# ĐẶC TẢ CHI TIẾT FE PHASE 4: QUẢN LÝ VOUCHER & ÁP MÃ GIẢM GIÁ (MODULE 7)

> **Mục tiêu Phase 4:**
> 1. Xây dựng hoàn chỉnh màn hình **Khuyến mãi / Ưu đãi (`/vouchers` — `VouchersPage.tsx`)** đa vai trò theo kiến trúc Role-based View:
>    - Dành cho `ADMIN`: Bảng quản lý toàn diện danh mục voucher (tìm kiếm, lọc trạng thái, phân trang, sắp xếp, tạo mới, chỉnh sửa, bật/tắt kích hoạt, xóa có kiểm soát).
>    - Dành cho `CUSTOMER`: Danh sách voucher đang phát hành công khai, sao chép mã nhanh, form áp mã giảm giá vào đơn đặt sân kèm bộ chọn nhanh đơn `PENDING` và hộp thoại xác nhận 1 chiều.
> 2. Đảm bảo tuân thủ 100% phân quyền RBAC Matrix: `STAFF` bị chặn truy cập (`403 Forbidden`), `CUSTOMER` không bao giờ gọi endpoint quản trị của `ADMIN`.
> 3. Tuân thủ tuyệt đối quy tắc phân tách component: Trang `VouchersPage.tsx` là thin container (< 60 dòng), toàn bộ logic tách thành 10 sub-components trong `FE/src/components/voucher/`.

---

## 1. Phân Quyền & Bố Cục Trang `/vouchers` (Role-Based Views)

Đường dẫn `/vouchers` được bảo vệ bằng `RoleRoute allowed={['ADMIN', 'CUSTOMER']}` trong Router:
- **Tài khoản `ADMIN`:** Render giao diện quản trị `AdminVouchersView.tsx`.
- **Tài khoản `CUSTOMER`:** Render giao diện khách hàng `CustomerVouchersView.tsx`.
- **Tài khoản `STAFF`:** Hệ thống tự động chuyển hướng sang trang `/403 Forbidden` (do nhân viên lễ tân không quản lý khuyến mãi và không áp mã voucher thay khách).
- **Chưa đăng nhập:** Bị `ProtectedRoute` chặn và chuyển hướng sang `/login`.

```text
                               +-----------------------------+
                               |     Route: /vouchers        |
                               | (RoleRoute: ADMIN, CUSTOMER)|
                               +--------------+--------------+
                                              |
                      +-----------------------+-----------------------+
                      |                                               |
              Role == 'ADMIN'                                 Role == 'CUSTOMER'
                      |                                               |
                      v                                               v
       +-------------------------------+               +-------------------------------+
       |     AdminVouchersView         |               |     CustomerVouchersView      |
       +-------------------------------+               +-------------------------------+
       | - AdminVoucherFilterBar       |               | - Danh sách ActiveVoucherCard |
       | - AdminVoucherTable           |               | - ApplyVoucherForm            |
       | - VoucherFormDialog           |               |   + Chọn nhanh đơn PENDING    |
       |   (Tạo mới & Sửa voucher)     |               |   + ConfirmApplyVoucherDialog |
       | - DeleteVoucherDialog         |               | - ApplyVoucherResultCard      |
       +-------------------------------+               +-------------------------------+
```

---

## 2. Giao Diện Quản Trị Cho `ADMIN` (`AdminVouchersView.tsx`)

### 2.1. Danh Sách & Bộ Lọc Voucher
- **Endpoint Backend:** `GET /api/v1/vouchers` (Yêu cầu quyền `hasRole('ADMIN')`).
- **Tham số tìm kiếm & phân trang:**
  - `keyword`: Tìm kiếm theo mã code hoặc tên voucher.
  - `active`: Lọc theo trạng thái hoạt động (`Tất cả`, `Đang bật` - `true`, `Đã tắt` - `false`).
  - `page` & `size`: Mặc định trang đầu tiên (`0`), kích thước trang `10`.
  - `sort`: Whitelist trường sắp xếp hợp lệ của BE:
    - `createdAt,desc` (Mới nhất - Mặc định)
    - `startDate,desc` (Ngày bắt đầu mới nhất)
    - `usedCount,desc` (Lượt dùng nhiều nhất)
    - `discountValue,desc` (Mức giảm cao nhất)
    - `code,asc` (Mã voucher A-Z)
- **Cột hiển thị trên bảng (`AdminVoucherTable.tsx`):**
  1. **Mã Voucher:** Kiểu chữ monospace đậm (`font-mono font-semibold`).
  2. **Tên & Mô tả:** Tên voucher kèm mô tả chi tiết phía dưới.
  3. **Loại & Mức giảm:**
     - `PERCENTAGE`: Giảm theo `%` (ví dụ: `15%`), nếu có `maxDiscountAmount` thì hiển thị kèm `(Tối đa: xxx.xxx ₫)`.
     - `FIXED_AMOUNT`: Giảm tiền mặt cố định (ví dụ: `50.000 ₫`).
  4. **Đơn tối thiểu:** Ngưỡng giá trị đơn hàng áp dụng (ví dụ: `200.000 ₫` hoặc `Không yêu cầu`).
  5. **Lượt dùng:** Tỷ lệ `usedCount / usageLimit` (ví dụ `12 / 100` hoặc `45 / ∞` nếu không giới hạn). Cảnh báo badge khi hết lượt.
  6. **Thời gian hiệu lực:** Khoảng ngày bắt đầu và ngày kết thúc (`dd/MM/yyyy HH:mm – dd/MM/yyyy HH:mm`).
  7. **Trạng thái:** Badge tonal Zinc `Hoạt động` hoặc Secondary `Tạm dừng`.
  8. **Thao tác:** Nút Sửa, Nút Bật/Tắt kích hoạt nhanh, Nút Xóa.

### 2.2. Tạo Mới Voucher (`VoucherFormDialog.tsx`)
- **Endpoint Backend:** `POST /api/v1/vouchers` (Quyền `ADMIN`).
- **Quy tắc kiểm tra dữ liệu tại Client (Validation Rules):**
  - `code`: Bắt buộc, đúng định dạng Regex `^[A-Za-z0-9_-]{3,50}$` (3 đến 50 ký tự, chỉ gồm chữ cái, số, gạch dưới, gạch ngang). Tự động chuẩn hóa viết hoa khi người dùng nhập.
  - `name`: Bắt buộc, tối đa 100 ký tự.
  - `description`: Tùy chọn, tối đa 500 ký tự.
  - `discountType`: Chọn giữa `PERCENTAGE` (%) và `FIXED_AMOUNT` (₫).
  - `discountValue`: Bắt buộc, > 0. Nếu loại là `%` thì từ 1 đến 100.
  - `maxDiscountAmount`: Tùy chọn, chỉ áp dụng và hiển thị khi chọn loại `PERCENTAGE`.
  - `minOrderAmount`: Tùy chọn, giá trị ≥ 0.
  - `usageLimit`: Tùy chọn tổng số lượt dùng toàn hệ thống (để trống = không giới hạn).
  - `userUsageLimit`: Bắt buộc, số lượt mỗi người dùng được áp dụng (mặc định là `1`).
  - `startDate` & `endDate`: Bắt buộc, định dạng datetime-local. Kiểm tra chặt chẽ `startDate < endDate`.
  - `active`: Checkbox mặc định được bật (`true`).

### 2.3. Chỉnh Sửa Voucher (`VoucherFormDialog.tsx`)
- **Endpoint Backend:** `PUT /api/v1/vouchers/{id}` (Quyền `ADMIN`).
- **Ràng buộc bất biến từ Backend:**
  - DTO `UpdateVoucherRequest` của Backend **không chứa** các trường: `code`, `discountType`, `discountValue`, `startDate`.
  - Do đó, trong form chỉnh sửa, các trường này được hiển thị ở chế độ **Disabled / Read-only** (đi kèm ghi chú giải thích không thể chỉnh sửa để bảo vệ tính nhất quán của dữ liệu kế toán và lịch sử áp mã).
  - Quản trị viên được phép cập nhật: `name`, `description`, `maxDiscountAmount`, `minOrderAmount`, `usageLimit`, `userUsageLimit`, `endDate`, `active`.

### 2.4. Bật / Tắt Kích Hoạt Nhanh
- **Endpoint Backend:** `PATCH /api/v1/vouchers/{id}/status`
- Bật/tắt trạng thái `active` ngay lập tức trên từng dòng bảng với hiệu ứng loading độc lập.

### 2.5. Xóa Voucher Có Kiểm Soát (`DeleteVoucherDialog.tsx`)
- **Endpoint Backend:** `DELETE /api/v1/vouchers/{id}`
- **Cơ chế hoạt động của Backend được thông báo minh bạch trong Dialog:**
  - Nếu voucher **chưa từng được sử dụng** (`usedCount == 0`): Hệ thống thực hiện xóa vĩnh viễn (Hard delete) bản ghi khỏi CSDL.
  - Nếu voucher **đã từng được áp dụng vào đơn đặt sân** (`usedCount > 0`): Hệ thống tự động chuyển trạng thái sang ngưng kích hoạt (`active = false` - Soft deactivate) nhằm bảo toàn toàn vẹn lịch sử thanh toán và đơn đặt sân.

---

## 3. Giao Diện Khách Hàng Cho `CUSTOMER` (`CustomerVouchersView.tsx`)

### 3.1. Danh Sách Voucher Khả Dụng (`ActiveVoucherCard.tsx`)
- **Endpoint Backend:** `GET /api/v1/vouchers/active` (Public endpoint, bất kỳ ai cũng có thể tra cứu).
- Hiển thị danh sách dạng thẻ trực quan (Card grid):
  - Mã voucher định dạng font monospace rõ ràng.
  - Mức giảm giá nổi bật (ví dụ: `Giảm 20%` hoặc `Giảm 30.000 ₫`).
  - Điều kiện áp dụng: Đơn tối thiểu, Mức giảm tối đa, Ngày hết hạn.
  - Nút **"Sao chép mã"**: Tự động sao chép mã vào Clipboard kèm thông báo phản hồi.
  - Nút **"Áp dụng ngay"**: Tự động điền mã voucher vào form áp mã bên cạnh và cuộn mượt đến khung thao tác.

### 3.2. Form Áp Mã Giảm Giá Vào Đơn Đặt Sân (`ApplyVoucherForm.tsx`)
- **Endpoint Backend:** `POST /api/v1/vouchers/apply` (Yêu cầu đăng nhập, Pessimistic Write Lock trên cả Booking và Voucher).
- **Trợ lý chọn nhanh đơn đặt sân:**
  - Tự động gọi `GET /api/v1/bookings/my?status=PENDING&size=10` để lấy danh sách các đơn đặt sân đang chờ thanh toán của chính khách hàng.
  - Hiển thị danh sách gợi ý dạng nút bấm để khách hàng chọn đơn chỉ với 1 cú click mà không cần phải nhớ hoặc gõ thủ công mã `bookingId`.
- **Cảnh báo điều kiện PENDING bắt buộc:**
  - Hiển thị cảnh báo trực quan: *Chỉ áp dụng cho đơn đặt sân đang ở trạng thái `PENDING` (chờ thanh toán). Các đơn đã xác nhận, đã hoàn thành hoặc đã hủy sẽ bị từ chối.*
- **Hộp thoại xác nhận 1 chiều (`ConfirmApplyVoucherDialog.tsx`):**
  - Backend xử lý thao tác áp voucher là **hành động 1 chiều**: cập nhật vĩnh viễn số tiền `booking.totalAmount` và ghi nhận lịch sử sử dụng `VoucherUsage`. Backend sẽ chặn không cho phép áp mã lần thứ hai trên cùng một đơn (`409 VOUCHER_ALREADY_APPLIED`).
  - Hộp thoại cảnh báo khách hàng trước khi thực hiện để đảm bảo khách đã cân nhắc kỹ trước khi bấm xác nhận.

### 3.3. Biên Nhận Kết Quả Áp Mã (`ApplyVoucherResultCard.tsx`)
- Hiển thị ngay sau khi `POST /api/v1/vouchers/apply` trả về `200 OK`:
  - Mã đơn đặt sân `#id` và mã voucher đã áp dụng.
  - **Số tiền gốc ban đầu (`originalAmount`)**.
  - **Số tiền được giảm trừ (`discountAmount`)**.
  - **Tổng tiền chính thức cần thanh toán (`finalAmount`)**.
  - Nút **"Xem lịch đặt sân của tôi"** dẫn về `/my-bookings`.
  - Nút **"Áp mã cho đơn khác"** để tiếp tục thao tác.

---

## 4. Danh Sách Sub-components Phân Tách (`FE/src/components/voucher/`)

Tuân thủ nghiêm ngặt **Quy tắc Kiến trúc Component Frontend**, toàn bộ giao diện và logic của Module Voucher được chia thành 10 sub-components chuyên trách:

| STT | Tên Component | Vai trò & Trách nhiệm cụ thể |
|:---:|---|---|
| 1 | `AdminVouchersView.tsx` | Container điều phối toàn bộ dữ liệu, state lọc, modal và bảng danh sách của vai trò `ADMIN`. |
| 2 | `AdminVoucherFilterBar.tsx` | Thanh công cụ tìm kiếm theo từ khóa, lọc tab trạng thái (Tất cả / Bật / Tắt), chọn sắp xếp và nút mở modal tạo mới. |
| 3 | `AdminVoucherTable.tsx` | Bảng hiển thị danh sách voucher, định dạng tiền tệ / ngày tháng / lượt dùng, nút bật/tắt nhanh, nút sửa, nút xóa và phân trang. |
| 4 | `VoucherFormDialog.tsx` | Modal phục vụ cả Tạo mới (`POST`) và Chỉnh sửa (`PUT`), validate regex mã code, ràng buộc loại giảm giá và khóa các trường bất biến khi sửa. |
| 5 | `DeleteVoucherDialog.tsx` | Modal xác nhận xóa voucher, giải thích rõ cơ chế hard delete (`usedCount == 0`) vs soft deactivate (`usedCount > 0`). |
| 6 | `CustomerVouchersView.tsx` | Container điều phối danh sách voucher khả dụng và form áp mã giảm giá của vai trò `CUSTOMER`. |
| 7 | `ActiveVoucherCard.tsx` | Thẻ hiển thị từng voucher đang hoạt động kèm nút sao chép mã và nút điền nhanh vào form áp mã. |
| 8 | `ApplyVoucherForm.tsx` | Form nhập mã đơn + mã voucher, thanh gợi ý chọn nhanh đơn `PENDING`, hộp thông báo cảnh báo và kích hoạt dialog xác nhận. |
| 9 | `ConfirmApplyVoucherDialog.tsx` | Modal cảnh báo hành động 1 chiều trước khi gọi API áp mã giảm giá. |
| 10 | `ApplyVoucherResultCard.tsx` | Thẻ biên nhận chi tiết số tiền gốc, tiền giảm và tiền thanh toán sau khi áp mã thành công. |
| 11 | `VouchersPage.tsx` | Page Container mỏng (34 dòng) tại `src/pages/voucher/VouchersPage.tsx`, đọc vai trò từ `useAuth` và render `AdminVouchersView` hoặc `CustomerVouchersView`. |

---

## 5. Danh Mục Hàm API & Tiện Ích (`FE/src/lib/voucher.ts`)

- **Hàm tiện ích định dạng:**
  - `formatVnd(amount)`: Định dạng tiền Việt Nam chuẩn (`150.000 ₫`).
  - `formatDateTimeVi(dateStr)`: Định dạng ngày giờ thân thiện (`dd/MM/yyyy HH:mm`).
  - `toDateTimeLocalInput(dateStr)` / `fromDateTimeLocalInput(localStr)`: Chuyển đổi qua lại giữa ISO-8601 và `input[type="datetime-local"]`.
  - `formatVoucherDiscount(voucher)`: Chuẩn hóa chuỗi hiển thị mức giảm (`15% (Tối đa 50.000 ₫)` hoặc `50.000 ₫`).
- **Hàm gọi API Backend:**
  - `getVouchers(params)`: `GET /api/v1/vouchers` (ADMIN).
  - `getVoucherById(id)`: `GET /api/v1/vouchers/{id}` (ADMIN).
  - `createVoucher(body)`: `POST /api/v1/vouchers` (ADMIN).
  - `updateVoucher(id, body)`: `PUT /api/v1/vouchers/{id}` (ADMIN).
  - `toggleVoucherStatus(id)`: `PATCH /api/v1/vouchers/{id}/status` (ADMIN).
  - `deleteVoucher(id)`: `DELETE /api/v1/vouchers/{id}` (ADMIN).
  - `getActiveVouchers(params)`: `GET /api/v1/vouchers/active` (Public).
  - `applyVoucher(body)`: `POST /api/v1/vouchers/apply` (Customer/Staff/Admin).

