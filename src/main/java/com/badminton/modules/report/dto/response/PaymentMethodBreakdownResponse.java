package com.badminton.modules.report.dto.response;

import com.badminton.modules.payment.entity.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Doanh thu theo phương thức thanh toán")
public class PaymentMethodBreakdownResponse {

    @Schema(description = "Phương thức thanh toán", example = "BANK_TRANSFER")
    private PaymentMethod paymentMethod;

    @Schema(description = "Doanh thu gộp", example = "8000000.00")
    private BigDecimal grossRevenue;

    @Schema(description = "Số lượng giao dịch thành công", example = "25")
    private long transactionCount;
}

