package com.badminton.modules.payment.gateway;

public record ChargeResult(
        boolean success,
        String transactionRef,
        String message
) {
}
