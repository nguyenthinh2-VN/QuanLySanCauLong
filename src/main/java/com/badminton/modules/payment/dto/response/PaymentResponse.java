package com.badminton.modules.payment.dto.response;

import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.entity.PaymentType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin phản hồi giao dịch thanh toán")
public class PaymentResponse {

    @Schema(description = "ID giao dịch thanh toán", example = "1")
    private Long id;

    @Schema(description = "ID đơn đặt sân", example = "10")
    private Long bookingId;

    @Schema(description = "Số tiền thanh toán", example = "400000.00")
    private BigDecimal amount;

    @Schema(description = "Loại thanh toán", example = "FULL")
    private PaymentType paymentType;

    @Schema(description = "Phương thức thanh toán", example = "E_WALLET")
    private PaymentMethod paymentMethod;

    @Schema(description = "Trạng thái giao dịch", example = "SUCCESS")
    private PaymentStatus status;

    @Schema(description = "Mã tham chiếu giao dịch cổng thanh toán", example = "MOCK-123e4567-e89b-12d3-a456-426614174000")
    private String transactionRef;

    @Schema(description = "Thời điểm thanh toán thành công", example = "2026-10-22T10:15:30")
    private LocalDateTime paidAt;

    @Schema(description = "Ghi chú", example = "Khách thanh toán ví điện tử")
    private String note;

    @Schema(description = "Thời điểm tạo giao dịch", example = "2026-10-22T10:15:20")
    private LocalDateTime createdAt;

    @Schema(description = "Thời điểm cập nhật", example = "2026-10-22T10:15:30")
    private LocalDateTime updatedAt;
}
