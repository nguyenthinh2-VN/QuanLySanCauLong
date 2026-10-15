# TÀI LIỆU API CHO FRONTEND - MODULE 3: COURTS, TIMESLOTS & PRICING

> **Dành cho:** Frontend Developer (React, Vue, Flutter, Next.js, v.v.)  
> **Phiên bản:** v1.0.0  
> **Base URL:** `http://localhost:8080/api/v1`  
> **Phân quyền:** 
> - Các API `GET` (xem danh sách & chi tiết cụm sân, sân con, khung giờ & bảng giá): **Public (không cần accessToken)**.
> - Các API `POST`, `PUT`, `DELETE`: **Yêu cầu quyền `ROLE_ADMIN`** (gửi kèm header `Authorization: Bearer <accessToken>`).

---

## 1. Quy Chuẩn Response & Mã Lỗi Nghiệp Vụ

### 1.1. Response Envelope Pattern
Mọi response đều được bọc trong định dạng `ApiResponse`:
- **Thành công (200 / 201):**
  ```json
  {
    "success": true,
    "message": "Thông báo thân thiện",
    "data": { ... },
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```
- **Thất bại (400 / 401 / 403 / 404 / 409):**
  ```json
  {
    "success": false,
    "code": "ERROR_CODE",
    "message": "Mô tả nguyên nhân lỗi bằng tiếng Việt",
    "errors": null,
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 1.2. Danh Mục Mã Lỗi Nghiệp Vụ (Module 3)
| Mã lỗi (`code`) | HTTP Status | Ý nghĩa & Hướng xử lý ở FE |
|---|:---:|---|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập hoặc token hết hạn khi gọi API Admin. FE chuyển hướng đến trang Login. |
| `ACCESS_DENIED` | 403 | Tài khoản đăng nhập không có vai trò `ROLE_ADMIN`. FE hiển thị thông báo "Không có quyền". |
| `COMPLEX_NOT_FOUND` | 404 | Cụm sân không tồn tại trong hệ thống. |
| `COURT_NOT_FOUND` | 404 | Sân con không tồn tại trong hệ thống. |
| `TIMESLOT_NOT_FOUND` | 404 | Khung giờ không tồn tại trong hệ thống. |
| `COMPLEX_HAS_COURTS` | 400 | Không thể xóa cụm sân đang còn sân con. Admin phải xóa hoặc chuyển các sân con trước. |
| `DUPLICATE_COMPLEX_NAME` | 409 | Tên cụm sân đã tồn tại trong hệ thống. Nhắc người dùng nhập tên khác. |
| `DUPLICATE_COURT_NAME` | 409 | Tên sân đã tồn tại trong cùng cụm sân này. Nhắc người dùng đổi tên sân con. |
| `INVALID_TIME_RANGE` | 400 | Giờ bắt đầu phải trước giờ kết thúc (`startTime < endTime`). |
| `OVERLAPPING_TIME_SLOT` | 409 | Khung giờ bị trùng lặp hoặc đè lên khung giờ đã tồn tại. |
| `INVALID_SORT_FIELD` | 400 | Tham số `sort` truyền trường không nằm trong whitelist. FE kiểm tra lại tên cột sort. |
| `VALIDATION_FAILED` | 400 | Dữ liệu đầu vào không hợp lệ (để trống trường bắt buộc, giá âm, v.v.). |

---

## 2. Chi Tiết Các Endpoints Cụm Sân (CourtComplex)

### 2.1. `GET /api/v1/complexes` — Lấy danh sách cụm sân (Public)
- **Quyền hạn:** Public (không cần token).
- **Query Parameters:**
  - `q` (tùy chọn): Tìm kiếm tương đối theo tên cụm sân hoặc địa chỉ.
  - `status` (tùy chọn): Lọc theo trạng thái (`ACTIVE` hoặc `INACTIVE`).
  - `page` (tùy chọn, mặc định `0`): Chỉ số trang (bắt đầu từ 0).
  - `size` (tùy chọn, mặc định `10`): Số lượng phần tử mỗi trang.
  - `sort` (tùy chọn, mặc định `createdAt,desc`): Whitelist hỗ trợ: `id`, `name`, `address`, `status`, `createdAt`, `updatedAt`.
- **Ví dụ Request:**
  `GET /api/v1/complexes?q=Cầu Giấy&status=ACTIVE&page=0&size=10&sort=name,asc`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách cụm sân thành công",
    "data": {
      "items": [
        {
          "id": 1,
          "name": "Cụm Sân Cầu Lông Cầu Giấy",
          "address": "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
          "phone": "0912345678",
          "status": "ACTIVE",
          "totalCourts": 3,
          "createdAt": "2026-10-15T08:00:00",
          "updatedAt": "2026-10-15T08:00:00"
        }
      ],
      "page": 0,
      "size": 10,
      "totalElements": 1,
      "totalPages": 1,
      "first": true,
      "last": true
    },
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 2.2. `GET /api/v1/complexes/{id}` — Xem chi tiết một cụm sân (Public)
- **Quyền hạn:** Public.
- **Ví dụ Request:** `GET /api/v1/complexes/1`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Lấy chi tiết cụm sân thành công",
    "data": {
      "id": 1,
      "name": "Cụm Sân Cầu Lông Cầu Giấy",
      "address": "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
      "phone": "0912345678",
      "status": "ACTIVE",
      "createdAt": "2026-10-15T08:00:00",
      "updatedAt": "2026-10-15T08:00:00",
      "courts": [
        { "id": 101, "name": "Sân 1 (Thảm Victor)", "status": "AVAILABLE" },
        { "id": 102, "name": "Sân 2 (Thảm Yonex)", "status": "AVAILABLE" },
        { "id": 103, "name": "Sân 3 (Thảm Lining VIP)", "status": "AVAILABLE" }
      ]
    },
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```
- **Response 404 Not Found (Cụm không tồn tại):**
  ```json
  {
    "success": false,
    "code": "COMPLEX_NOT_FOUND",
    "message": "Không tìm thấy cụm sân trong hệ thống",
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 2.3. `POST /api/v1/complexes` — Tạo mới cụm sân (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "name": "Cụm Sân Cầu Lông Hà Đông",
    "address": "789 Đường Quang Trung, Quận Hà Đông, Hà Nội",
    "phone": "0934567890",
    "status": "ACTIVE"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "success": true,
    "message": "Tạo mới cụm sân thành công",
    "data": {
      "id": 3,
      "name": "Cụm Sân Cầu Lông Hà Đông",
      "address": "789 Đường Quang Trung, Quận Hà Đông, Hà Nội",
      "phone": "0934567890",
      "status": "ACTIVE",
      "totalCourts": 0,
      "createdAt": "2026-10-15T10:05:00",
      "updatedAt": "2026-10-15T10:05:00"
    },
    "timestamp": "2026-10-15T10:05:00Z"
  }
  ```
