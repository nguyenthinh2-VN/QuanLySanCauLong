package com.badminton.modules.payment.service.impl;

import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.dto.request.PaymentFilterRequest;
import com.badminton.modules.payment.dto.request.RefundPaymentRequest;
import com.badminton.modules.payment.dto.response.PaymentDetailResponse;
import com.badminton.modules.payment.dto.response.PaymentResponse;
import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.entity.PaymentType;
import com.badminton.modules.payment.gateway.ChargeResult;
import com.badminton.modules.payment.gateway.PaymentGateway;
import com.badminton.modules.payment.mapper.PaymentMapper;
import com.badminton.modules.payment.repository.PaymentRepository;
import com.badminton.modules.payment.service.PaymentService;
import com.badminton.security.SecurityUtils;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleConstants;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import com.badminton.shared.util.SortUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "amount", "paidAt", "createdAt");

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        CustomUserDetails userDetails = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        // Khóa bi quan (PESSIMISTIC_WRITE) dòng booking để chống race condition
        // double-charge
        Booking booking = bookingRepository.findByIdForUpdate(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Guard: Chỉ chủ booking hoặc STAFF/ADMIN mới được thanh toán
        boolean isOwner = booking.getUser() != null && booking.getUser().getId().equals(userDetails.getId());
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> RoleConstants.ROLE_ADMIN.equals(a.getAuthority())
                        || RoleConstants.ROLE_STAFF.equals(a.getAuthority()));

        if (!isOwner && !isStaffOrAdmin) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Guard: Booking phải ở trạng thái PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.BOOKING_NOT_PAYABLE);
        }

        // Guard: Chống thu tiền 2 lần - kiểm tra đã có payment SUCCESS nào cho booking
        // này chưa
        if (paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_PAID);
        }

        // Tính amount server-side từ booking.totalAmount (không nhận amount từ client)
        BigDecimal amount;
        if (request.getPaymentType() == PaymentType.FULL) {
            amount = booking.getTotalAmount();
        } else if (request.getPaymentType() == PaymentType.DEPOSIT) {
            amount = booking.getTotalAmount()
                    .multiply(BigDecimal.valueOf(0.5))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            throw new AppException(ErrorCode.BAD_REQUEST, "Loại thanh toán không được hỗ trợ");
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(amount)
                .paymentType(request.getPaymentType())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .note(request.getNote())
                .build();

        ChargeResult chargeResult = paymentGateway.charge(amount, "BOOKING-" + booking.getId());
        if (!chargeResult.success()) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new AppException(ErrorCode.BAD_REQUEST, chargeResult.message());
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionRef(chargeResult.transactionRef());
        Payment savedPayment = paymentRepository.save(payment);

        // Chuyển booking từ PENDING sang CONFIRMED đồng bộ trong cùng transaction
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Payment created successfully: id={}, bookingId={}, amount={}, type={}, method={}, ref={}",
                savedPayment.getId(), booking.getId(), amount, request.getPaymentType(), request.getPaymentMethod(),
                savedPayment.getTransactionRef());

        return paymentMapper.toResponse(savedPayment);
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, RefundPaymentRequest request) {
        // Khóa bi quan (PESSIMISTIC_WRITE) dòng payment để chống race condition
        // concurrent refund
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        // Guard: Payment phải ở trạng thái SUCCESS mới được refund
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new AppException(ErrorCode.REFUND_NOT_ALLOWED,
                    "Chỉ có thể hoàn tiền các giao dịch đã thanh toán thành công");
        }

        // Guard: Booking chưa được CHECKED_IN hoặc COMPLETED
        Booking booking = payment.getBooking();
        if (booking.getStatus() == BookingStatus.CHECKED_IN || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new AppException(ErrorCode.REFUND_NOT_ALLOWED,
                    "Không thể hoàn tiền đơn đặt sân khi khách đã nhận sân hoặc đã hoàn tất");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        if (request != null && StringUtils.hasText(request.getReason())) {
            String note = payment.getNote();
            String refundNote = "Lý do hoàn tiền: " + request.getReason().trim();
            payment.setNote(StringUtils.hasText(note) ? note + " | " + refundNote : refundNote);
        }
        Payment savedPayment = paymentRepository.save(payment);

        // Chuyển booking sang CANCELLED (soft-cancel, giữ row)
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        log.info("Payment refunded successfully: paymentId={}, bookingId={}, amount={}, reason={}",
                savedPayment.getId(), booking.getId(), savedPayment.getAmount(),
                request != null ? request.getReason() : null);

        return paymentMapper.toResponse(savedPayment);
    }

    @Override
    public PageResponse<PaymentResponse> getPayments(PaymentFilterRequest filter, int page, int size, String sort) {
        validateDateRange(filter);
        Sort parsedSort = SortUtils.parseSort(sort, "createdAt", Sort.Direction.DESC, ALLOWED_SORT_FIELDS);
        Pageable pageable = PageRequest.of(page, size, parsedSort);
        Page<PaymentResponse> result = paymentRepository
                .findAll(buildSpecification(filter, null), pageable)
                .map(paymentMapper::toResponse);
        return PageResponse.from(result);
    }

    @Override
    public PageResponse<PaymentResponse> getMyPayments(PaymentFilterRequest filter, int page, int size, String sort) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
        validateDateRange(filter);
        Sort parsedSort = SortUtils.parseSort(sort, "createdAt", Sort.Direction.DESC, ALLOWED_SORT_FIELDS);
        Pageable pageable = PageRequest.of(page, size, parsedSort);
        Page<PaymentResponse> result = paymentRepository
                .findAll(buildSpecification(filter, currentUser.getId()), pageable)
                .map(paymentMapper::toResponse);
        return PageResponse.from(result);
    }

    @Override
    public PaymentDetailResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findDetailById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
        boolean isStaffOrAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> RoleConstants.ROLE_ADMIN.equals(a.getAuthority())
                        || RoleConstants.ROLE_STAFF.equals(a.getAuthority()));

        if (!isStaffOrAdmin) {
            if (payment.getBooking().getUser() == null
                    || !payment.getBooking().getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.ACCESS_DENIED,
                        "Bạn không có quyền xem hóa đơn giao dịch này");
            }
        }

        return paymentMapper.toDetailResponse(payment);
    }

    private void validateDateRange(PaymentFilterRequest filter) {
        if (filter != null && filter.getFromDate() != null && filter.getToDate() != null
                && filter.getFromDate().isAfter(filter.getToDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày bắt đầu không được sau ngày kết thúc");
        }
    }

    private Specification<Payment> buildSpecification(PaymentFilterRequest filter, Long ownerUserId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (ownerUserId != null) {
                predicates.add(cb.equal(root.get("booking").get("user").get("id"), ownerUserId));
            }
            if (filter != null) {
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                if (filter.getPaymentMethod() != null) {
                    predicates.add(cb.equal(root.get("paymentMethod"), filter.getPaymentMethod()));
                }
                if (filter.getBookingId() != null) {
                    predicates.add(cb.equal(root.get("booking").get("id"), filter.getBookingId()));
                }
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            root.get("createdAt"),
                            filter.getFromDate().atStartOfDay()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(
                            root.get("createdAt"),
                            filter.getToDate().atTime(LocalTime.MAX)));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
