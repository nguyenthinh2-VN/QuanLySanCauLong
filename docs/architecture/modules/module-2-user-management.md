# CHI TIẾT MODULE 2: USER MANAGEMENT & ROLE ASSIGNMENT

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Quản lý người dùng, phân quyền vai trò (RBAC), tìm kiếm & phân trang, cùng 4 Guards nghiệp vụ bắt buộc bảo vệ Quản trị viên.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problems Solved)

1. **Phân quyền đặc quyền tối cao (ADMIN Only):**
   - Chỉ tài khoản có `ROLE_ADMIN` mới có quyền truy cập toàn bộ các endpoint tại base path `/api/v1/admin/users`.
   - Được bảo vệ bằng Method-level security: `@PreAuthorize("hasRole('ADMIN')")`.
2. **Bộ 4 Guards bảo vệ Quản trị viên (Critical Business Guards):**
   - **Guard 1 (Chống tự khóa):** Admin không thể tự khóa tài khoản của chính mình (`CANNOT_LOCK_SELF`).
   - **Guard 2 (Chống tự gỡ quyền):** Admin không thể tự gỡ vai trò `ROLE_ADMIN` của chính mình (`CANNOT_REMOVE_OWN_ADMIN_ROLE`).
   - **Guard 3 (Chống tự xóa):** Admin không thể tự xóa tài khoản của chính mình (`CANNOT_DELETE_SELF`).
   - **Guard 4 (Bảo toàn Admin cuối cùng):** Hệ thống ngăn chặn việc khóa, gỡ quyền hoặc xóa Admin duy nhất còn lại trong hệ thống (`LAST_ADMIN_CANNOT_BE_MODIFIED`).
3. **Phòng chống leo thang đặc quyền (Privilege Escalation Prevention):**
   - Endpoint tạo người dùng `POST /api/v1/admin/users` nghiêm cấm việc tạo tài khoản có quyền `ROLE_ADMIN` (`CANNOT_CREATE_ADMIN`). Chỉ cho phép tạo `STAFF` hoặc `CUSTOMER`.
4. **Tìm kiếm & Phân trang linh hoạt (Dynamic Search & Pagination):**
   - Tích hợp Spring Data JPA `Specification<User>` kết hợp `JpaSpecificationExecutor` cho phép tìm kiếm theo `fullName`/`email`, lọc theo `RoleType`, trạng thái `active`, cùng tham số phân trang `page`/`size`/`sort`.
5. **Thu hồi phiên đăng nhập tức thời (Immediate Session Invalidation):**
   - Khi tài khoản bị khóa (`active = false`), toàn bộ Refresh Token của người dùng đó bị thu hồi ngay lập tức (`revokeAllUserTokens`) để ngắt phiên làm việc.

---

## 2. Cấu Trúc Các Thành Phần Code (Code Inventory)

Toàn bộ Module 2 được mở rộng trực tiếp trong package `com.badminton.modules.auth` để đảm bảo tính gắn kết cao (High Cohesion):

```
com.badminton.modules.auth
├── AdminUserController.java            # REST Controller (/api/v1/admin/users/**, @PreAuthorize("hasRole('ADMIN')"))
├── service/
│   ├── UserService.java                # Interface nghiệp vụ quản lý người dùng
│   └── impl/UserServiceImpl.java       # Triển khai nghiệp vụ kèm 4 Guards an toàn
├── dto/
│   ├── request/
│   │   ├── CreateUserRequest.java      # DTO tạo user mới (validate @Valid, roles)
│   │   ├── UpdateUserRequest.java      # DTO cập nhật fullName, phone
│   │   ├── UpdateUserRolesRequest.java # DTO cập nhật danh sách roles
│   │   └── UpdateUserStatusRequest.java# DTO cập nhật active flag
│   └── response/
│       └── UserResponse.java           # DTO trả về (tuyệt đối không để lộ password/hash)
├── mapper/
│   ├── UserMapper.java                 # MapStruct chuyển đổi Entity <-> DTO
│   └── fallback/UserMapperFallbackImpl.java # Fallback dự phòng
└── repository/
    └── UserRepository.java             # JPA Repository + JpaSpecificationExecutor
```

---

## 3. Phân Tích Áp Dụng SOLID Trong Module 2

| Nguyên tắc | Vị trí áp dụng cụ thể trong Module 2 |
|---|---|
| **S - Single Responsibility** | `AdminUserController` chỉ điều hướng HTTP và bọc `ApiResponse`; `UserServiceImpl` tập trung 100% vào logic nghiệp vụ và các Guards an toàn; `SecurityUtils` chịu trách nhiệm trích xuất thông tin định danh từ SecurityContext. |
| **O - Open-Closed** | Cơ chế tìm kiếm sử dụng `Specification<User>` linh hoạt. Khi cần bổ sung tiêu chí lọc mới (ví dụ: ngày tạo `createdAfter`, `createdBefore`), chỉ cần thêm Predicate vào Specification mà không phá vỡ logic truy vấn hiện có. |
| **L - Liskov Substitution** | `UserMapperFallbackImpl` thay thế hoàn hảo cho `UserMapper` của MapStruct, đảm bảo hệ thống không bị crash ngay cả khi môi trường IDE chưa build annotation processor. |
| **I - Interface Segregation** | Phân tách DTO theo đúng mục đích: `UpdateUserRequest` (chỉ sửa profile) tách biệt hoàn toàn với `UpdateUserRolesRequest` (chỉ sửa role) và `UpdateUserStatusRequest` (chỉ sửa status), tránh để lộ trường không mong muốn. |
| **D - Dependency Inversion** | `AdminUserController` chỉ phụ thuộc vào interface `UserService`. Mọi injection đều qua Constructor (`@RequiredArgsConstructor`), tuyệt đối không dùng `@Autowired` field. |