- **Response 409 Conflict (Trùng tên cụm):**
  ```json
  {
    "success": false,
    "code": "DUPLICATE_COMPLEX_NAME",
    "message": "Tên cụm sân đã tồn tại trong hệ thống",
    "timestamp": "2026-10-15T10:05:00Z"
  }
  ```

### 2.4. `PUT /api/v1/complexes/{id}` — Cập nhật cụm sân (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "name": "Cụm Sân Cầu Lông Cầu Giấy (Cơ sở 1)",
    "address": "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
    "phone": "0912345678",
    "status": "ACTIVE"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Cập nhật cụm sân thành công",
    "data": {
      "id": 1,
      "name": "Cụm Sân Cầu Lông Cầu Giấy (Cơ sở 1)",
      "address": "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
      "phone": "0912345678",
      "status": "ACTIVE",
      "totalCourts": 3,
      "createdAt": "2026-10-15T08:00:00",
      "updatedAt": "2026-10-15T10:10:00"
    },
    "timestamp": "2026-10-15T10:10:00Z"
  }
  ```

### 2.5. `DELETE /api/v1/complexes/{id}` — Xóa cụm sân (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Response 200 OK (Xóa thành công khi không còn sân con):**
  ```json
  {
    "success": true,
    "message": "Xóa cụm sân thành công",
    "data": null,
    "timestamp": "2026-10-15T10:15:00Z"
  }
  ```
- **Response 400 Bad Request (Guard chặn xóa do còn sân con):**
  ```json
  {
    "success": false,
    "code": "COMPLEX_HAS_COURTS",
    "message": "Không thể xóa cụm sân đang có sân con bên trong",
    "timestamp": "2026-10-15T10:15:00Z"
  }
  ```

---

## 3. Chi Tiết Các Endpoints Sân Con (Court)

### 3.1. `GET /api/v1/courts` — Lấy danh sách sân con (Public)
- **Quyền hạn:** Public.
- **Query Parameters:**
  - `complexId` (tùy chọn): Lọc theo ID của cụm sân trực thuộc.
  - `status` (tùy chọn): `AVAILABLE` (đang mở) hoặc `MAINTENANCE` (đang bảo trì).
  - `q` (tùy chọn): Tìm kiếm theo tên sân.
  - `page`, `size`, `sort`: Whitelist hỗ trợ `id`, `name`, `status`, `createdAt`, `updatedAt`.
- **Ghi chú UI/UX cho FE:** Sân có `status = "MAINTENANCE"` vẫn được trả về trong danh sách công khai để khách biết sân đang tạm ngừng phục vụ; FE cần hiển thị badge màu vàng "Bảo trì" và disable (làm mờ) nút đặt sân.
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách sân con thành công",
    "data": {
      "items": [
        {
          "id": 101,
          "name": "Sân 1 (Thảm Victor)",
          "status": "AVAILABLE",
          "complexId": 1,
          "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
          "createdAt": "2026-10-15T08:00:00",
          "updatedAt": "2026-10-15T08:00:00"
        }
      ],
      "page": 0,
      "size": 10,
      "totalElements": 1,
      "totalPages": 1,
      "first": true,
      "last": true
    },
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 3.2. `GET /api/v1/courts/{id}` — Xem chi tiết một sân con (Public)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Lấy thông tin sân con thành công",
    "data": {
      "id": 101,
      "name": "Sân 1 (Thảm Victor)",
      "status": "AVAILABLE",
      "complexId": 1,
      "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
      "createdAt": "2026-10-15T08:00:00",
      "updatedAt": "2026-10-15T08:00:00"
    },
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```
- **Response 404 Not Found:**
  ```json
  {
    "success": false,
    "code": "COURT_NOT_FOUND",
    "message": "Không tìm thấy sân cầu lông trong hệ thống",
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 3.3. `POST /api/v1/courts` — Tạo sân con mới (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "complexId": 1,
    "name": "Sân 4 (Thảm Enlio)",
    "status": "AVAILABLE"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "success": true,
    "message": "Tạo mới sân con thành công",
    "data": {
      "id": 104,
      "name": "Sân 4 (Thảm Enlio)",
      "status": "AVAILABLE",
      "complexId": 1,
      "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
      "createdAt": "2026-10-15T10:20:00",
      "updatedAt": "2026-10-15T10:20:00"
    },
    "timestamp": "2026-10-15T10:20:00Z"
  }
  ```
