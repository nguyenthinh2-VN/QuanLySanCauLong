# TÀI LIỆU API CHO FRONTEND - MODULE 2: USER MANAGEMENT & ROLE ASSIGNMENT

> **Dành cho:** Frontend Developer (React, Vue, Flutter, Next.js, v.v.)  
> **Phiên bản:** v1.0.0  
> **Base URL:** `http://localhost:8080/api/v1/admin/users`  
> **Phân quyền bắt buộc:** `ROLE_ADMIN` (Mọi endpoint đều yêu cầu token Admin, gửi kèm header `Authorization: Bearer <accessToken>`)

---

## 1. Quy Chuẩn Response & Mã Lỗi Chung

### Header bắt buộc cho tất cả API Module 2
```http
Content-Type: application/json
Authorization: Bearer <accessToken_of_admin>
```

### Danh mục mã lỗi nghiệp vụ của Module 2
| Mã lỗi (`code`) | HTTP Status | Ý nghĩa |
|---|:---:|---|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập hoặc token hết hạn |
| `ACCESS_DENIED` | 403 | Tài khoản đăng nhập không phải ADMIN |
| `USER_NOT_FOUND` | 404 | Không tìm thấy người dùng theo ID |
| `CANNOT_LOCK_SELF` | 400 | Admin không thể tự khóa chính mình |
| `CANNOT_REMOVE_OWN_ADMIN_ROLE` | 400 | Admin không thể tự gỡ vai trò ADMIN của mình |
| `CANNOT_DELETE_SELF` | 400 | Admin không thể tự xóa tài khoản của mình |
| `LAST_ADMIN_CANNOT_BE_MODIFIED` | 400 | Không thể khóa, gỡ quyền hoặc xóa Admin duy nhất còn lại trong hệ thống |
| `CANNOT_CREATE_ADMIN` | 400 | Không được phép tạo tài khoản ADMIN qua API này |
| `INVALID_ROLE` | 400 | Tên vai trò không hợp lệ |
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã tồn tại |
| `PHONE_ALREADY_EXISTS` | 409 | Số điện thoại đã tồn tại |
| `VALIDATION_FAILED` | 400 | Dữ liệu đầu vào không hợp lệ (sai định dạng email, sđt,...) |

---

## 2. Chi Tiết 7 Endpoints Quản Trị Người Dùng

### 2.1. Lấy danh sách người dùng (Tìm kiếm, Lọc, Phân trang & Sắp xếp)
- **Phương thức:** `GET`
- **Đường dẫn:** `/api/v1/admin/users`
- **Query Parameters:**
  - `search` (tùy chọn): Tìm kiếm tương đối theo họ tên hoặc email (không phân biệt hoa thường).
  - `role` (tùy chọn): Lọc theo vai trò (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`).
  - `active` (tùy chọn): Lọc theo trạng thái hoạt động (`true` - đang hoạt động, `false` - bị khóa).
  - `page` (tùy chọn, mặc định `0`): Chỉ mục trang (bắt đầu từ 0).
  - `size` (tùy chọn, mặc định `10`): Số lượng bản ghi trên một trang.
  - `sort` (tùy chọn, mặc định `createdAt,desc`): Sắp xếp theo trường và chiều (ví dụ: `fullName,asc`, `createdAt,desc`).

- **Ví dụ Request:**
  `GET /api/v1/admin/users?search=Nguyen&role=ROLE_CUSTOMER&active=true&page=0&size=10&sort=createdAt,desc`

- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "items": [
      {
        "id": 3,
        "fullName": "Khách Hàng Thân Thiết",
        "email": "customer@badminton.com",
        "phone": "0900000003",
        "active": true,
        "roles": ["ROLE_CUSTOMER"],
        "createdAt": "2026-10-13T10:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true
  },
  "timestamp": "2026-10-13T10:30:00Z"
}
```

---

### 2.2. Xem thông tin chi tiết một người dùng
- **Phương thức:** `GET`
- **Đường dẫn:** `/api/v1/admin/users/{id}`
- **Ví dụ Request:** `GET /api/v1/admin/users/2`
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 2,
    "fullName": "Nhân Viên Quầy Lễ Tân",
    "email": "staff@badminton.com",
    "phone": "0900000002",
    "active": true,
    "roles": ["ROLE_STAFF"],
    "createdAt": "2026-10-13T10:00:00"
  },
  "timestamp": "2026-10-13T10:30:00Z"
}
```
- **Response lỗi nếu không tìm thấy (404 Not Found):**
```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "Người dùng không tồn tại"
}
```

---

### 2.3. Tạo người dùng mới (Chỉ cho phép role STAFF hoặc CUSTOMER)
> **Lưu ý nghiệp vụ:** Để bảo vệ an ninh hệ thống, Quản trị viên chỉ được phép tạo tài khoản `ROLE_STAFF` hoặc `ROLE_CUSTOMER` qua API này. Không cho phép tạo tài khoản `ROLE_ADMIN`.

- **Phương thức:** `POST`
- **Đường dẫn:** `/api/v1/admin/users`
- **Request Body:**
```json
{
  "fullName": "Nhân Viên Mới",
  "email": "newstaff@badminton.com",
  "phone": "0981112233",
  "password": "Password@123",
  "roles": ["ROLE_STAFF"]
}
```
- **Response thành công (201 Created):**
```json
{
  "success": true,
  "message": "Tạo người dùng mới thành công",
  "data": {
    "id": 4,
    "fullName": "Nhân Viên Mới",
    "email": "newstaff@badminton.com",
    "phone": "0981112233",
    "active": true,
    "roles": ["ROLE_STAFF"],
    "createdAt": "2026-10-13T10:31:00"
  },
  "timestamp": "2026-10-13T10:31:00Z"
}
```

---

### 2.4. Cập nhật thông tin cơ bản người dùng (Họ tên & SĐT)
> **Lưu ý nghiệp vụ:** Endpoint này chỉ cho phép chỉnh sửa thông tin hồ sơ cơ bản (`fullName`, `phone`). Tuyệt đối không cho phép đổi vai trò qua endpoint này. Để đổi vai trò, vui lòng dùng `PATCH /{id}/roles`.

- **Phương thức:** `PUT`
- **Đường dẫn:** `/api/v1/admin/users/{id}`
- **Request Body:**
```json
{
  "fullName": "Nguyễn Văn B (Đã cập nhật)",
  "phone": "0989998877"
}
```
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật thông tin người dùng thành công",
  "data": {
    "id": 2,
    "fullName": "Nguyễn Văn B (Đã cập nhật)",
    "email": "staff@badminton.com",
    "phone": "0989998877",
    "active": true,
    "roles": ["ROLE_STAFF"],
    "createdAt": "2026-10-13T10:00:00"
  },
  "timestamp": "2026-10-13T10:32:00Z"
}
```

