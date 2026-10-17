package com.badminton.modules.booking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu đặt sân online")
public class CreateBookingRequest {

    @NotNull(message = "ID sân không được để trống")
    @Schema(description = "ID của sân cầu lông cần đặt", example = "1")
    private Long courtId;

    @NotNull(message = "Ngày đặt sân không được để trống")
    @Schema(description = "Ngày đặt sân (YYYY-MM-DD)", example = "2026-10-20")
    private LocalDate bookingDate;

    @NotNull(message = "ID khung giờ không được để trống")
    @Schema(description = "ID của khung giờ cần đặt", example = "2")
    private Long timeSlotId;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú cho đơn đặt sân (tối đa 500 ký tự)", example = "Cần thuê thêm 2 vợt")
    private String note;
}
