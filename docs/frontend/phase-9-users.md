# ĐẶC TẢ CHI TIẾT PHASE 9: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (M2)

> **Màn hình:** `/users`  
> **Quyền hạn truy cập:** Chỉ dành riêng cho Quản trị viên (`ADMIN`). `STAFF` và `CUSTOMER` truy cập sẽ bị `RoleRoute` chặn và chuyển hướng sang `/403`.  
> **API Backend:** Module 2 — `AdminUserController` (`/api/v1/admin/users`).

---

## 1. Tổng Quan Giao Diện

Màn hình Quản lý Người dùng & Phân quyền cung cấp bộ công cụ toàn diện cho ADMIN nhằm theo dõi toàn bộ tài khoản trong hệ thống, cập nhật thông tin cá nhân, phân nhóm vai trò (RBAC), tạm khóa hoặc mở khóa tài khoản, và xóa vĩnh viễn tài khoản.

Giao diện tuân thủ triệt để nguyên tắc **Component Decomposition Rule** (trang `UsersPage.tsx` đóng vai trò composer tinh gọn) và phong cách **Modern Sport-Tech SaaS** với hệ thống màu `zinc` sắc nét, typography chuẩn mực và các badge ngữ nghĩa rõ ràng.

---

## 2. Danh Sách & Chức Năng Các Component Con

Toàn bộ các khối giao diện được tách thành các component đơn nhiệm độc lập trong `FE/src/components/user/`:

| Component | Vị trí | Trách nhiệm |
|---|---|---|
| **`UserFilterBar.tsx`** | Trên đầu trang | Ô tìm kiếm tên/email, dropdown lọc vai trò, dropdown lọc trạng thái hoạt động, nút đặt lại và nút "+ Thêm tài khoản". |
| **`UserTable.tsx`** | Trung tâm trang | Bảng danh sách tài khoản: Họ tên (kèm nhãn `(Bạn)`), Email, SĐT, Danh sách Badge vai trò, Badge trạng thái, Ngày tạo (`dd/MM/yyyy`), các nút thao tác và thanh phân trang. |
| **`UserFormDialog.tsx`** | Modal popup | Form dùng chung cho cả Tạo mới và Cập nhật thông tin tài khoản. |
| **`UserRolesDialog.tsx`** | Modal popup | Quản lý gán vai trò (`ADMIN`, `STAFF`, `CUSTOMER`) cho từng người dùng. |
| **`LockUserDialog.tsx`** | Modal popup | Hộp thoại xác nhận trước khi khóa tài khoản và cảnh báo thu hồi phiên làm việc tức thì. |
| **`DeleteUserDialog.tsx`** | Modal popup | Hộp thoại xác nhận cảnh báo hành động xóa vĩnh viễn không thể hoàn tác. |
| **`UsersPage.tsx`** | `FE/src/pages/user/` | Thin Page Composer kết nối state, gọi API và phối hợp các sub-components. |

---

## 3. Đặc Tả Chi Tiết 4 Tầng Bảo Vệ An Toàn (Critical Guards)

Hệ thống quản lý người dùng thiết lập 4 tầng bảo vệ nghiêm ngặt nhằm ngăn chặn sai sót vận hành và bảo vệ tính toàn vẹn của hệ thống:

### 🛡️ Guard 1: Cấm tạo tài khoản ADMIN qua Form thêm mới
- **Quy tắc:** Backend không cho phép tạo tài khoản có quyền `ADMIN` trực tiếp qua API `POST /api/v1/admin/users` (trả về lỗi 400 `CANNOT_CREATE_ADMIN`).
- **Xử lý Frontend:** Tại `UserFormDialog`, form tạo mới chỉ hiển thị duy nhất 2 ô chọn vai trò: `STAFF` (Nhân viên) và `CUSTOMER` (Khách hàng). Tuyệt đối không cung cấp tùy chọn `ADMIN`. Nếu muốn nâng quyền lên ADMIN, phải tạo tài khoản trước rồi mới dùng modal Phân quyền vai trò riêng biệt.

### 🛡️ Guard 2: Bảo vệ tài khoản chính mình (Self-Protection)
- **Quy tắc:** ADMIN đang đăng nhập (`currentUser.id === user.id`) không được tự khóa, tự xóa hoặc tự tước quyền ADMIN của chính mình.
- **Xử lý Frontend:**
  - Trên `UserTable`: Họ và tên của tài khoản hiện tại được gắn nhãn nổi bật `(Bạn)`.
  - Nút **Khóa** bị disabled kèm tooltip `"Không thể tự khóa tài khoản của chính mình"`.
  - Nút **Xóa** bị disabled kèm tooltip `"Không thể tự xóa tài khoản của chính mình"`.
  - Trên `UserRolesDialog`: Checkbox `ADMIN` được giữ nguyên trạng thái checked và bị disabled, kèm dòng cảnh báo: `"Không thể tự gỡ vai trò ADMIN của chính mình"`.

