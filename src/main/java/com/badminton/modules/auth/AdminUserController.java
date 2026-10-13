package com.badminton.modules.auth;

import com.badminton.modules.auth.dto.request.CreateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRolesRequest;
import com.badminton.modules.auth.dto.request.UpdateUserStatusRequest;
import com.badminton.modules.auth.dto.response.UserResponse;
import com.badminton.modules.auth.service.UserService;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.response.ApiResponse;
import com.badminton.shared.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Admin User Management", description = "APIs Quản trị viên quản lý danh sách người dùng và phân quyền (ADMIN Only)")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách người dùng (Tìm kiếm, Lọc theo Role/Trạng thái, Phân trang & Sắp xếp)")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RoleType role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        PageResponse<UserResponse> response = userService.getUsers(search, role, active, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thông tin chi tiết một người dùng theo ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin người dùng thành công"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo tài khoản người dùng mới (Chỉ cho phép role STAFF hoặc CUSTOMER)")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo người dùng mới thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật thông tin cơ bản người dùng (Họ tên, SĐT - không đổi Role)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thông tin người dùng thành công"));
    }

    @PatchMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật quyền hạn/vai trò người dùng (Bảo vệ: không tự gỡ ADMIN của mình, không gỡ ADMIN cuối)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        UserResponse response = userService.updateUserRoles(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vai trò người dùng thành công"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Khóa hoặc mở khóa tài khoản (Bảo vệ: không tự khóa chính mình, không khóa ADMIN cuối)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserResponse response = userService.updateUserStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái người dùng thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa người dùng khỏi hệ thống (Bảo vệ: không tự xóa chính mình, không xóa ADMIN cuối)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa người dùng thành công"));
    }
}
