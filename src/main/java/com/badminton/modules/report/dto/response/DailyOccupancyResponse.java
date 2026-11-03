package com.badminton.modules.report.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Tỉ lệ lấp đầy sân theo từng ngày trong kỳ")
public class DailyOccupancyResponse {

    @Schema(description = "Ngày thống kê", example = "2026-11-01")
    private LocalDate date;

    @Schema(description = "Số slot đã được đặt trong ngày", example = "4")
    private long bookedSlots;

    @Schema(description = "Tổng số slot khả dụng trong ngày (số sân * số timeslot)", example = "6")
    private long totalSlots;

    @Schema(description = "Tỉ lệ lấp đầy (%) trong ngày", example = "66.67")
    private BigDecimal occupancyRate;
}

