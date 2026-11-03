package com.badminton.modules.report.repository.projection;

import com.badminton.modules.payment.entity.PaymentMethod;

import java.math.BigDecimal;

public interface PaymentMethodRevenueProjection {
    PaymentMethod getPaymentMethod();
    BigDecimal getTotalAmount();
    Long getTransactionCount();
}

