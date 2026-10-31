package com.badminton.modules.voucher;

import com.badminton.modules.voucher.dto.request.CreateVoucherRequest;
import com.badminton.modules.voucher.dto.request.UpdateVoucherRequest;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.service.VoucherAdminService;
import com.badminton.shared.constant.RoleConstants;
import com.badminton.shared.response.ApiResponse;
import com.badminton.shared.response.PageResponse;
import com.badminton.shared.util.SortUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import java.util.Set;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Admin Vouchers", description = "APIs Quản trị viên quản lý danh mục và cấu hình Voucher (ADMIN Only)")
public class VoucherAdminController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "code", "name", "discountValue", "startDate", "endDate", "active", "createdAt", "usedCount"
    );

    private final VoucherAdminService voucherAdminService;

    @PostMapping
    @Operation(summary = "Tạo mới voucher khuyến mãi", description = "Tạo voucher mới với cấu hình chiết khấu PERCENTAGE hoặc FIXED_AMOUNT")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody CreateVoucherRequest request
    ) {
        VoucherResponse response = voucherAdminService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo voucher thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách voucher quản trị", description = "Tìm kiếm theo từ khóa code/name, lọc theo trạng thái active và phân trang sắp xếp")
    public ResponseEntity<ApiResponse<PageResponse<VoucherResponse>>> getVouchers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        Sort resolvedSort = SortUtils.parseSort(sort, "createdAt", ALLOWED_SORT_FIELDS);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        PageResponse<VoucherResponse> response = voucherAdminService.getVouchers(keyword, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách voucher thành công"));
    }

    @GetMapping("/{id:[0-9]+}")
    @Operation(summary = "Lấy chi tiết voucher theo ID")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherById(
            @PathVariable Long id
    ) {
        VoucherResponse response = voucherAdminService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin voucher thành công"));
    }

    @PutMapping("/{id:[0-9]+}")
    @Operation(summary = "Cập nhật thông tin voucher")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVoucherRequest request
    ) {
        VoucherResponse response = voucherAdminService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật voucher thành công"));
    }

    @PatchMapping("/{id:[0-9]+}/status")
    @Operation(summary = "Bật/Tắt trạng thái hoạt động của voucher")
    public ResponseEntity<ApiResponse<VoucherResponse>> toggleVoucherStatus(
            @PathVariable Long id
    ) {
        VoucherResponse response = voucherAdminService.toggleVoucherStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Thay đổi trạng thái voucher thành công"));
    }

    @DeleteMapping("/{id:[0-9]+}")
    @Operation(summary = "Xóa voucher", description = "Xóa cứng nếu chưa ai sử dụng (usedCount == 0), ngược lại sẽ chuyển active sang false để bảo toàn lịch sử")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(
            @PathVariable Long id
    ) {
        voucherAdminService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa voucher thành công"));
    }
}

