package com.badminton.modules.booking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Yêu cầu đổi lịch đặt sân")
public class UpdateBookingRequest {

    @Schema(description = "ID của sân mới (nếu muốn đổi sân)", example = "2")
    private Long courtId;

    @Schema(description = "Ngày đặt sân mới (YYYY-MM-DD)", example = "2026-10-22")
    private LocalDate bookingDate;

    @Schema(description = "ID khung giờ mới", example = "3")
    private Long timeSlotId;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú cập nhật", example = "Đổi sang khung giờ tối")
    private String note;
}
