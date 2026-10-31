package com.badminton.modules.voucher.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyVoucherRequest {

    @NotNull(message = "ID đơn đặt sân không được để trống")
    private Long bookingId;

    @NotBlank(message = "Mã voucher không được để trống")
    private String code;
}

