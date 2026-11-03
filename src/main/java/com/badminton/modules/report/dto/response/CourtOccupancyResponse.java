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
@Schema(description = "Tỉ lệ lấp đầy của từng sân")
public class CourtOccupancyResponse {

    @Schema(description = "ID của sân", example = "1")
    private Long courtId;

    @Schema(description = "Tên sân", example = "Sân A1")
    private String courtName;

    @Schema(description = "Số slot đã được đặt trong kỳ", example = "60")
    private long bookedSlots;

    @Schema(description = "Tổng số slot khả dụng trong kỳ (số timeslot * số ngày)", example = "90")
    private long totalSlots;

    @Schema(description = "Tỉ lệ lấp đầy (%) làm tròn 2 chữ số thập phân", example = "66.67")
    private BigDecimal occupancyRate;
}

