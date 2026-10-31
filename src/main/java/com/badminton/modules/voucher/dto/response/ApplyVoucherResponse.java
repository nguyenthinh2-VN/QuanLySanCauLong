package com.badminton.modules.voucher.dto.response;

import com.badminton.modules.voucher.entity.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyVoucherResponse {

    private Long bookingId;
    private String voucherCode;
    private String voucherName;
    private DiscountType discountType;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
}

