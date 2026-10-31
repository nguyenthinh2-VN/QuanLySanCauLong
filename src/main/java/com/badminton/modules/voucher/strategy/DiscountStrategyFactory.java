package com.badminton.modules.voucher.strategy;

import com.badminton.modules.voucher.entity.DiscountType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class DiscountStrategyFactory {

    private final Map<DiscountType, DiscountStrategy> strategies = new EnumMap<>(DiscountType.class);

    public DiscountStrategyFactory(List<DiscountStrategy> strategyList) {
        for (DiscountStrategy strategy : strategyList) {
            strategies.put(strategy.getDiscountType(), strategy);
        }
    }

    public DiscountStrategy getStrategy(DiscountType discountType) {
        DiscountStrategy strategy = strategies.get(discountType);
        if (strategy == null) {
            throw new IllegalArgumentException("Không tìm thấy chiến lược tính chiết khấu cho loại: " + discountType);
        }
        return strategy;
    }
}

