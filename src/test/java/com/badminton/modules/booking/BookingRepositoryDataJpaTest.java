package com.badminton.modules.booking;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class BookingRepositoryDataJpaTest {

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

    private User user;
    private Court court1;
    private Court court2;
    private TimeSlot slot1;
    private TimeSlot slot2;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testDate = LocalDate.now().plusDays(2);

        user = User.builder()
                .email("testcustomer@badminton.com")
                .password("encoded_pass")
                .fullName("Test Customer")
                .phone("0901234567")
                .active(true)
                .build();
        user = userRepository.save(user);

        CourtComplex complex = CourtComplex.builder()
                .name("Cụm Test H2")
                .address("Số 1 Test")
                .status(ComplexStatus.ACTIVE)
                .build();
        complex = courtComplexRepository.save(complex);

        court1 = Court.builder()
                .complex(complex)
                .name("Sân 1")
                .status(CourtStatus.AVAILABLE)
                .build();
        court1 = courtRepository.save(court1);

        court2 = Court.builder()
                .complex(complex)
                .name("Sân 2")
                .status(CourtStatus.AVAILABLE)
                .build();
        court2 = courtRepository.save(court2);

        slot1 = TimeSlot.builder()
                .name("Khung Sáng")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(BigDecimal.valueOf(100000))
                .build();
        slot1 = timeSlotRepository.save(slot1);

        slot2 = TimeSlot.builder()
                .name("Khung Chiều")
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(17, 0))
                .pricePerHour(BigDecimal.valueOf(120000))
                .build();
        slot2 = timeSlotRepository.save(slot2);
    }

    @Test
    @DisplayName("existsActiveBooking trả về true khi có booking PENDING, CONFIRMED, CHECKED_IN")
    void existsActiveBooking_returnsTrueForActiveStatuses() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court1)
                .bookingDate(testDate)
                .timeSlot(slot1)
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(400000))
                .build();
        bookingRepository.save(booking);

        boolean existsPending = bookingRepository.existsActiveBooking(court1.getId(), testDate, slot1.getId());
        assertThat(existsPending).isTrue();

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
        boolean existsConfirmed = bookingRepository.existsActiveBooking(court1.getId(), testDate, slot1.getId());
        assertThat(existsConfirmed).isTrue();

        booking.setStatus(BookingStatus.CHECKED_IN);
        bookingRepository.save(booking);
        boolean existsCheckedIn = bookingRepository.existsActiveBooking(court1.getId(), testDate, slot1.getId());
        assertThat(existsCheckedIn).isTrue();
    }

    @Test
    @DisplayName("existsActiveBooking trả về false khi đơn bị CANCELLED hoặc COMPLETED")
    void existsActiveBooking_returnsFalseForCancelledOrCompleted() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court1)
                .bookingDate(testDate)
                .timeSlot(slot1)
                .status(BookingStatus.CANCELLED)
                .totalAmount(BigDecimal.valueOf(400000))
                .build();
        bookingRepository.save(booking);

        boolean existsCancelled = bookingRepository.existsActiveBooking(court1.getId(), testDate, slot1.getId());
        assertThat(existsCancelled).isFalse();

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);
        boolean existsCompleted = bookingRepository.existsActiveBooking(court1.getId(), testDate, slot1.getId());
        assertThat(existsCompleted).isFalse();
    }

    @Test
    @DisplayName("existsActiveBookingExcludingId loại trừ chính đơn đang đổi lịch")
    void existsActiveBookingExcludingId_excludesSelf() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court1)
                .bookingDate(testDate)
                .timeSlot(slot1)
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(400000))
                .build();
        Booking saved = bookingRepository.save(booking);

        // Exclude chính booking này -> false
        boolean conflictWithSelf = bookingRepository.existsActiveBookingExcludingId(
                court1.getId(), testDate, slot1.getId(), saved.getId()
        );
        assertThat(conflictWithSelf).isFalse();

        // Tạo đơn thứ 2 chiếm slot2
        Booking booking2 = Booking.builder()
                .user(user)
                .court(court1)
                .bookingDate(testDate)
                .timeSlot(slot2)
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(480000))
                .build();
        bookingRepository.save(booking2);

        // Đơn 1 muốn đổi sang slot2 -> xung đột với đơn 2
        boolean conflictWithOther = bookingRepository.existsActiveBookingExcludingId(
                court1.getId(), testDate, slot2.getId(), saved.getId()
        );
        assertThat(conflictWithOther).isTrue();
    }

    @Test
    @DisplayName("findActiveBookingsByDateAndCourtIds chỉ trả về các booking còn hiệu lực")
    void findActiveBookingsByDateAndCourtIds_returnsOnlyActive() {
        Booking activeBooking = Booking.builder()
                .user(user)
                .court(court1)
                .bookingDate(testDate)
                .timeSlot(slot1)
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(400000))
                .build();
        bookingRepository.save(activeBooking);

        Booking cancelledBooking = Booking.builder()
                .user(user)
                .court(court2)
                .bookingDate(testDate)
                .timeSlot(slot2)
                .status(BookingStatus.CANCELLED)
                .totalAmount(BigDecimal.valueOf(480000))
                .build();
        bookingRepository.save(cancelledBooking);

        List<Booking> activeList = bookingRepository.findActiveBookingsByDateAndCourtIds(
                testDate, List.of(court1.getId(), court2.getId())
        );

        assertThat(activeList).hasSize(1);
        assertThat(activeList.get(0).getId()).isEqualTo(activeBooking.getId());
    }
}
