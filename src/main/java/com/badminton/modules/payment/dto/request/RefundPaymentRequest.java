package com.badminton.modules.payment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Yêu cầu hoàn tiền giao dịch")
public class RefundPaymentRequest {

    @Size(max = 500, message = "Lý do hoàn tiền không được vượt quá 500 ký tự")
    @Schema(description = "Lý do hoàn tiền", example = "Khách bận việc đột xuất xin hủy sân trước giờ")
    private String reason;
}
