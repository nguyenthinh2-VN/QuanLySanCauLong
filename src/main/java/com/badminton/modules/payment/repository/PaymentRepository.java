package com.badminton.modules.payment.repository;

import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.report.repository.projection.DailyRevenueProjection;
import com.badminton.modules.report.repository.projection.PaymentMethodRevenueProjection;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT CAST(p.paidAt AS LocalDate) AS reportDate, p.status AS status, SUM(p.amount) AS totalAmount, COUNT(p) AS transactionCount " +
            "FROM Payment p " +
            "WHERE p.paidAt >= :fromStart AND p.paidAt <= :toEnd " +
            "AND p.status IN :statuses " +
            "GROUP BY CAST(p.paidAt AS LocalDate), p.status")
    List<DailyRevenueProjection> findDailyRevenueAggregations(
            @Param("fromStart") LocalDateTime fromStart,
            @Param("toEnd") LocalDateTime toEnd,
            @Param("statuses") Collection<PaymentStatus> statuses
    );

    @Query("SELECT p.paymentMethod AS paymentMethod, SUM(p.amount) AS totalAmount, COUNT(p) AS transactionCount " +
            "FROM Payment p " +
            "WHERE p.paidAt >= :fromStart AND p.paidAt <= :toEnd " +
            "AND p.status = com.badminton.modules.payment.entity.PaymentStatus.SUCCESS " +
            "GROUP BY p.paymentMethod")
    List<PaymentMethodRevenueProjection> findPaymentMethodRevenueAggregations(
            @Param("fromStart") LocalDateTime fromStart,
            @Param("toEnd") LocalDateTime toEnd
    );
}
