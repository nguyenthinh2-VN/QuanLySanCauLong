# TÀI LIỆU API CHO FRONTEND - MODULE 1: AUTHENTICATION & RBAC

> **Dành cho:** Frontend Developer (React, Vue, Flutter, Next.js, v.v.)  
> **Phiên bản:** v1.0.0  
> **Base URL:** `http://localhost:8080/api/v1`

---

## 1. Quy Chuẩn Response & Mã Lỗi Chung

Mọi API của hệ thống đều trả về cấu trúc JSON đồng nhất:

### Phản hồi thành công (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": { ... }
}
```

### Phản hồi thất bại (HTTP 400, 401, 403, 404, 500)
```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Email hoặc mật khẩu không chính xác",
  "errors": {
    "email": "Email không được để trống"
  }
}
```

### Request Header chuẩn
- Với API công khai (Public):
  ```http
  Content-Type: application/json
  ```
- Với API yêu cầu đăng nhập (Authenticated):
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  ```

---

## 2. Chi Tiết Danh Sách API Module 1

### 2.1. Đăng ký tài khoản khách hàng (Register)
Khách hàng tự tạo tài khoản mới. Tài khoản tạo qua endpoint này sẽ tự động được gán vai trò `ROLE_CUSTOMER`.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/register`
- **Yêu cầu đăng nhập:** Không (Public)
- **Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "phone": "0987654321",
  "password": "Password@123"
}
```
- **Ràng buộc dữ liệu (Validation):**
  - `fullName`: Không để trống, độ dài 2 - 100 ký tự.
  - `email`: Định dạng email hợp lệ, duy nhất trong hệ thống.
  - `phone`: Số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0), duy nhất trong hệ thống.
  - `password`: Tối thiểu 6 ký tự.

- **Response thành công (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0987654321",
    "active": true,
    "roles": ["ROLE_CUSTOMER"],
    "createdAt": "2026-10-09T18:00:00"
  }
}
```

- **Mã lỗi thường gặp:**
  - `EMAIL_ALREADY_EXISTS` (409): Email đã được sử dụng.
  - `PHONE_ALREADY_EXISTS` (409): Số điện thoại đã được sử dụng.
  - `VALIDATION_FAILED` (400): Dữ liệu gửi lên không đúng định dạng.

---

### 2.2. Đăng nhập hệ thống (Login)
Nhận Access Token và Refresh Token để duy trì phiên làm việc.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/login`
- **Yêu cầu đăng nhập:** Không (Public)
- **Request Body:**
```json
{
  "email": "nguyenvana@gmail.com",
  "password": "Password@123"
}
```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "fullName": "Nguyễn Văn A",
      "email": "nguyenvana@gmail.com",
      "phone": "0987654321",
      "roles": ["ROLE_CUSTOMER"]
    }
  }
}
```
> **Lưu ý cho Frontend:** 
> - `expiresIn`: Thời gian sống của Access Token tính bằng giây (900s = 15 phút).
> - Lưu `accessToken` vào Memory / State Manager (Redux/Pinia/Zustand), lưu `refreshToken` vào HttpOnly Cookie hoặc LocalStorage an toàn.

- **Mã lỗi thường gặp:**
  - `BAD_CREDENTIALS` (401): Sai email hoặc mật khẩu.
  - `USER_LOCKED` (403): Tài khoản đã bị khóa bởi quản trị viên.

---

### 2.3. Làm mới Access Token (Refresh Token)
Khi Access Token hết hạn (nhận mã 401 Unauthorized từ server), FE gọi API này để lấy cặp token mới mà không bắt người dùng đăng nhập lại.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/refresh-token`
- **Yêu cầu đăng nhập:** Không (gửi kèm refreshToken trong body)
- **Request Body:**
```json
{
  "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
    "refreshToken": "d82ab27e-32d7-464a-b501-c9183d29837a",
    "expiresIn": 900
  }
}
```
> **Cơ chế Token Rotation:** Mỗi lần gọi thành công, server sẽ hủy Refresh Token cũ và cấp Refresh Token mới. FE cần cập nhật lại cả hai token.

- **Mã lỗi thường gặp:**
  - `REFRESH_TOKEN_EXPIRED` (401): Refresh token đã hết hạn, FE điều hướng user về trang đăng nhập.
  - `INVALID_REFRESH_TOKEN` (401): Token không tồn tại hoặc đã bị thu hồi.

---

### 2.4. Đăng xuất (Logout)
Thu hồi Refresh Token trong cơ sở dữ liệu để vô hiệu hóa phiên làm việc.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/logout`
- **Yêu cầu đăng nhập:** Không bắt buộc (nhưng khuyến nghị gửi kèm Bearer Token nếu có)
- **Request Body:**
```json
{
  "refreshToken": "d82ab27e-32d7-464a-b501-c9183d29837a"
}
```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "data": null
}
```

---

### 2.5. Yêu cầu quên mật khẩu (Forgot Password)
Gửi yêu cầu đặt lại mật khẩu khi người dùng quên.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/forgot-password`
- **Yêu cầu đăng nhập:** Không (Public)
- **Request Body:**
```json
{
  "email": "nguyenvana@gmail.com"
}
```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Mã xác nhận đặt lại mật khẩu đã được tạo (kiểm tra console server)",
  "data": null
}
```
> **Mô phỏng (Mock):** Trong môi trường dev/portfolio, link đặt lại mật khẩu kèm mã token sẽ được in trực tiếp ra Terminal/Console của Backend.

---

### 2.6. Đặt lại mật khẩu mới (Reset Password)
Dùng mã token nhận được từ bước quên mật khẩu để đặt mật khẩu mới.

- **Phương thức:** `POST`
- **Đường dẫn:** `/auth/reset-password`
- **Yêu cầu đăng nhập:** Không (Public)
- **Request Body:**
```json
{
  "token": "4a7c182d-8b09-4ce4-8f4b-cf104ea20119",
  "newPassword": "NewPassword@123"
}
```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại",
  "data": null
}
```

- **Mã lỗi thường gặp:**
  - `RESET_TOKEN_INVALID` (400): Token không đúng hoặc đã qua sử dụng.
  - `RESET_TOKEN_EXPIRED` (400): Token đã quá hạn 15 phút.

---

### 2.7. Lấy thông tin tài khoản hiện tại (Get Current User)
Lấy thông tin người dùng đang đăng nhập dựa trên JWT token được gửi kèm.

- **Phương thức:** `GET`
- **Đường dẫn:** `/auth/me`
- **Yêu cầu đăng nhập:** Có (`Authorization: Bearer <accessToken>`)
- **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- **Response thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Lấy thông tin cá nhân thành công",
  "data": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0987654321",
    "active": true,
    "roles": ["ROLE_CUSTOMER"],
    "createdAt": "2026-10-09T18:00:00"
  }
}
```

---

## 3. Gợi ý cấu hình Axios Interceptor cho Frontend

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// Request interceptor: tự động gắn token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: tự động refresh token khi gặp 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('http://localhost:8080/api/v1/auth/refresh-token', {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```
