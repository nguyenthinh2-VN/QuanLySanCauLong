package com.badminton.modules.report.repository.projection;

import com.badminton.modules.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyRevenueProjection {
    LocalDate getReportDate();
    PaymentStatus getStatus();
    BigDecimal getTotalAmount();
    Long getTransactionCount();
}

