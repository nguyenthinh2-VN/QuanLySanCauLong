# Web Quản Lý Sân Cầu Lông (Badminton Court Management System) - Backend

Hệ thống Backend RESTful API quản lý sân cầu lông 

---

## 1. Công Nghệ Sử Dụng (Tech Stack)
- **Ngôn ngữ & Framework:** Java 23, Spring Boot 3.3.5
- **Cơ sở dữ liệu:** MySQL 8.x + Spring Data JPA (Hibernate 6)
- **Bảo mật & Phân quyền:** Spring Security 6, JWT (JJWT 0.12.x) với Access Token & Refresh Token Rotation
- **Mapping & Tiện ích:** MapStruct 1.5.5, Lombok, Bean Validation (Jakarta Validation)
- **Tài liệu API:** Springdoc OpenAPI 3 (Swagger UI)

---

## 2. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Local MySQL)

### Bước 1: Tạo cơ sở dữ liệu trong MySQL
Mở MySQL Workbench hoặc terminal MySQL và chạy lệnh:
```sql
CREATE DATABASE badminton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Cấu hình thông tin kết nối CSDL
Mở file `src/main/resources/application.yml` và kiểm tra lại `username`/`password` MySQL của máy bạn:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/badminton_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
    username: root        # Thay bằng username MySQL của bạn
    password: root        # Thay bằng password MySQL của bạn
```
*(Hoặc có thể cấu hình thông qua biến môi trường `DB_USERNAME` và `DB_PASSWORD`)*

### Bước 3: Build và chạy ứng dụng
Chạy trực tiếp từ terminal dự án:
```powershell
# Chạy ứng dụng qua Maven Wrapper
.\mvnw.cmd spring-boot:run
```
Hoặc mở dự án bằng IntelliJ IDEA / Eclipse / VS Code và chạy file:
`com.badminton.QuanLySanCauLongApplication`

---

## 3. Tài Khoản Khởi Tạo Mẫu (Data Seed)

Hệ thống tích hợp sẵn `DataSeeder` tự động khởi tạo dữ liệu mẫu khi ứng dụng khởi động lần đầu:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Quyền hạn mô tả |
|---|---|---|---|
| **ADMIN** | `admin@badminton.com` | `Admin@123` | Quản trị toàn hệ thống, cấu hình sân, giá, users |
| **STAFF** | `staff@badminton.com` | `Staff@123` | Nhân viên check-in, đặt lịch tại quầy |
| **CUSTOMER** | `customer@badminton.com` | `Customer@123` | Khách hàng đặt sân online, xem lịch |

---

## 4. Tài Liệu API & Swagger UI

- **Swagger UI Interactive:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Docs:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> **Cách thử nghiệm API có bảo mật trên Swagger:**
> 1. Gọi API `POST /api/v1/auth/login` với tài khoản admin hoặc customer.
> 2. Copy chuỗi `accessToken` từ response.
> 3. Bấm nút **Authorize** (ổ khóa màu xanh ở góc trên Swagger UI) -> Dán token -> Bấm **Authorize**.

---

## 5. Cấu Trúc Tài Liệu Dự Án (`docs/`)

Thư mục `docs/` được phân tách khoa học để dễ bảo trì và tích hợp Frontend:
- `docs/api/`: Tài liệu chi tiết các endpoint phục vụ đội ngũ làm Frontend (request body, response format, mã lỗi).
  - [Module 1: Auth & RBAC API Docs](docs/api/module-1-auth-rbac.md)
  - [Module 2: User Management API Docs](docs/api/module-2-user-management.md)
- `docs/architecture/`: Tài liệu kiến trúc Package-by-Feature (Modular Monolith), nguyên tắc thiết kế SOLID và ma trận phân quyền chi tiết (RBAC Matrix).
  - [Kiến trúc & RBAC Matrix](docs/architecture/architecture-and-rbac.md)
