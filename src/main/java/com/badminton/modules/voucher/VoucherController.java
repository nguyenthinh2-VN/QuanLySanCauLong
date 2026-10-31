package com.badminton.modules.voucher;

import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.dto.response.ApplyVoucherResponse;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.service.VoucherService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@Tag(name = "Customer Vouchers", description = "APIs Xem danh sách khuyến mãi và áp dụng mã voucher cho khách hàng")
public class VoucherController {

    private static final Set<String> ALLOWED_ACTIVE_SORT_FIELDS = Set.of(
            "id", "code", "name", "discountValue", "startDate", "endDate", "createdAt"
    );

    private final VoucherService voucherService;

    @GetMapping("/active")
    @Operation(
            summary = "Lấy danh sách voucher đang hoạt động (Public)",
            description = "Cho phép khách hàng và khách vãng lai tìm nạp các voucher đang active và còn trong thời hạn hiệu lực"
    )
    public ResponseEntity<ApiResponse<PageResponse<VoucherResponse>>> getActiveVouchers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        Sort resolvedSort = SortUtils.parseSort(sort, "createdAt", ALLOWED_ACTIVE_SORT_FIELDS);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        PageResponse<VoucherResponse> response = voucherService.getActiveVouchers(pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách voucher đang hoạt động thành công"));
    }

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Áp dụng voucher vào đơn đặt sân",
            description = "Khách hàng áp dụng mã ưu đãi cho đơn đặt sân của mình (hoặc nhân viên áp cho khách) trước khi thanh toán. " +
                    "Hệ thống khóa bi quan cả dòng booking và dòng voucher để tính chiết khấu và chống race condition."
    )
    public ResponseEntity<ApiResponse<ApplyVoucherResponse>> applyVoucher(
            @Valid @RequestBody ApplyVoucherRequest request
    ) {
        ApplyVoucherResponse response = voucherService.applyVoucher(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Áp dụng voucher thành công"));
    }
}