### 🛡️ Guard 3: Bảo vệ Quản trị viên cuối cùng (Last Admin Protection)
- **Quy tắc:** Không thể khóa, xóa hoặc gỡ quyền ADMIN của tài khoản ADMIN cuối cùng còn lại trong hệ thống.
- **Xử lý Frontend:** Không đếm số lượng ADMIN ở phía client vì phân trang khiến client không nắm được toàn bộ tập dữ liệu. Khi có yêu cầu vi phạm, Backend sẽ trả về mã lỗi `LAST_ADMIN_CANNOT_BE_MODIFIED` ("Không thể chỉnh sửa hoặc xóa Admin cuối cùng của hệ thống"). Frontend bắt lỗi và hiển thị rõ ràng trên `AuthAlert` cho người dùng.

### 🛡️ Guard 4: Chuẩn hóa hợp đồng Cập nhật thông tin (Update Contract Integrity)
- **Quy tắc:** API `PUT /api/v1/admin/users/{id}` chỉ chấp nhận 2 trường: `fullName` và `phone`. Tuyệt đối không gửi `email`, `roles` hay `password`.
- **Xử lý Frontend:** Khi ở chế độ chỉnh sửa:
  - Trường Email hiển thị ở dạng chỉ đọc (`read-only`) kèm ghi chú `(Email không thể thay đổi)`.
  - Ẩn hoàn toàn ô nhập mật khẩu và các checkbox vai trò.
  - Payload gửi đi đảm bảo đúng 100% interface `UpdateUserRequest`: `{ fullName: trimmedName, phone: trimmedPhone }`.

---

## 4. Contract API Backend & Quy Ước Dữ Liệu

Base URL chuẩn: `/api/v1/admin/users` (không dùng base path cũ `/api/v1/users`).

### 4.1. Lấy danh sách người dùng (`GET /api/v1/admin/users`)
- **Query Params:**
  - `search`: Chuỗi tìm kiếm theo họ tên hoặc email (Backend tự xử lý tìm kiếm không phân biệt hoa thường).
  - `role`: Giá trị enum Spring Boot bắt buộc có tiền tố `ROLE_` (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`). Frontend tự động ánh xạ role sang định dạng này trước khi gửi.
  - `active`: Nhận boolean string `"true"` hoặc `"false"`.
  - `page`: Chỉ mục trang (bắt đầu từ `0`).
  - `size`: Kích thước trang (mặc định `10`).
  - `sort`: Mặc định `createdAt,desc`.
- **Dữ liệu trả về:** Bọc trong `ApiResponse<PageResponse<RawUser>>`, được chuẩn hóa qua `normalizeUser` thành `User[]`.

### 4.2. Tạo mới tài khoản (`POST /api/v1/admin/users`)
- **Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "email": "vana@example.com",
    "phone": "0988776655",
    "password": "Password123!",
    "roles": ["STAFF"]
  }
  ```
- **Validation:** Họ tên từ 2 đến 100 ký tự; Email hợp lệ; SĐT đúng định dạng Việt Nam (`^(0|\+84)[3|5|7|8|9][0-9]{8}$`); Mật khẩu từ 6 đến 50 ký tự; Phải chọn ít nhất 1 vai trò (`STAFF` hoặc `CUSTOMER`).

### 4.3. Cập nhật thông tin cá nhân (`PUT /api/v1/admin/users/{id}`)
- **Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "phone": "0988776655"
  }
  ```

### 4.4. Phân quyền vai trò (`PATCH /api/v1/admin/users/{id}/roles`)
- **Body:**
  ```json
  {
    "roles": ["ADMIN", "STAFF"]
  }
  ```
- Phải chọn tối thiểu 1 vai trò.

### 4.5. Đổi trạng thái Hoạt động / Khóa (`PATCH /api/v1/admin/users/{id}/status`)
- **Body:**
  ```json
  {
    "active": false
  }
  ```
- **Thu hồi phiên làm việc tức thì:** Khi chuyển sang `active: false`, toàn bộ token/refresh token của tài khoản đó sẽ bị vô hiệu hóa ngay lập tức. Modal xác nhận `LockUserDialog` cảnh báo rõ ràng nội dung này cho ADMIN trước khi thực hiện.
- **Mở khóa (`active: true`):** Được thực hiện nhanh trực tiếp mà không cần mở dialog phụ.

### 4.6. Xóa vĩnh viễn tài khoản (`DELETE /api/v1/admin/users/{id}`)
- Yêu cầu xác nhận qua `DeleteUserDialog` cảnh báo tính chất không thể hoàn tác.
