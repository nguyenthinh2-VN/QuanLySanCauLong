package com.badminton.modules.payment;

import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.dto.request.RefundPaymentRequest;
import com.badminton.modules.payment.dto.response.PaymentResponse;
import com.badminton.modules.payment.service.PaymentService;
import com.badminton.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Quản lý thanh toán và hoàn tiền đơn đặt sân")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Thanh toán đơn đặt sân",
            description = "Thanh toán cho đơn đặt sân của chính mình hoặc nhân viên quầy/Admin thanh toán cho khách hàng. " +
                    "Hỗ trợ FULL (100%) hoặc DEPOSIT (50%). Số tiền được tính toán tại server từ booking.totalAmount. " +
                    "Thanh toán thành công sẽ chuyển trạng thái đơn đặt sân từ PENDING sang CONFIRMED."
    )
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thanh toán thành công"));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Hoàn tiền giao dịch thanh toán",
            description = "Dành riêng cho Nhân viên Lễ tân và Quản trị viên. Chuyển trạng thái giao dịch sang REFUNDED " +
                    "đồng thời hủy đơn đặt sân tương ứng (booking -> CANCELLED) nếu khách chưa vào sân."
    )
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) RefundPaymentRequest request
    ) {
        PaymentResponse response = paymentService.refundPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Hoàn tiền giao dịch thành công"));
    }
}
