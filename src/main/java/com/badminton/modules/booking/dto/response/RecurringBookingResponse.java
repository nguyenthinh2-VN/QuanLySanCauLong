package com.badminton.modules.booking.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Phản hồi kết quả đặt lịch cố định hàng tuần")
public class RecurringBookingResponse {

    @Schema(description = "Số lượng đơn đặt sân đã tạo thành công", example = "4")
    private int createdCount;

    @Schema(description = "Danh sách các đơn đặt sân con đã tạo")
    private List<BookingResponse> bookings;
}