- **Response 409 Conflict (Trùng tên sân trong cùng cụm):**
  ```json
  {
    "success": false,
    "code": "DUPLICATE_COURT_NAME",
    "message": "Tên sân đã tồn tại trong cụm sân này",
    "timestamp": "2026-10-15T10:20:00Z"
  }
  ```
  *(Lưu ý: Hai sân con ở 2 cụm khác nhau hoàn toàn được phép trùng tên, ví dụ cả Cụm 1 và Cụm 2 đều có "Sân 1" -> 201 Created bình thường).*

### 3.4. `PUT /api/v1/courts/{id}` — Cập nhật sân con (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "name": "Sân 1 (Bảo trì thay đèn)",
    "status": "MAINTENANCE"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Cập nhật sân con thành công",
    "data": {
      "id": 101,
      "name": "Sân 1 (Bảo trì thay đèn)",
      "status": "MAINTENANCE",
      "complexId": 1,
      "complexName": "Cụm Sân Cầu Lông Cầu Giấy",
      "createdAt": "2026-10-15T08:00:00",
      "updatedAt": "2026-10-15T10:25:00"
    },
    "timestamp": "2026-10-15T10:25:00Z"
  }
  ```

### 3.5. `DELETE /api/v1/courts/{id}` — Xóa sân con (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Xóa sân con thành công",
    "data": null,
    "timestamp": "2026-10-15T10:30:00Z"
  }
  ```

---

## 4. Chi Tiết Các Endpoints Khung Giờ & Bảng Giá (TimeSlot)

