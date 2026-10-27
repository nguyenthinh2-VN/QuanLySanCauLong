package com.badminton.modules.payment;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.payment.entity.Payment;
import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.entity.PaymentType;
import com.badminton.modules.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class PaymentRepositoryDataJpaTest {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private CourtComplexRepository courtComplexRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private UserRepository userRepository;

    private Booking booking1;
    private Booking booking2;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .email("test.payment@badminton.com")
                .fullName("Người Chơi Test")
                .phone("0912345678")
                .password("encoded_pass")
                .active(true)
                .build();
        user = userRepository.save(user);

        CourtComplex complex = CourtComplex.builder()
                .name("Cụm Sân Test Payment")
                .address("123 Cầu Giấy")
                .phone("0988776655")
                .status(ComplexStatus.ACTIVE)
                .build();
        complex = courtComplexRepository.save(complex);

        Court court = Court.builder()
                .complex(complex)
                .name("Sân 1")
                .status(CourtStatus.AVAILABLE)
                .build();
        court = courtRepository.save(court);

        TimeSlot timeSlot = TimeSlot.builder()
                .name("Sáng 08:00 - 10:00")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .pricePerHour(new BigDecimal("100000.00"))
                .build();
        timeSlot = timeSlotRepository.save(timeSlot);

        booking1 = Booking.builder()
                .user(user)
                .court(court)
                .timeSlot(timeSlot)
                .bookingDate(LocalDate.now().plusDays(2))
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("200000.00"))
                .build();
        booking1 = bookingRepository.save(booking1);

        booking2 = Booking.builder()
                .user(user)
                .court(court)
                .timeSlot(timeSlot)
                .bookingDate(LocalDate.now().plusDays(3))
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("200000.00"))
                .build();
        booking2 = bookingRepository.save(booking2);

        Payment successfulPayment = Payment.builder()
                .booking(booking1)
                .amount(new BigDecimal("200000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.E_WALLET)
                .status(PaymentStatus.SUCCESS)
                .transactionRef("MOCK-TXN-112233")
                .paidAt(LocalDateTime.now())
                .build();
        paymentRepository.save(successfulPayment);
    }

    @Test
    @DisplayName("existsByBookingIdAndStatus trả về true khi đã có payment SUCCESS cho booking")
    void existsByBookingIdAndStatus_whenSuccessPaymentExists_returnsTrue() {
        boolean exists = paymentRepository.existsByBookingIdAndStatus(booking1.getId(), PaymentStatus.SUCCESS);
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("existsByBookingIdAndStatus trả về false khi tìm status khác hoặc booking chưa có payment SUCCESS")
    void existsByBookingIdAndStatus_whenNoMatchingStatusOrBooking_returnsFalse() {
        boolean existsFailedOnBooking1 = paymentRepository.existsByBookingIdAndStatus(booking1.getId(), PaymentStatus.FAILED);
        assertThat(existsFailedOnBooking1).isFalse();

        boolean existsSuccessOnBooking2 = paymentRepository.existsByBookingIdAndStatus(booking2.getId(), PaymentStatus.SUCCESS);
        assertThat(existsSuccessOnBooking2).isFalse();
    }
}