---

### 2.5. Thay đổi quyền hạn / Vai trò người dùng (Replace Roles)
> **Guards an toàn:**
> 1. Admin đang đăng nhập không thể tự gỡ quyền ADMIN của chính mình (`CANNOT_REMOVE_OWN_ADMIN_ROLE`).
> 2. Hệ thống kiểm tra số lượng Admin hiện tại, không thể gỡ quyền ADMIN của tài khoản Admin duy nhất còn lại (`LAST_ADMIN_CANNOT_BE_MODIFIED`).

- **Phương thức:** `PATCH`
- **Đường dẫn:** `/api/v1/admin/users/{id}/roles`
- **Request Body:**
```json
{
  "roles": ["ROLE_STAFF", "ROLE_CUSTOMER"]
}
```
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật vai trò người dùng thành công",
  "data": {
    "id": 2,
    "fullName": "Nhân Viên Quầy Lễ Tân",
    "email": "staff@badminton.com",
    "phone": "0900000002",
    "active": true,
    "roles": ["ROLE_STAFF", "ROLE_CUSTOMER"],
    "createdAt": "2026-10-13T10:00:00"
  },
  "timestamp": "2026-10-13T10:33:00Z"
}
```

---

### 2.6. Khóa / Mở khóa tài khoản (Lock / Unlock)
> **Guards an toàn:**
> 1. Admin không thể tự khóa tài khoản của chính mình (`CANNOT_LOCK_SELF`).
> 2. Không thể khóa tài khoản Admin duy nhất đang hoạt động (`LAST_ADMIN_CANNOT_BE_MODIFIED`).
> 3. Khi tài khoản bị khóa (`active: false`), toàn bộ Refresh Token của tài khoản đó sẽ bị thu hồi ngay lập tức để ngắt phiên làm việc.

- **Phương thức:** `PATCH`
- **Đường dẫn:** `/api/v1/admin/users/{id}/status`
- **Request Body:**
```json
{
  "active": false
}
```
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái người dùng thành công",
  "data": {
    "id": 3,
    "fullName": "Khách Hàng Thân Thiết",
    "email": "customer@badminton.com",
    "phone": "0900000003",
    "active": false,
    "roles": ["ROLE_CUSTOMER"],
    "createdAt": "2026-10-13T10:00:00"
  },
  "timestamp": "2026-10-13T10:34:00Z"
}
```

---

### 2.7. Xóa người dùng (Delete User)
> **Guards an toàn & Chính sách xóa:**
> 1. **Hình thức:** Xóa cứng (Hard-delete). Hệ thống xóa toàn bộ tokens liên quan (`refresh_tokens`, `password_reset_tokens`) trước khi xóa bản ghi người dùng khỏi CSDL.
> 2. Admin không thể tự xóa tài khoản của chính mình (`CANNOT_DELETE_SELF`).
> 3. Không thể xóa Admin duy nhất còn lại trong hệ thống (`LAST_ADMIN_CANNOT_BE_MODIFIED`).

- **Phương thức:** `DELETE`
- **Đường dẫn:** `/api/v1/admin/users/{id}`
- **Ví dụ Request:** `DELETE /api/v1/admin/users/4`
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Xóa người dùng thành công",
  "data": null,
  "timestamp": "2026-10-13T10:35:00Z"
}
```