> **Nguyên tắc nghiệp vụ:** Bảng giá khung giờ áp dụng chung trên toàn hệ thống. Hệ thống **không cung cấp API xóa khung giờ (`DELETE`)** để bảo vệ tính toàn vẹn của lịch sử đơn đặt sân. Khi muốn ngừng áp dụng một khung giờ, Admin gọi `PUT` đổi mức giá về 0 hoặc đổi tên chú thích.

### 4.1. `GET /api/v1/time-slots` — Lấy danh sách khung giờ & bảng giá (Public)
- **Quyền hạn:** Public.
- **Sắp xếp mặc định:** Luôn sắp xếp theo thời gian bắt đầu (`startTime ASC`).
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách khung giờ thành công",
    "data": [
      {
        "id": 1,
        "name": "Sáng sớm 05:00–08:00",
        "startTime": "05:00:00",
        "endTime": "08:00:00",
        "pricePerHour": 80000.00,
        "createdAt": "2026-10-15T08:00:00",
        "updatedAt": "2026-10-15T08:00:00"
      },
      {
        "id": 2,
        "name": "Giờ hành chính 08:00–16:00",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "pricePerHour": 100000.00,
        "createdAt": "2026-10-15T08:00:00",
        "updatedAt": "2026-10-15T08:00:00"
      },
      {
        "id": 3,
        "name": "Giờ vàng chiều tối 16:00–21:00",
        "startTime": "16:00:00",
        "endTime": "21:00:00",
        "pricePerHour": 150000.00,
        "createdAt": "2026-10-15T08:00:00",
        "updatedAt": "2026-10-15T08:00:00"
      },
      {
        "id": 4,
        "name": "Đêm muộn 21:00–23:00",
        "startTime": "21:00:00",
        "endTime": "23:00:00",
        "pricePerHour": 120000.00,
        "createdAt": "2026-10-15T08:00:00",
        "updatedAt": "2026-10-15T08:00:00"
      }
    ],
    "timestamp": "2026-10-15T10:00:00Z"
  }
  ```

### 4.2. `POST /api/v1/time-slots` — Tạo mới khung giờ & giá (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "name": "Sáng sớm cuối tuần 05:00–07:00",
    "startTime": "05:00:00",
    "endTime": "07:00:00",
    "pricePerHour": 90000
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "success": true,
    "message": "Tạo mới khung giờ thành công",
    "data": {
      "id": 5,
      "name": "Sáng sớm cuối tuần 05:00–07:00",
      "startTime": "05:00:00",
      "endTime": "07:00:00",
      "pricePerHour": 90000.00,
      "createdAt": "2026-10-15T10:35:00",
      "updatedAt": "2026-10-15T10:35:00"
    },
    "timestamp": "2026-10-15T10:35:00Z"
  }
  ```
- **Response 400 Bad Request (Guard khoảng giờ sai `startTime >= endTime`):**
  ```json
  {
    "success": false,
    "code": "INVALID_TIME_RANGE",
    "message": "Giờ bắt đầu phải trước giờ kết thúc",
    "timestamp": "2026-10-15T10:35:00Z"
  }
  ```
- **Response 409 Conflict (Guard đè khung giờ đã có):**
  ```json
  {
    "success": false,
    "code": "OVERLAPPING_TIME_SLOT",
    "message": "Khung giờ bị trùng hoặc đè lên khung giờ đã tồn tại",
    "timestamp": "2026-10-15T10:35:00Z"
  }
  ```

### 4.3. `PUT /api/v1/time-slots/{id}` — Cập nhật khung giờ & giá (Admin Only)
- **Header:** `Authorization: Bearer <accessToken_of_admin>`
- **Request Body:**
  ```json
  {
    "name": "Giờ vàng chiều tối 16:00–21:00 (Điều chỉnh)",
    "startTime": "16:00:00",
    "endTime": "21:00:00",
    "pricePerHour": 160000
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Cập nhật khung giờ thành công",
    "data": {
      "id": 3,
      "name": "Giờ vàng chiều tối 16:00–21:00 (Điều chỉnh)",
      "startTime": "16:00:00",
      "endTime": "21:00:00",
      "pricePerHour": 160000.00,
      "createdAt": "2026-10-15T08:00:00",
      "updatedAt": "2026-10-15T10:40:00"
    },
    "timestamp": "2026-10-15T10:40:00Z"
  }
  ```
