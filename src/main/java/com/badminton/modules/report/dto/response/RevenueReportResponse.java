package com.badminton.modules.report.dto.response;

import com.badminton.modules.report.dto.request.ReportGroupBy;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Phản hồi báo cáo doanh thu chi tiết")
public class RevenueReportResponse {

    @Schema(description = "Ngày bắt đầu kỳ báo cáo", example = "2026-10-05")
    private LocalDate from;

    @Schema(description = "Ngày kết thúc kỳ báo cáo", example = "2026-11-03")
    private LocalDate to;

    @Schema(description = "Chế độ gom nhóm", example = "DAY")
    private ReportGroupBy groupBy;

    @Schema(description = "Tổng kết số liệu toàn kỳ")
    private RevenueTotalsResponse totals;

    @Schema(description = "Phân tích doanh thu theo từng phương thức thanh toán")
    private List<PaymentMethodBreakdownResponse> byPaymentMethod;

    @Schema(description = "Dòng thời gian doanh thu theo chu kỳ (liền mạch, không đứt đoạn)")
    private List<RevenuePeriodBucketResponse> timeline;
}

