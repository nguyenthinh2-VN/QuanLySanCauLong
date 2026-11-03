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
@Schema(description = "Số liệu doanh thu trong từng chu kỳ (ngày, tuần hoặc tháng)")
public class RevenuePeriodBucketResponse {

    @Schema(description = "Nhãn thời gian của chu kỳ (DAY/WEEK: yyyy-MM-dd, MONTH: yyyy-MM)", example = "2026-11-01")
    private String period;

    @Schema(description = "Doanh thu gộp trong chu kỳ", example = "500000.00")
    private BigDecimal grossRevenue;

    @Schema(description = "Số tiền hoàn lại trong chu kỳ", example = "50000.00")
    private BigDecimal refundedAmount;

    @Schema(description = "Doanh thu thuần trong chu kỳ (grossRevenue - refundedAmount)", example = "450000.00")
    private BigDecimal netRevenue;

    @Schema(description = "Số lượng giao dịch thành công", example = "4")
    private long transactionCount;
}

