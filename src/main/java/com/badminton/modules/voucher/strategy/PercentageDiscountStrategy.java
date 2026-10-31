package com.badminton.modules.voucher.strategy;

import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PercentageDiscountStrategy implements DiscountStrategy {

    @Override
    public DiscountType getDiscountType() {
        return DiscountType.PERCENTAGE;
    }

    @Override
    public BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount) {
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal percentage = voucher.getDiscountValue();
        if (percentage == null || percentage.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // discount = orderAmount * percentage / 100
        BigDecimal discount = orderAmount.multiply(percentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (voucher.getMaxDiscountAmount() != null && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = discount.min(voucher.getMaxDiscountAmount());
        }

        discount = discount.min(orderAmount);
        return discount.max(BigDecimal.ZERO);
    }
}

