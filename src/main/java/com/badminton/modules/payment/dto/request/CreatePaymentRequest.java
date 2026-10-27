package com.badminton.modules.payment.dto.request;

import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
@Schema(description = "Yêu cầu thanh toán đơn đặt sân")
public class CreatePaymentRequest {

    @NotNull(message = "ID đơn đặt sân không được để trống")
    @Schema(description = "ID đơn đặt sân cần thanh toán", example = "10")
    private Long bookingId;

    @NotNull(message = "Loại thanh toán không được để trống")
    @Schema(description = "Loại thanh toán: FULL (100%) hoặc DEPOSIT (50%)", example = "FULL")
    private PaymentType paymentType;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    @Schema(description = "Phương thức thanh toán: CASH, BANK_TRANSFER, E_WALLET", example = "E_WALLET")
    private PaymentMethod paymentMethod;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú thanh toán", example = "Khách thanh toán ví điện tử")
    private String note;
}
