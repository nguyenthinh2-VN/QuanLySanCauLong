# TỔNG QUAN KIẾN TRÚC DỰ ÁN & CHỈ MỤC TÀI LIỆU (ARCHITECTURE HUB)

> **Dành cho:** AI Coding Agents và Software Engineers tham gia phát triển dự án.  
> **Mục tiêu:** Cung cấp bức tranh toàn cảnh về kiến trúc hệ thống backend "Web Quản Lý Sân Cầu Lông" và định hướng tra cứu chi tiết từng phần.

---

## 1. Sơ Đồ Kiến Trúc Phân Tầng (Layered Architecture)

Hệ thống được tổ chức phân tầng chặt chẽ dưới package `com.badminton`. Dữ liệu chỉ đi theo một chiều từ ngoài vào trong:

```
[ Client / Web Frontend ]
          │ HTTP Request (JSON)
          ▼
┌───────────────────────────────────────────────────────────┐
│ com.badminton.controller                                  │
│  - Chỉ nhận Request, Validate (@Valid), gọi Service       │
│  - Trả về ApiResponse<DTO>, tuyệt đối KHÔNG có logic nặng │
└─────────────────────────┬─────────────────────────────────┘
                          │ DTO
                          ▼
┌───────────────────────────────────────────────────────────┐
│ com.badminton.service                                     │
│  - Interface + Impl: Chứa toàn bộ Business Logic          │
│  - Quản lý biên giao dịch (@Transactional)                │
│  - Gọi Mapper chuyển đổi Entity <-> DTO                   │
└─────────────────────────┬─────────────────────────────────┘
                          │ Entity / Query Params
                          ▼
┌───────────────────────────────────────────────────────────┐
│ com.badminton.repository (Spring Data JPA)                │
│  - Giao tiếp với Database qua Hibernate                   │
│  - Tối ưu truy vấn bằng JPQL / DTO Projection             │
└─────────────────────────┬─────────────────────────────────┘
                          │ SQL
                          ▼
┌───────────────────────────────────────────────────────────┐
│ Database (MySQL 8.x)                                      │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Chỉ Mục Tài Liệu Chi Tiết (Quick Links Cho AI & Developers)

Để tránh tài liệu quá dài và dễ dàng mở rộng khi phát triển thêm các module tiếp theo, tài liệu kiến trúc được tách thành các phần chuyên biệt sau:

### 📌 1. Ma Trận Phân Quyền Chi Tiết (RBAC Matrix)
👉 **Đọc tại:** [`docs/architecture/rbac-matrix.md`](rbac-matrix.md)
- Bảng danh mục các vai trò: `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
- Bảng phân quyền chi tiết cho toàn bộ các API hiện tại và tương lai (Auth, Users, Courts, Bookings, Payments, Dashboard).
- Quy chuẩn Method-Level Security bằng `@PreAuthorize("hasRole(...)")` với hằng số `RoleConstants`.

### 📌 2. Triết Lý Thiết Kế SOLID & Chuẩn RESTful API
👉 **Đọc tại:** [`docs/architecture/solid-design-principles.md`](solid-design-principles.md)
- Quy chuẩn thiết kế RESTful (Resource-oriented URI, HTTP Verbs, Stateless, Status Codes).
- Cách áp dụng thực tế bộ 5 nguyên tắc SOLID trong toàn hệ thống.
- Thiết kế mở rộng **Strategy Pattern** cho hệ thống Notification (sẵn sàng tích hợp SMTP Email, Twilio SMS, Firebase Push mà không sửa code cũ).

### 📌 3. Tài Liệu Chi Tiết Từng Module (Modules Deep-Dive)
Mỗi module đều có một tài liệu phân tích riêng biệt (bài toán giải quyết, cấu trúc code, phân tích chi tiết mức độ áp dụng SOLID):
- 📘 **Module 1 (Auth & RBAC):** [`docs/architecture/modules/module-1-auth.md`](modules/module-1-auth.md) *(Áp dụng trọn vẹn 5/5 nguyên tắc SOLID)*.
- 📘 **Module 2 (User Management & Role Assignment):** *(Sẽ tạo khi thực hiện Module 2)*.
- 📘 **Module 3 (Courts, TimeSlots & Pricing):** *(Sẽ tạo khi thực hiện Module 3)*.
- 📘 **Module 4 (Bookings & Concurrency Control):** *(Sẽ tạo khi thực hiện Module 4)*.

### 📌 4. Tài Liệu Tích Hợp API Cho Frontend
👉 **Đọc tại:** [`docs/api/module-1-auth-rbac.md`](../api/module-1-auth-rbac.md)
- Hướng dẫn Request body, URL, Response format và mẫu cấu hình Axios Interceptor cho Frontend Developer.

---

## 3. Hướng Dẫn Dành Cho AI Agent Khi Tiếp Quản Codebase

Nếu bạn là một AI Agent đang tiếp nhận dự án này:
1. **Luôn tuân thủ nguyên tắc Dependency Inversion:** Mọi Service injection phải qua constructor (dùng `@RequiredArgsConstructor`), tuyệt đối không dùng `@Autowired` trên field.
2. **Không để lộ JPA Entity ra ngoài API:** Controller chỉ được phép nhận và trả về DTO. Sử dụng MapStruct (`com.badminton.mapper`) để chuyển đổi.
3. **Mọi phản hồi API đều bọc qua `ApiResponse<T>`:** Không bao giờ trả raw Object hoặc raw ResponseEntity không có cấu trúc chuẩn.
4. **Khi thêm tính năng mới:** Kiểm tra ma trận quyền tại [`rbac-matrix.md`](rbac-matrix.md) để gắn `@PreAuthorize` tương ứng trên Controller.
