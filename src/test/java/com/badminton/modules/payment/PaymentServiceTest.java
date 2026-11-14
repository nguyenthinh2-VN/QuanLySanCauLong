package com.badminton.modules.payment;

import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.dto.request.PaymentFilterRequest;
import com.badminton.modules.payment.dto.request.RefundPaymentRequest;
import com.badminton.modules.payment.dto.response.PaymentDetailResponse;
import com.badminton.modules.payment.dto.response.PaymentResponse;
import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.entity.PaymentType;
import com.badminton.modules.payment.gateway.ChargeResult;
import com.badminton.modules.payment.gateway.PaymentGateway;
import com.badminton.modules.payment.mapper.PaymentMapper;
import com.badminton.modules.payment.repository.PaymentRepository;
import com.badminton.modules.payment.service.impl.PaymentServiceImpl;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

        @Mock
        private PaymentRepository paymentRepository;

        @Mock
        private BookingRepository bookingRepository;

        @Mock
        private PaymentGateway paymentGateway;

        @Mock
        private PaymentMapper paymentMapper;

        @InjectMocks
        private PaymentServiceImpl paymentService;

        private User customer;
        private User otherCustomer;
        private User staff;
        private Booking booking;

        @BeforeEach
        void setUp() {
                Role customerRole = Role.builder().id(3L).name(RoleType.ROLE_CUSTOMER).description("Customer").build();
                Role staffRole = Role.builder().id(2L).name(RoleType.ROLE_STAFF).description("Staff").build();

                customer = User.builder()
                                .email("customer@badminton.com")
                                .fullName("Khách Hàng A")
                                .active(true)
                                .roles(Set.of(customerRole))
                                .build();
                customer.setId(10L);

                otherCustomer = User.builder()
                                .email("other@badminton.com")
                                .fullName("Khách Hàng B")
                                .active(true)
                                .roles(Set.of(customerRole))
                                .build();
                otherCustomer.setId(20L);

                staff = User.builder()
                                .email("staff@badminton.com")
                                .fullName("Nhân Viên Quầy")
                                .active(true)
                                .roles(Set.of(staffRole))
                                .build();
                staff.setId(30L);

                booking = Booking.builder()
                                .user(customer)
                                .totalAmount(new BigDecimal("400000.00"))
                                .status(BookingStatus.PENDING)
                                .build();
                booking.setId(100L);
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
        }

        private void authenticateAs(User user) {
                CustomUserDetails userDetails = new CustomUserDetails(user);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null,
                                userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
        }

        @Test
        @DisplayName("Khách hàng thanh toán FULL cho booking của mình -> thành công 201, amount = 100%, booking sang CONFIRMED")
        void createPayment_full_byOwner_success() {
                authenticateAs(customer);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .note("Thanh toán MoMo")
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
                when(paymentRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(false);
                when(paymentGateway.charge(eq(new BigDecimal("400000.00")), eq("BOOKING-100")))
                                .thenReturn(new ChargeResult(true, "MOCK-TXN-12345", "Thành công"));

                when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
                        Payment p = invocation.getArgument(0);
                        p.setId(1L);
                        return p;
                });

                when(paymentMapper.toResponse(any(Payment.class))).thenAnswer(invocation -> {
                        Payment p = invocation.getArgument(0);
                        return PaymentResponse.builder()
                                        .id(p.getId())
                                        .bookingId(p.getBooking().getId())
                                        .amount(p.getAmount())
                                        .paymentType(p.getPaymentType())
                                        .paymentMethod(p.getPaymentMethod())
                                        .status(p.getStatus())
                                        .transactionRef(p.getTransactionRef())
                                        .build();
                });

                PaymentResponse response = paymentService.createPayment(request);

                assertThat(response).isNotNull();
                assertThat(response.getId()).isEqualTo(1L);
                assertThat(response.getAmount()).isEqualByComparingTo("400000.00");
                assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
                assertThat(response.getTransactionRef()).isEqualTo("MOCK-TXN-12345");
                assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
                verify(bookingRepository).save(booking);
        }

        @Test
        @DisplayName("Nhân viên thanh toán DEPOSIT (50%) hộ khách -> thành công 201, amount = 200,000, booking sang CONFIRMED")
        void createPayment_deposit_byStaff_success() {
                authenticateAs(staff);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.DEPOSIT)
                                .paymentMethod(PaymentMethod.CASH)
                                .note("Đặt cọc 50% tiền mặt tại quầy")
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
                when(paymentRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(false);
                when(paymentGateway.charge(eq(new BigDecimal("200000.00")), eq("BOOKING-100")))
                                .thenReturn(new ChargeResult(true, "MOCK-TXN-67890", "Thành công"));

                when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
                        Payment p = invocation.getArgument(0);
                        p.setId(2L);
                        return p;
                });

                when(paymentMapper.toResponse(any(Payment.class))).thenAnswer(invocation -> {
                        Payment p = invocation.getArgument(0);
                        return PaymentResponse.builder()
                                        .id(p.getId())
                                        .bookingId(p.getBooking().getId())
                                        .amount(p.getAmount())
                                        .paymentType(p.getPaymentType())
                                        .status(p.getStatus())
                                        .build();
                });

                PaymentResponse response = paymentService.createPayment(request);

                assertThat(response.getAmount()).isEqualByComparingTo("200000.00");
                assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
                assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        }

        @Test
        @DisplayName("Thanh toán booking không tồn tại -> ném 404 BOOKING_NOT_FOUND")
        void createPayment_bookingNotFound_throwsAppException() {
                authenticateAs(customer);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(999L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .build();

                when(bookingRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> paymentService.createPayment(request))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BOOKING_NOT_FOUND));

                verify(paymentGateway, never()).charge(any(), any());
        }

        @Test
        @DisplayName("Khách hàng cố tình thanh toán cho booking của người khác -> ném 403 ACCESS_DENIED")
        void createPayment_otherCustomerNotOwner_throwsAccessDenied() {
                authenticateAs(otherCustomer);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));

                assertThatThrownBy(() -> paymentService.createPayment(request))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.ACCESS_DENIED));

                verify(paymentGateway, never()).charge(any(), any());
        }

        @Test
        @DisplayName("Thanh toán booking không ở trạng thái PENDING -> ném 409 BOOKING_NOT_PAYABLE")
        void createPayment_bookingNotPending_throwsBookingNotPayable() {
                authenticateAs(customer);
                booking.setStatus(BookingStatus.CANCELLED);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));

                assertThatThrownBy(() -> paymentService.createPayment(request))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BOOKING_NOT_PAYABLE));

                verify(paymentGateway, never()).charge(any(), any());
        }

        @Test
        @DisplayName("Thanh toán lần 2 khi đơn đã có payment SUCCESS -> ném 409 BOOKING_ALREADY_PAID")
        void createPayment_alreadyPaid_throwsBookingAlreadyPaid() {
                authenticateAs(customer);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
                when(paymentRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(true);

                assertThatThrownBy(() -> paymentService.createPayment(request))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BOOKING_ALREADY_PAID));

                verify(paymentGateway, never()).charge(any(), any());
        }

        @Test
        @DisplayName("Mock gateway trả về thất bại -> ném 400 BAD_REQUEST và lưu payment FAILED")
        void createPayment_gatewayFails_throwsBadRequest() {
                authenticateAs(customer);

                CreatePaymentRequest request = CreatePaymentRequest.builder()
                                .bookingId(100L)
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.E_WALLET)
                                .build();

                when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
                when(paymentRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(false);
                when(paymentGateway.charge(any(), any()))
                                .thenReturn(new ChargeResult(false, null, "Số tiền không hợp lệ"));

                assertThatThrownBy(() -> paymentService.createPayment(request))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BAD_REQUEST));

                verify(paymentRepository).save(any(Payment.class));
                assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING);
        }

        @Test
        @DisplayName("Staff hoàn tiền cho giao dịch SUCCESS -> thành công 200, payment REFUNDED, booking CANCELLED")
        void refundPayment_success_updatesPaymentAndCancelsBooking() {
                booking.setStatus(BookingStatus.CONFIRMED);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .paidAt(LocalDateTime.now())
                                .note("Đã thanh toán trước")
                                .build();
                payment.setId(50L);

                when(paymentRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(payment));
                when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(paymentMapper.toResponse(any(Payment.class))).thenAnswer(invocation -> {
                        Payment p = invocation.getArgument(0);
                        return PaymentResponse.builder()
                                        .id(p.getId())
                                        .status(p.getStatus())
                                        .note(p.getNote())
                                        .build();
                });

                RefundPaymentRequest request = RefundPaymentRequest.builder()
                                .reason("Khách xin hủy trước giờ")
                                .build();

                PaymentResponse response = paymentService.refundPayment(50L, request);

                assertThat(response.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
                assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
                assertThat(payment.getNote()).contains("Lý do hoàn tiền: Khách xin hủy trước giờ");
                assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
                verify(bookingRepository).save(booking);
        }

        @Test
        @DisplayName("Hoàn tiền giao dịch không tồn tại -> ném 404 PAYMENT_NOT_FOUND")
        void refundPayment_paymentNotFound_throwsPaymentNotFound() {
                when(paymentRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> paymentService.refundPayment(999L, null))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.PAYMENT_NOT_FOUND));
        }

        @Test
        @DisplayName("Hoàn tiền giao dịch không ở trạng thái SUCCESS (vd: đã REFUNDED) -> ném 409 REFUND_NOT_ALLOWED")
        void refundPayment_paymentNotSuccess_throwsRefundNotAllowed() {
                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.REFUNDED)
                                .build();
                payment.setId(51L);

                when(paymentRepository.findByIdForUpdate(51L)).thenReturn(Optional.of(payment));

                assertThatThrownBy(() -> paymentService.refundPayment(51L, null))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.REFUND_NOT_ALLOWED));
        }

        @Test
        @DisplayName("Hoàn tiền khi khách đã CHECKED_IN -> ném 409 REFUND_NOT_ALLOWED")
        void refundPayment_bookingAlreadyCheckedIn_throwsRefundNotAllowed() {
                booking.setStatus(BookingStatus.CHECKED_IN);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(52L);

                when(paymentRepository.findByIdForUpdate(52L)).thenReturn(Optional.of(payment));

                assertThatThrownBy(() -> paymentService.refundPayment(52L, null))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.REFUND_NOT_ALLOWED));
        }

        @Test
        @DisplayName("Hoàn tiền khi booking đã COMPLETED -> ném 409 REFUND_NOT_ALLOWED")
        void refundPayment_bookingCompleted_throwsRefundNotAllowed() {
                booking.setStatus(BookingStatus.COMPLETED);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(53L);

                when(paymentRepository.findByIdForUpdate(53L)).thenReturn(Optional.of(payment));

                assertThatThrownBy(() -> paymentService.refundPayment(53L, null))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.REFUND_NOT_ALLOWED));
        }

        // ==================== LỊCH SỬ GIAO DỊCH & HÓA ĐƠN ====================

        @Test
        @DisplayName("getPayments khi fromDate > toDate -> ném 400 BAD_REQUEST")
        void getPayments_invalidDateRange_throwsBadRequest() {
                PaymentFilterRequest filter = PaymentFilterRequest.builder()
                                .fromDate(LocalDate.of(2026, 11, 20))
                                .toDate(LocalDate.of(2026, 11, 10))
                                .build();

                assertThatThrownBy(() -> paymentService.getPayments(filter, 0, 10, "createdAt,desc"))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BAD_REQUEST));
        }

        @Test
        @DisplayName("getPayments hợp lệ -> trả về PageResponse<PaymentResponse>")
        @SuppressWarnings("unchecked")
        void getPayments_validFilter_returnsPageResponse() {
                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .paymentType(PaymentType.FULL)
                                .paymentMethod(PaymentMethod.CASH)
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(70L);

                PaymentResponse mapped = PaymentResponse.builder()
                                .id(70L)
                                .bookingId(booking.getId())
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();

                Page<Payment> page = new PageImpl<>(List.of(payment));
                when(paymentRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
                when(paymentMapper.toResponse(payment)).thenReturn(mapped);

                PaymentFilterRequest filter = PaymentFilterRequest.builder()
                                .status(PaymentStatus.SUCCESS)
                                .fromDate(LocalDate.of(2026, 11, 1))
                                .toDate(LocalDate.of(2026, 11, 30))
                                .build();

                PageResponse<PaymentResponse> result = paymentService.getPayments(filter, 0, 10, "createdAt,desc");

                assertThat(result.getItems()).hasSize(1);
                assertThat(result.getItems().get(0).getId()).isEqualTo(70L);
                assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("getMyPayments khi fromDate > toDate -> ném 400 BAD_REQUEST")
        void getMyPayments_invalidDateRange_throwsBadRequest() {
                authenticateAs(customer);
                PaymentFilterRequest filter = PaymentFilterRequest.builder()
                                .fromDate(LocalDate.of(2026, 11, 20))
                                .toDate(LocalDate.of(2026, 11, 10))
                                .build();

                assertThatThrownBy(() -> paymentService.getMyPayments(filter, 0, 10, "createdAt,desc"))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.BAD_REQUEST));
        }

        @Test
        @DisplayName("getMyPayments cho CUSTOMER -> trả về danh sách giao dịch của chính mình")
        @SuppressWarnings("unchecked")
        void getMyPayments_customer_returnsOwnPaymentsPageResponse() {
                authenticateAs(customer);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(71L);

                PaymentResponse mapped = PaymentResponse.builder()
                                .id(71L)
                                .bookingId(booking.getId())
                                .status(PaymentStatus.SUCCESS)
                                .build();

                Page<Payment> page = new PageImpl<>(List.of(payment));
                when(paymentRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
                when(paymentMapper.toResponse(payment)).thenReturn(mapped);

                PageResponse<PaymentResponse> result = paymentService.getMyPayments(
                                new PaymentFilterRequest(), 0, 10, "createdAt,desc");

                assertThat(result.getItems()).hasSize(1);
                assertThat(result.getItems().get(0).getId()).isEqualTo(71L);
        }

        @Test
        @DisplayName("getPaymentById không tồn tại -> ném 404 PAYMENT_NOT_FOUND")
        void getPaymentById_notFound_throwsPaymentNotFound() {
                authenticateAs(staff);
                when(paymentRepository.findDetailById(999L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> paymentService.getPaymentById(999L))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.PAYMENT_NOT_FOUND));
        }

        @Test
        @DisplayName("getPaymentById: CUSTOMER xem giao dịch của người khác -> ném 403 ACCESS_DENIED")
        void getPaymentById_customerViewsOthersPayment_throwsAccessDenied() {
                authenticateAs(otherCustomer);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(72L);

                when(paymentRepository.findDetailById(72L)).thenReturn(Optional.of(payment));

                assertThatThrownBy(() -> paymentService.getPaymentById(72L))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.ACCESS_DENIED));
        }

        @Test
        @DisplayName("getPaymentById: CUSTOMER xem giao dịch khách vãng lai (user = null) -> ném 403 ACCESS_DENIED")
        void getPaymentById_customerViewsGuestPayment_throwsAccessDenied() {
                authenticateAs(customer);

                Booking guestBooking = Booking.builder()
                                .user(null)
                                .guestName("Khách Lẻ")
                                .guestPhone("0909998888")
                                .status(BookingStatus.CONFIRMED)
                                .totalAmount(new BigDecimal("400000.00"))
                                .build();
                guestBooking.setId(200L);

                Payment payment = Payment.builder()
                                .booking(guestBooking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(73L);

                when(paymentRepository.findDetailById(73L)).thenReturn(Optional.of(payment));

                assertThatThrownBy(() -> paymentService.getPaymentById(73L))
                                .isInstanceOf(AppException.class)
                                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                                                .isEqualTo(ErrorCode.ACCESS_DENIED));
        }

        @Test
        @DisplayName("getPaymentById: CUSTOMER xem hóa đơn của chính mình -> trả về PaymentDetailResponse")
        void getPaymentById_customerViewsOwnPayment_returnsDetailResponse() {
                authenticateAs(customer);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(74L);

                PaymentDetailResponse detail = PaymentDetailResponse.builder()
                                .id(74L)
                                .bookingId(booking.getId())
                                .customerName(customer.getFullName())
                                .build();

                when(paymentRepository.findDetailById(74L)).thenReturn(Optional.of(payment));
                when(paymentMapper.toDetailResponse(payment)).thenReturn(detail);

                PaymentDetailResponse result = paymentService.getPaymentById(74L);

                assertThat(result.getId()).isEqualTo(74L);
                assertThat(result.getCustomerName()).isEqualTo("Khách Hàng A");
        }

        @Test
        @DisplayName("getPaymentById: STAFF xem bất kỳ hóa đơn nào -> trả về PaymentDetailResponse")
        void getPaymentById_staffViewsAnyPayment_returnsDetailResponse() {
                authenticateAs(staff);

                Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(new BigDecimal("400000.00"))
                                .status(PaymentStatus.SUCCESS)
                                .build();
                payment.setId(75L);

                PaymentDetailResponse detail = PaymentDetailResponse.builder()
                                .id(75L)
                                .bookingId(booking.getId())
                                .build();

                when(paymentRepository.findDetailById(75L)).thenReturn(Optional.of(payment));
                when(paymentMapper.toDetailResponse(payment)).thenReturn(detail);

                PaymentDetailResponse result = paymentService.getPaymentById(75L);

                assertThat(result.getId()).isEqualTo(75L);
        }
}
