package com.badminton.modules.court.dto.request;

import com.badminton.modules.court.entity.ComplexStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class UpdateComplexRequest {

    @NotBlank(message = "Tên cụm sân không được để trống")
    @Size(max = 150, message = "Tên cụm sân tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Địa chỉ cụm sân không được để trống")
    private String address;

    @Pattern(regexp = "^$|^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @NotNull(message = "Trạng thái cụm sân không được để trống")
    private ComplexStatus status;
}
