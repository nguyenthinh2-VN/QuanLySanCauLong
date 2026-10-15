package com.badminton.modules.court.dto.request;

import com.badminton.modules.court.entity.CourtStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourtRequest {

    @NotBlank(message = "Tên sân không được để trống")
    @Size(max = 100, message = "Tên sân tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Trạng thái sân không được để trống")
    private CourtStatus status;
}
