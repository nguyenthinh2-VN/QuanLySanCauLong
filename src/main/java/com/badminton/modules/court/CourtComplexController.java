package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateComplexRequest;
import com.badminton.modules.court.dto.request.UpdateComplexRequest;
import com.badminton.modules.court.dto.response.ComplexDetailResponse;
import com.badminton.modules.court.dto.response.ComplexResponse;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.service.CourtComplexService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/complexes")
@RequiredArgsConstructor
@Tag(name = "Courts", description = "Quản lý Cụm sân và Sân cầu lông")
public class CourtComplexController {

    private final CourtComplexService courtComplexService;

    @GetMapping
    @Operation(
            summary = "Lấy danh sách cụm sân (Public)",
            description = "Cho phép khách vãng lai và người dùng tìm kiếm theo tên hoặc địa chỉ (q), lọc theo trạng thái và phân trang"
    )
    public ResponseEntity<ApiResponse<PageResponse<ComplexResponse>>> getComplexes(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ComplexStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        PageResponse<ComplexResponse> response = courtComplexService.getComplexes(q, status, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách cụm sân thành công"));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Xem thông tin chi tiết một cụm sân (Public)",
            description = "Lấy thông tin chi tiết của 1 cụm sân kèm danh sách tóm tắt các sân con trực thuộc"
    )
    public ResponseEntity<ApiResponse<ComplexDetailResponse>> getComplexById(@PathVariable Long id) {
        ComplexDetailResponse response = courtComplexService.getComplexById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết cụm sân thành công"));
    }

    @PostMapping
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Tạo mới cụm sân (Admin Only)",
            description = "Yêu cầu quyền ADMIN. Tên cụm sân là duy nhất trong toàn hệ thống"
    )
    public ResponseEntity<ApiResponse<ComplexResponse>> createComplex(@Valid @RequestBody CreateComplexRequest request) {
        ComplexResponse response = courtComplexService.createComplex(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo mới cụm sân thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Cập nhật thông tin cụm sân (Admin Only)",
            description = "Yêu cầu quyền ADMIN. Cập nhật tên, địa chỉ, số điện thoại và trạng thái hoạt động"
    )
    public ResponseEntity<ApiResponse<ComplexResponse>> updateComplex(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplexRequest request) {
        ComplexResponse response = courtComplexService.updateComplex(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật cụm sân thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Xóa cụm sân (Admin Only)",
            description = "Yêu cầu quyền ADMIN. Guard: Không cho phép xóa nếu cụm sân vẫn còn sân con bên trong"
    )
    public ResponseEntity<ApiResponse<Void>> deleteComplex(@PathVariable Long id) {
        courtComplexService.deleteComplex(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa cụm sân thành công"));
    }
}
