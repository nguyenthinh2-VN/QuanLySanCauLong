package com.badminton.modules.voucher.service.impl;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.dto.response.ApplyVoucherResponse;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.entity.VoucherUsage;
import com.badminton.modules.voucher.mapper.VoucherMapper;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.repository.VoucherUsageRepository;
import com.badminton.modules.voucher.service.VoucherService;
import com.badminton.modules.voucher.strategy.DiscountStrategy;
import com.badminton.modules.voucher.strategy.DiscountStrategyFactory;
import com.badminton.security.SecurityUtils;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleConstants;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DiscountStrategyFactory discountStrategyFactory;
    private final VoucherMapper voucherMapper;

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VoucherResponse> getActiveVouchers(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        Page<Voucher> page = voucherRepository.findActiveVouchers(now, pageable);
        return PageResponse.from(page.map(voucherMapper::toResponse));
    }

    @Override
    public ApplyVoucherResponse applyVoucher(ApplyVoucherRequest request) {
        // 1. Tìm voucher theo mã code
        String normalizedCode = request.getCode().trim().toUpperCase();
        Voucher voucher = voucherRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // 2. Khóa row booking trước mọi guard và trước khi cập nhật totalAmount
        Booking booking = bookingRepository.findByIdForUpdate(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // 3. Khóa row voucher trong cùng transaction để bảo vệ ngân sách phát hành
        Voucher lockedVoucher = voucherRepository.findByIdForUpdate(voucher.getId())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        entityManager.refresh(lockedVoucher);

        // 4. Kiểm tra các business guards theo đúng thứ tự thiết kế:
        // Guard 1: Đơn đặt sân phải ở trạng thái PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.BOOKING_NOT_PAYABLE);
        }

        // Guard 2: Phân quyền - Người gọi là chủ booking hoặc nhân viên STAFF / Quản trị viên ADMIN
        CustomUserDetails userDetails = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
        boolean isOwner = booking.getUser() != null && booking.getUser().getId().equals(userDetails.getId());
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> RoleConstants.ROLE_ADMIN.equals(a.getAuthority())
                        || RoleConstants.ROLE_STAFF.equals(a.getAuthority()));
        if (!isOwner && !isStaffOrAdmin) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Guard 3: Chống áp lặp - Đơn đặt sân chưa từng được áp dụng voucher nào trước đó
        if (voucherUsageRepository.existsByBookingId(booking.getId())) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_APPLIED);
        }

        // Guard 4: Voucher phải đang active và trong thời gian hiệu lực
        LocalDateTime now = LocalDateTime.now();
        if (!lockedVoucher.isActive()) {
            throw new AppException(ErrorCode.VOUCHER_NOT_ACTIVE);
        }
        if (now.isBefore(lockedVoucher.getStartDate())) {
            throw new AppException(ErrorCode.VOUCHER_NOT_STARTED);
        }
        if (now.isAfter(lockedVoucher.getEndDate())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        // Guard 5: Đơn đặt sân phải đạt giá trị tối thiểu (nếu có yêu cầu)
        if (lockedVoucher.getMinOrderAmount() != null
                && booking.getTotalAmount().compareTo(lockedVoucher.getMinOrderAmount()) < 0) {
            throw new AppException(ErrorCode.VOUCHER_MIN_AMOUNT_NOT_MET);
        }

        // Guard 6: Tổng số lượt sử dụng toàn hệ thống chưa vượt quá hạn mức
        if (lockedVoucher.getUsageLimit() != null
                && lockedVoucher.getUsedCount() >= lockedVoucher.getUsageLimit()) {
            throw new AppException(ErrorCode.VOUCHER_USAGE_EXCEEDED);
        }

        // Guard 7: Lượt sử dụng của tài khoản người dùng chưa vượt quá hạn mức cá nhân
        Long targetUserId = booking.getUser() != null ? booking.getUser().getId() : userDetails.getId();
        if (targetUserId != null) {
            long usedCountByUser = voucherUsageRepository.countByVoucherIdAndUserId(lockedVoucher.getId(), targetUserId);
            if (usedCountByUser >= lockedVoucher.getUserUsageLimit()) {
                throw new AppException(ErrorCode.VOUCHER_USER_LIMIT_EXCEEDED);
            }
        }

        // 5. Tính toán số tiền chiết khấu thông qua Strategy Pattern
        BigDecimal originalAmount = booking.getTotalAmount();
        DiscountStrategy strategy = discountStrategyFactory.getStrategy(lockedVoucher.getDiscountType());
        BigDecimal discountAmount = strategy.calculateDiscount(lockedVoucher, originalAmount);
        BigDecimal finalAmount = originalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        // 6. Cập nhật số tiền thanh toán của đơn đặt sân
        booking.setTotalAmount(finalAmount);
        bookingRepository.save(booking);

        // 7. Tạo bản ghi kiểm toán lưu vết sử dụng VoucherUsage
        User usageUser = booking.getUser();
        if (usageUser == null && userDetails.getId() != null) {
            usageUser = userRepository.findById(userDetails.getId()).orElse(null);
        }

        VoucherUsage usage = VoucherUsage.builder()
                .voucher(lockedVoucher)
                .user(usageUser)
                .booking(booking)
                .discountAmount(discountAmount)
                .orderAmount(originalAmount)
                .usedAt(now)
                .build();
        voucherUsageRepository.save(usage);

        // 8. Tăng số lượt sử dụng của voucher
        lockedVoucher.setUsedCount(lockedVoucher.getUsedCount() + 1);
        voucherRepository.save(lockedVoucher);

        // 9. Trả về kết quả áp voucher chi tiết
        return ApplyVoucherResponse.builder()
                .bookingId(booking.getId())
                .voucherCode(lockedVoucher.getCode())
                .voucherName(lockedVoucher.getName())
                .discountType(lockedVoucher.getDiscountType())
                .originalAmount(originalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }
}
