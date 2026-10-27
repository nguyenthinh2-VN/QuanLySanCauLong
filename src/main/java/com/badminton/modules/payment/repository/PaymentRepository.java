package com.badminton.modules.payment.repository;

import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);
}
