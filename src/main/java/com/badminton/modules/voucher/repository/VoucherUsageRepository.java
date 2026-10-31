package com.badminton.modules.voucher.repository;

import com.badminton.modules.voucher.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {

    long countByVoucherIdAndUserId(Long voucherId, Long userId);

    boolean existsByBookingId(Long bookingId);

    Optional<VoucherUsage> findByBookingId(Long bookingId);
}

