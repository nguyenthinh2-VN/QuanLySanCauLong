package com.badminton.modules.report.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu lọc báo cáo thống kê theo khoảng thời gian")
public class ReportRangeRequest {

    @Schema(description = "Ngày bắt đầu (mặc định to - 29 ngày)", example = "2026-10-05")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate from;

    @Schema(description = "Ngày kết thúc (mặc định hôm nay)", example = "2026-11-03")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate to;

    @Schema(description = "Chế độ gom nhóm thời gian (DAY, WEEK, MONTH), mặc định DAY", example = "DAY")
    @Builder.Default
    private ReportGroupBy groupBy = ReportGroupBy.DAY;

    @Schema(description = "ID của sân cụ thể (chỉ dùng cho báo cáo occupancy)", example = "1")
    private Long courtId;
}

