package com.badminton.modules.booking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu đặt lịch cố định hàng tuần (Recurring)")
public class CreateRecurringBookingRequest {

    @NotNull(message = "ID sân không được để trống")
    @Schema(description = "ID của sân cầu lông cần đặt", example = "1")
    private Long courtId;

    @NotNull(message = "ID khung giờ không được để trống")
    @Schema(description = "ID của khung giờ cần đặt", example = "3")
    private Long timeSlotId;

    @NotNull(message = "Thứ trong tuần không được để trống")
    @Schema(description = "Thứ trong tuần cần đặt lặp (MONDAY đến SUNDAY)", example = "TUESDAY")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    @Schema(description = "Ngày bắt đầu tính lịch lặp (YYYY-MM-DD)", example = "2026-10-20")
    private LocalDate startDate;

    @NotNull(message = "Số tuần đặt lặp không được để trống")
    @Min(value = 1, message = "Số tuần đặt lặp tối thiểu là 1 tuần")
    @Max(value = 12, message = "Số tuần đặt lặp tối đa là 12 tuần")
    @Schema(description = "Số tuần muốn đặt lặp (1 đến 12 tuần)", example = "4")
    private Integer weeks;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú cho chuỗi đơn", example = "Đặt cố định sinh hoạt câu lạc bộ")
    private String note;
}
