package com.badminton.modules.report.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Phản hồi báo cáo tỉ lệ lấp đầy sân")
public class OccupancyReportResponse {

    @Schema(description = "Ngày bắt đầu kỳ báo cáo", example = "2026-10-05")
    private LocalDate from;

    @Schema(description = "Ngày kết thúc kỳ báo cáo", example = "2026-11-03")
    private LocalDate to;

    @Schema(description = "Tỉ lệ lấp đầy tổng thể toàn kỳ (%)", example = "65.50")
    private BigDecimal overallRate;

    @Schema(description = "Tổng số slot đã được đặt trong kỳ", example = "120")
    private long bookedSlots;

    @Schema(description = "Tổng số slot khả dụng trong kỳ", example = "180")
    private long totalSlots;

    @Schema(description = "Phân tích tỉ lệ lấp đầy theo từng sân")
    private List<CourtOccupancyResponse> byCourt;

    @Schema(description = "Dòng thời gian lấp đầy theo từng ngày (đầy đủ các ngày trong kỳ)")
    private List<DailyOccupancyResponse> daily;
}

