# Hệ Thống Quản Lý Đặt Sân Cầu Lông (Badminton Court Management System)

Hệ thống quản lý và đặt sân cầu lông Full-stack gồm **Backend RESTful API** (Spring Boot 3, Modular Monolith) và **Frontend Web App** (React + TypeScript + Tailwind CSS), hỗ trợ đầy đủ luồng nghiệp vụ cho **Khách hàng (`CUSTOMER`)**, **Nhân viên quầy (`STAFF`)** và **Quản trị viên (`ADMIN`)**.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Ngôn ngữ & Framework:** Java 23, Spring Boot 3.3.5
- **Cơ sở dữ liệu:** MySQL 8.x + Spring Data JPA (Hibernate 6)
- **Bảo mật & Phân quyền:** Spring Security 6, JWT (JJWT 0.12.x) với Access Token & Refresh Token Rotation
- **Mapping & Tiện ích:** MapStruct, Lombok, Jakarta Bean Validation
- **Tài liệu API:** Springdoc OpenAPI 3 (Swagger UI)

### Frontend (`FE/`)
- **Core:** React 18, TypeScript, Vite 6
- **Routing & HTTP:** React Router DOM 6, Axios (kèm interceptor tự refresh token)
- **UI & Styling:** Tailwind CSS 3, Radix UI / shadcn/ui

---

## 2. Các Phân Hệ Chức Năng (Modules)

| Module | Tên phân hệ | Chức năng chính |
|---|---|---|
| **M1** | **Auth & RBAC** | Đăng ký, đăng nhập (`/login`, `/register`), Refresh Token Rotation, quên/đặt lại mật khẩu, phân quyền `ADMIN` / `STAFF` / `CUSTOMER`. |
| **M2** | **User Management** | Quản lý tài khoản người dùng, tìm kiếm/lọc, khóa/mở khóa và cập nhật vai trò (`/users`). |
| **M3** | **Courts & TimeSlots** | Quản lý cụm sân (`CourtComplex`), sân con (`Court`), khung giờ & đơn giá (`TimeSlot`). |
| **M4** | **Online Booking** | Xem lưới slot trống theo ngày & cụm sân (`/booking`), đặt sân, hủy đơn, đổi lịch (`/my-bookings`). |
| **M5** | **POS & Check-in** | Đặt sân trực tiếp tại quầy cho thành viên hoặc khách vãng lai (`/pos`), check-in khách vào sân (`/check-in`), đặt lịch lặp. |
| **M6** | **Payments & Refunds** | Thanh toán `FULL` (100%) / `DEPOSIT` (50%), nhập & áp mã voucher ngay khi thanh toán, thu/hoàn tiền tại quầy (`/payments`), lịch sử giao dịch toàn hệ thống & cá nhân, xem và in hóa đơn chuẩn bill 80mm. |
| **M7** | **Vouchers** | Quản lý mã giảm giá (`PERCENTAGE` / `FIXED_AMOUNT`), giới hạn lượt dùng (`/vouchers`), xem ưu đãi & áp mã vào đơn `PENDING`. |
| **M8** | **Reports** | Báo cáo doanh thu thuần/gộp/hoàn tiền theo ngày/tuần/tháng, cơ cấu phương thức thanh toán và công suất lấp đầy sân (`/reports`). |

---

## 3. Hướng Dẫn Cài Đặt & Chạy Dự Án (Local)

### A. Chạy Backend (Port `8080`)

1. **Tạo cơ sở dữ liệu trong MySQL:**
   ```sql
   CREATE DATABASE badminton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. **Cấu hình kết nối CSDL** trong `src/main/resources/application.yml` (hoặc qua biến môi trường `DB_USERNAME`, `DB_PASSWORD`):
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/badminton_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
       username: root
       password: root
   ```
3. **Khởi chạy Backend:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

### B. Chạy Frontend (Port `3000`)

```powershell
cd FE
npm install
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000)

### C. Kiểm Thử & Build

```powershell
# Chạy toàn bộ test suite Backend
.\mvnw.cmd clean test

# Kiểm tra TypeScript & build production Frontend
cd FE
npm run build
```

---

## 4. Tài Khoản Khởi Tạo Mẫu (Data Seed)

Hệ thống tích hợp sẵn `DataSeeder` tự động khởi tạo dữ liệu mẫu khi ứng dụng khởi động lần đầu:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Quyền hạn mô tả |
|---|---|---|---|
| **ADMIN** | `admin@badminton.com` | `Admin@123` | Quản trị toàn hệ thống, người dùng, sân, voucher, báo cáo, thu/hoàn tiền |
| **STAFF** | `staff@badminton.com` | `Staff@123` | Nhân viên quầy: đặt sân POS, check-in, thu/hoàn tiền & tra cứu giao dịch |
| **CUSTOMER** | `customer@badminton.com` | `Customer@123` | Khách hàng đặt sân online, áp voucher, thanh toán & xem lịch sử giao dịch |

---

## 5. Tài Liệu API & Swagger UI

- **Swagger UI Interactive:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Docs:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> **Cách thử nghiệm API có bảo mật trên Swagger:**
> 1. Gọi API `POST /api/v1/auth/login` với tài khoản mẫu.
> 2. Copy chuỗi `accessToken` từ response.
> 3. Bấm nút **Authorize** ở góc trên Swagger UI → dán token → bấm **Authorize**.

---

## 6. Cấu Trúc Tài Liệu Dự Án (`docs/`)

- **Kiến trúc & Phân quyền (`docs/architecture/`):**
  - [Kiến trúc & RBAC Matrix](docs/architecture/architecture-and-rbac.md)
- **Tài liệu API Backend (`docs/api/`):**
  - [Module 1: Auth & RBAC](docs/api/module-1-auth-rbac.md)
  - [Module 2: User Management](docs/api/module-2-user-management.md)
  - [Module 3: Courts & TimeSlots](docs/api/module-3-courts.md)
  - [Module 4: Bookings](docs/api/module-4-bookings.md)
  - [Module 5: POS, Check-in & Recurring](docs/api/module-5-bookings-pos.md)
  - [Module 6: Payments, Refunds, History & Invoices](docs/api/module-6-payments.md)
  - [Module 7: Vouchers](docs/api/module-7-vouchers.md)
  - [Module 8: Reports](docs/api/module-8-reports.md)
- **Tài liệu Frontend (`docs/frontend/`):**
  - [Tổng quan Frontend](docs/frontend/README.md) & [Design System](docs/frontend/design-system.md)
  - [Phase 1: Auth & AppShell](docs/frontend/phase-1-auth-appshell.md)
  - [Phase 2: Customer Booking](docs/frontend/phase-2-customer-booking.md)
  - [Phase 3: POS & Check-in](docs/frontend/phase-3-pos-checkin.md)
  - [Phase 4: Vouchers](docs/frontend/phase-4-vouchers.md)
  - [Phase 5: Payments, History & Invoices](docs/frontend/phase-5-payments.md)
  - [Phase 6: Reports](docs/frontend/phase-6-reports.md)
