package com.badminton.modules.payment.gateway;

import java.math.BigDecimal;

public interface PaymentGateway {

    ChargeResult charge(BigDecimal amount, String bookingRef);
}
