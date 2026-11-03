package com.badminton.modules.report;

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
import com.badminton.modules.report.repository.projection.DailyCourtOccupancyProjection;
import com.badminton.modules.report.repository.projection.DailyRevenueProjection;
import com.badminton.modules.report.repository.projection.PaymentMethodRevenueProjection;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class ReportRepositoryDataJpaTest {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private CourtComplexRepository complexRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private Court court1;
    private Court court2;
    private Court courtMaint;
    private TimeSlot timeSlot1;
    private TimeSlot timeSlot2;
    private Booking booking1;
    private Booking booking2;

    @BeforeEach
    void setUp() {
        CourtComplex complex = complexRepository.save(CourtComplex.builder()
                .name("Sân Cầu Lông Số 1")
                .address("123 Nguyễn Văn Cừ")
                .status(ComplexStatus.ACTIVE)
                .build());

        court1 = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân A1")
                .status(CourtStatus.AVAILABLE)
                .build());

        court2 = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân A2")
                .status(CourtStatus.AVAILABLE)
                .build());

        courtMaint = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân Bảo Trì")
                .status(CourtStatus.MAINTENANCE)
                .build());

        timeSlot1 = timeSlotRepository.save(TimeSlot.builder()
                .name("Ca 1")
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(8, 0))
                .pricePerHour(new BigDecimal("100000.00"))
                .build());

        timeSlot2 = timeSlotRepository.save(TimeSlot.builder()
                .name("Ca 2")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(9, 0))
                .pricePerHour(new BigDecimal("100000.00"))
                .build());

        booking1 = bookingRepository.save(Booking.builder()
                .court(court1)
                .timeSlot(timeSlot1)
                .bookingDate(LocalDate.of(2026, 11, 1))
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("100000.00"))
                .build());

        booking2 = bookingRepository.save(Booking.builder()
                .court(court1)
                .timeSlot(timeSlot2)
                .bookingDate(LocalDate.of(2026, 11, 1))
                .status(BookingStatus.COMPLETED)
                .totalAmount(new BigDecimal("100000.00"))
                .build());
    }

    @Test
    @DisplayName("Test findDailyRevenueAggregations: lọc đúng SUCCESS và REFUNDED, bỏ qua FAILED")
    void testFindDailyRevenueAggregations() {
        LocalDateTime d1Time1 = LocalDateTime.of(2026, 11, 1, 10, 0);
        LocalDateTime d1Time2 = LocalDateTime.of(2026, 11, 1, 14, 0);
        LocalDateTime d1Time3 = LocalDateTime.of(2026, 11, 1, 18, 0);
        LocalDateTime d2Time = LocalDateTime.of(2026, 11, 2, 9, 30);

        paymentRepository.save(Payment.builder()
                .booking(booking1)
                .amount(new BigDecimal("100000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.SUCCESS)
                .paidAt(d1Time1)
                .transactionRef("TX-001")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking2)
                .amount(new BigDecimal("150000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .paidAt(d1Time2)
                .transactionRef("TX-002")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking1)
                .amount(new BigDecimal("50000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.REFUNDED)
                .paidAt(d1Time3)
                .transactionRef("TX-REFUND-001")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking2)
                .amount(new BigDecimal("80000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.E_WALLET)
                .status(PaymentStatus.FAILED)
                .paidAt(d1Time3)
                .transactionRef("TX-FAIL-001")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking2)
                .amount(new BigDecimal("200000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.E_WALLET)
                .status(PaymentStatus.SUCCESS)
                .paidAt(d2Time)
                .transactionRef("TX-003")
                .build());

        LocalDateTime fromStart = LocalDateTime.of(2026, 11, 1, 0, 0, 0);
        LocalDateTime toEnd = LocalDateTime.of(2026, 11, 2, 23, 59, 59);

        List<DailyRevenueProjection> results = paymentRepository.findDailyRevenueAggregations(
                fromStart, toEnd, List.of(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)
        );

        assertThat(results).hasSize(3);

        DailyRevenueProjection d1Success = results.stream()
                .filter(r -> r.getReportDate().equals(LocalDate.of(2026, 11, 1)) && r.getStatus() == PaymentStatus.SUCCESS)
                .findFirst().orElseThrow();
        assertThat(d1Success.getTotalAmount()).isEqualByComparingTo("250000.00");
        assertThat(d1Success.getTransactionCount()).isEqualTo(2);

        DailyRevenueProjection d1Refund = results.stream()
                .filter(r -> r.getReportDate().equals(LocalDate.of(2026, 11, 1)) && r.getStatus() == PaymentStatus.REFUNDED)
                .findFirst().orElseThrow();
        assertThat(d1Refund.getTotalAmount()).isEqualByComparingTo("50000.00");
        assertThat(d1Refund.getTransactionCount()).isEqualTo(1);

        DailyRevenueProjection d2Success = results.stream()
                .filter(r -> r.getReportDate().equals(LocalDate.of(2026, 11, 2)) && r.getStatus() == PaymentStatus.SUCCESS)
                .findFirst().orElseThrow();
        assertThat(d2Success.getTotalAmount()).isEqualByComparingTo("200000.00");
        assertThat(d2Success.getTransactionCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Test findPaymentMethodRevenueAggregations: chỉ tính SUCCESS group theo phương thức")
    void testFindPaymentMethodRevenueAggregations() {
        LocalDateTime dt = LocalDateTime.of(2026, 11, 1, 12, 0);

        paymentRepository.save(Payment.builder()
                .booking(booking1)
                .amount(new BigDecimal("100000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.SUCCESS)
                .paidAt(dt)
                .transactionRef("TX-M-1")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking2)
                .amount(new BigDecimal("120000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .paidAt(dt)
                .transactionRef("TX-M-2")
                .build());

        paymentRepository.save(Payment.builder()
                .booking(booking1)
                .amount(new BigDecimal("50000.00"))
                .paymentType(PaymentType.FULL)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.REFUNDED)
                .paidAt(dt)
                .transactionRef("TX-M-3")
                .build());

        LocalDateTime fromStart = LocalDateTime.of(2026, 11, 1, 0, 0, 0);
        LocalDateTime toEnd = LocalDateTime.of(2026, 11, 1, 23, 59, 59);

        List<PaymentMethodRevenueProjection> methods = paymentRepository.findPaymentMethodRevenueAggregations(fromStart, toEnd);

        assertThat(methods).hasSize(2);
        PaymentMethodRevenueProjection bank = methods.stream()
                .filter(m -> m.getPaymentMethod() == PaymentMethod.BANK_TRANSFER)
                .findFirst().orElseThrow();
        assertThat(bank.getTotalAmount()).isEqualByComparingTo("100000.00");
        assertThat(bank.getTransactionCount()).isEqualTo(1);

        PaymentMethodRevenueProjection cash = methods.stream()
                .filter(m -> m.getPaymentMethod() == PaymentMethod.CASH)
                .findFirst().orElseThrow();
        assertThat(cash.getTotalAmount()).isEqualByComparingTo("120000.00");
        assertThat(cash.getTransactionCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Test findOccupancyAggregations: tính cả COMPLETED, bỏ qua CANCELLED")
    void testFindOccupancyAggregations() {
        LocalDate date = LocalDate.of(2026, 11, 1);

        bookingRepository.save(Booking.builder()
                .court(court1)
                .timeSlot(timeSlot1)
                .bookingDate(date)
                .status(BookingStatus.CANCELLED)
                .totalAmount(BigDecimal.TEN)
                .build());

        bookingRepository.save(Booking.builder()
                .court(court2)
                .timeSlot(timeSlot1)
                .bookingDate(date)
                .status(BookingStatus.CHECKED_IN)
                .totalAmount(BigDecimal.TEN)
                .build());

        List<DailyCourtOccupancyProjection> list = bookingRepository.findOccupancyAggregations(
                date, date,
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED)
        );

        assertThat(list).hasSize(2);
        DailyCourtOccupancyProjection c1 = list.stream().filter(p -> p.getCourtId().equals(court1.getId())).findFirst().orElseThrow();
        assertThat(c1.getBookedCount()).isEqualTo(2); // booking1 (CONFIRMED) + booking2 (COMPLETED)

        DailyCourtOccupancyProjection c2 = list.stream().filter(p -> p.getCourtId().equals(court2.getId())).findFirst().orElseThrow();
        assertThat(c2.getBookedCount()).isEqualTo(1); // CHECKED_IN

        // Filter by court1
        List<DailyCourtOccupancyProjection> listCourt1 = bookingRepository.findOccupancyAggregationsByCourt(
                date, date, court1.getId(),
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED)
        );
        assertThat(listCourt1).hasSize(1);
        assertThat(listCourt1.getFirst().getBookedCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("Test countByStatus & findByStatus trên CourtRepository")
    void testCourtRepositoryQueries() {
        long availableCount = courtRepository.countByStatus(CourtStatus.AVAILABLE);
        long maintenanceCount = courtRepository.countByStatus(CourtStatus.MAINTENANCE);

        assertThat(availableCount).isEqualTo(2);
        assertThat(maintenanceCount).isEqualTo(1);

        List<Court> availableCourts = courtRepository.findByStatus(CourtStatus.AVAILABLE);
        assertThat(availableCourts).hasSize(2);
    }
}

