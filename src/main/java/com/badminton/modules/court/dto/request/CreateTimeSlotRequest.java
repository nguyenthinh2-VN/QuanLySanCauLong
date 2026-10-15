package com.badminton.modules.court.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTimeSlotRequest {

    @NotBlank(message = "Tên khung giờ không được để trống")
    @Size(max = 100, message = "Tên khung giờ tối đa 100 ký tự")
    @Schema(example = "Sáng 06:00–12:00")
    private String name;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(type = "string", example = "06:00:00")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(type = "string", example = "12:00:00")
    private LocalTime endTime;

    @NotNull(message = "Giá thuê mỗi giờ không được để trống")
    @DecimalMin(value = "0", message = "Giá thuê mỗi giờ không được âm")
    @Schema(example = "80000")
    private BigDecimal pricePerHour;
}
