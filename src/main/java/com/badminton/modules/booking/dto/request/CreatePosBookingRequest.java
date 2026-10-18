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
@Schema(description = "Yêu cầu đặt sân trực tiếp tại quầy (POS)")
public class CreatePosBookingRequest {

    @NotNull(message = "ID sân không được để trống")
    @Schema(description = "ID của sân cầu lông cần đặt", example = "1")
    private Long courtId;

    @NotNull(message = "Ngày đặt sân không được để trống")
    @Schema(description = "Ngày đặt sân (YYYY-MM-DD)", example = "2026-10-25")
    private LocalDate bookingDate;

    @NotNull(message = "ID khung giờ không được để trống")
    @Schema(description = "ID khung giờ cần đặt", example = "2")
    private Long timeSlotId;

    @Schema(description = "ID của user nếu khách đã có tài khoản (XOR với guestName + guestPhone)", example = "5")
    private Long userId;

    @Size(max = 100, message = "Tên khách vãng lai không được vượt quá 100 ký tự")
    @Schema(description = "Họ và tên khách vãng lai", example = "Nguyễn Văn Khách")
    private String guestName;

    @Size(max = 20, message = "Số điện thoại khách vãng lai không được vượt quá 20 ký tự")
    @Schema(description = "Số điện thoại liên hệ của khách vãng lai", example = "0987654321")
    private String guestPhone;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú thêm cho đơn", example = "Khách đã thanh toán tiền mặt tại quầy")
    private String note;
}
