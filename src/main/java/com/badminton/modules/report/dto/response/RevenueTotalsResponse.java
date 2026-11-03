package com.badminton.modules.report.dto.response;

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
@Schema(description = "Tổng kết doanh thu toàn kỳ")
public class RevenueTotalsResponse {

    @Schema(description = "Tổng doanh thu gộp (chỉ tính SUCCESS)", example = "15000000.00")
    private BigDecimal grossRevenue;

    @Schema(description = "Tổng số tiền hoàn lại (REFUNDED)", example = "500000.00")
    private BigDecimal refundedAmount;

    @Schema(description = "Doanh thu thuần (grossRevenue - refundedAmount)", example = "14500000.00")
    private BigDecimal netRevenue;

    @Schema(description = "Tổng số lượng giao dịch thành công", example = "45")
    private long transactionCount;
}

