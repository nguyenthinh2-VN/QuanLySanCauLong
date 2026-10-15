package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateCourtRequest;
import com.badminton.modules.court.dto.request.UpdateCourtRequest;
import com.badminton.modules.court.dto.response.CourtResponse;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.service.CourtService;
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
@RequestMapping("/api/v1/courts")
@RequiredArgsConstructor
@Tag(name = "Courts", description = "Quản lý Cụm sân và Sân cầu lông")
public class CourtController {

        private final CourtService courtService;

        @GetMapping
        @Operation(summary = "Lấy danh sách sân con (Public)", description = "Cho phép khách xem danh sách sân con, lọc theo cụm sân (complexId), trạng thái (AVAILABLE/MAINTENANCE), tìm kiếm theo tên (q) và phân trang. Sân bảo trì (MAINTENANCE) vẫn hiển thị nhưng giao diện người dùng sẽ làm mờ nút đặt sân")
        public ResponseEntity<ApiResponse<PageResponse<CourtResponse>>> getCourts(
                        @RequestParam(required = false) Long complexId,
                        @RequestParam(required = false) CourtStatus status,
                        @RequestParam(required = false) String q,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt,desc") String sort) {
                PageResponse<CourtResponse> response = courtService.getCourts(complexId, status, q, page, size, sort);
                return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách sân con thành công"));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Xem thông tin chi tiết một sân con (Public)", description = "Lấy thông tin chi tiết của 1 sân con theo ID bao gồm tên sân, trạng thái và thông tin cụm sân trực thuộc")
        public ResponseEntity<ApiResponse<CourtResponse>> getCourtById(@PathVariable Long id) {
                CourtResponse response = courtService.getCourtById(id);
                return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin sân con thành công"));
        }

        @PostMapping
        @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Tạo mới sân con trong cụm (Admin Only)", description = "Yêu cầu quyền ADMIN. complexId là bắt buộc. Tên sân không được trùng lặp trong cùng một cụm sân")
        public ResponseEntity<ApiResponse<CourtResponse>> createCourt(@Valid @RequestBody CreateCourtRequest request) {
                CourtResponse response = courtService.createCourt(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(response, "Tạo mới sân con thành công"));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Cập nhật thông tin sân con (Admin Only)", description = "Yêu cầu quyền ADMIN. Cho phép cập nhật tên sân và trạng thái bảo trì/sẵn sàng. Tên sân không được trùng với sân khác trong cùng cụm")
        public ResponseEntity<ApiResponse<CourtResponse>> updateCourt(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateCourtRequest request) {
                CourtResponse response = courtService.updateCourt(id, request);
                return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật sân con thành công"));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Xóa sân con (Admin Only)", description = "Yêu cầu quyền ADMIN. Xóa sân con khỏi hệ thống khi không còn phụ thuộc")
        public ResponseEntity<ApiResponse<Void>> deleteCourt(@PathVariable Long id) {
                courtService.deleteCourt(id);
                return ResponseEntity.ok(ApiResponse.success(null, "Xóa sân con thành công"));
        }
}
