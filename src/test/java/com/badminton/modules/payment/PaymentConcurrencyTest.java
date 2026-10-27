package com.badminton.modules.payment;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.entity.PaymentType;
import com.badminton.modules.payment.repository.PaymentRepository;
import com.badminton.modules.payment.service.PaymentService;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PaymentConcurrencyTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private UserRepository userRepository;

    private User customer;
    private Booking booking;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();

        customer = userRepository.findByEmail("customer@badminton.com")
                .orElseThrow();

        Court court = courtRepository.findAll().stream()
                .filter(c -> c.getStatus() == CourtStatus.AVAILABLE)
                .findFirst()
                .orElseThrow();

        TimeSlot slot = timeSlotRepository.findAll().stream()
                .findFirst()
                .orElseThrow();

        booking = bookingRepository.save(Booking.builder()
                .user(customer)
                .court(court)
                .timeSlot(slot)
                .bookingDate(LocalDate.now().plusDays(2))
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("300000.00"))
                .note("Đơn đặt chờ thanh toán")
                .build());
    }

    private void authenticateAs(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null,
                userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("2 luồng đồng thời thanh toán 1 booking PENDING -> Khóa bi quan (pessimistic lock) bảo đảm đúng 1 luồng thành công (201), luồng còn lại bị từ chối (409)")
    void concurrentPayment_onlyOneSucceeds_preventsDoubleCharge() throws InterruptedException {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        CreatePaymentRequest request = CreatePaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.E_WALLET)
                .note("Thanh toán ví điện tử song song")
                .build();

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                authenticateAs(customer);
                readyLatch.countDown();
                try {
                    startLatch.await();
                    paymentService.createPayment(request);
                    successCount.incrementAndGet();
                } catch (AppException ex) {
                    if (ex.getErrorCode() == ErrorCode.BOOKING_NOT_PAYABLE
                            || ex.getErrorCode() == ErrorCode.BOOKING_ALREADY_PAID) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // unexpected exception
                } finally {
                    SecurityContextHolder.clearContext();
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Khẳng định: Chính xác 1 giao dịch thành công và 1 giao dịch bị chặn
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);

        // Khẳng định DB: Chỉ có đúng 1 bản ghi payment SUCCESS được ghi nhận
        List<Payment> payments = paymentRepository.findAll();
        assertThat(payments).hasSize(1);
        assertThat(payments.get(0).getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payments.get(0).getBooking().getId()).isEqualTo(booking.getId());

        // Khẳng định Booking: Đã được chuyển sang CONFIRMED
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updatedBooking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
    }
}
