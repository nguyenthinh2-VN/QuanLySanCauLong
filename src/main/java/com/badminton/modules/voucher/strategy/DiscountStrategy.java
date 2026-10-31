package com.badminton.modules.voucher.strategy;

import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;

import java.math.BigDecimal;

public interface DiscountStrategy {

    DiscountType getDiscountType();

    BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount);
}

