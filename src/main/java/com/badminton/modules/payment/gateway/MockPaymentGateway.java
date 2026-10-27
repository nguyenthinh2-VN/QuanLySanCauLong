package com.badminton.modules.payment.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public ChargeResult charge(BigDecimal amount, String bookingRef) {
        log.info("MockPaymentGateway processing charge: amount={}, bookingRef={}", amount, bookingRef);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("MockPaymentGateway rejected charge: amount is invalid ({})", amount);
            return new ChargeResult(false, null, "Số tiền thanh toán không hợp lệ");
        }

        String transactionRef = "MOCK-" + UUID.randomUUID();
        log.info("MockPaymentGateway charge successful: transactionRef={}", transactionRef);

        return new ChargeResult(true, transactionRef, "Thanh toán giả lập thành công");
    }
}
