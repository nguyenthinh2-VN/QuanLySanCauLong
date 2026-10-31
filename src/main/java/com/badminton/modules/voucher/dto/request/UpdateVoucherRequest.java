package com.badminton.modules.voucher.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVoucherRequest {

    @Size(max = 100, message = "Tên voucher tối đa 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả voucher tối đa 500 ký tự")
    private String description;

    @DecimalMin(value = "0.00", message = "Số tiền giảm tối đa không hợp lệ")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00", message = "Giá trị đơn tối thiểu không hợp lệ")
    private BigDecimal minOrderAmount;

    private Integer usageLimit;

    private Integer userUsageLimit;

    private LocalDateTime endDate;

    private Boolean active;
}

