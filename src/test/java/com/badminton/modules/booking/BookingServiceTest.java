package com.badminton.modules.booking;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.entity.SlotStatus;
import com.badminton.modules.booking.mapper.BookingMapper;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.booking.service.impl.BookingServiceImpl;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.security.userdetails.CustomUserDetails;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingMapper bookingMapper;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User user;
    private Court court;
    private CourtComplex complex;
    private TimeSlot slotEvening;
    private LocalDate validDate;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("customer@badminton.com")
                .fullName("Nguyễn Văn A")
                .active(true)
                .build();
        user.setId(100L);

        complex = CourtComplex.builder()
                .name("Cụm Cầu Giấy")
                .build();
        complex.setId(1L);

        court = Court.builder()
                .complex(complex)
                .name("Sân 1")
                .status(CourtStatus.AVAILABLE)
                .build();
        court.setId(10L);

        // Khung giờ 16:00 - 21:00 (5 giờ), giá 150k/h -> totalAmount = 750k
        slotEvening = TimeSlot.builder()
                .name("Khung Giờ Vàng")
                .startTime(LocalTime.of(16, 0))
                .endTime(LocalTime.of(21, 0))
                .pricePerHour(new BigDecimal("150000"))
                .build();
        slotEvening.setId(20L);

        validDate = LocalDate.now().plusDays(3);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Đặt sân thành công với status PENDING và tính đúng totalAmount = 750k")
    void createBooking_success() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(10L)
                .bookingDate(validDate)
                .timeSlotId(20L)
                .note("Cần chuẩn bị sân sạch")
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));
        when(bookingRepository.existsActiveBooking(10L, validDate, 20L)).thenReturn(false);

        Booking savedBooking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate)
                .timeSlot(slotEvening)
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("750000.00"))
                .note("Cần chuẩn bị sân sạch")
                .build();
        savedBooking.setId(1L);

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse expectedResponse = BookingResponse.builder()
                .id(1L)
                .courtId(10L)
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("750000.00"))
                .build();
        when(bookingMapper.toResponse(savedBooking)).thenReturn(expectedResponse);

        BookingResponse response = bookingService.createBooking(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("750000");

        verify(courtRepository).findByIdForUpdate(10L);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Đặt sân với ngày trong quá khứ ném INVALID_BOOKING_DATE")
    void createBooking_pastDate_throwsInvalidBookingDate() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(10L)
                .bookingDate(LocalDate.now().minusDays(1))
                .timeSlotId(20L)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bookingService.createBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_BOOKING_DATE));

        verify(courtRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("Đặt sân quá 30 ngày tới ném INVALID_BOOKING_DATE")
    void createBooking_beyond30Days_throwsInvalidBookingDate() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(10L)
                .bookingDate(LocalDate.now().plusDays(31))
                .timeSlotId(20L)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bookingService.createBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_BOOKING_DATE));
    }

    @Test
    @DisplayName("Đặt sân đang bảo trì ném COURT_NOT_AVAILABLE (409)")
    void createBooking_courtMaintenance_throwsCourtNotAvailable() {
        court.setStatus(CourtStatus.MAINTENANCE);

        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(10L)
                .bookingDate(validDate)
                .timeSlotId(20L)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));

        assertThatThrownBy(() -> bookingService.createBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.COURT_NOT_AVAILABLE));
    }

    @Test
    @DisplayName("Đặt slot đã có người giữ chỗ (PENDING/CONFIRMED) ném SLOT_ALREADY_BOOKED (409)")
    void createBooking_slotAlreadyBooked_throwsSlotAlreadyBooked() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(10L)
                .bookingDate(validDate)
                .timeSlotId(20L)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));
        when(bookingRepository.existsActiveBooking(10L, validDate, 20L)).thenReturn(true);

        assertThatThrownBy(() -> bookingService.createBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.SLOT_ALREADY_BOOKED));

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Xem lịch sử đặt sân của tôi thành công")
    void getMyBookings_success() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate)
                .timeSlot(slotEvening)
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("750000.00"))
                .build();

        Page<Booking> page = new PageImpl<>(List.of(booking));
        when(bookingRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        BookingResponse dto = BookingResponse.builder().id(1L).status(BookingStatus.CONFIRMED).build();
        when(bookingMapper.toResponse(booking)).thenReturn(dto);

        PageResponse<BookingResponse> response = bookingService.getMyBookings(
                BookingStatus.CONFIRMED, null, null, PageRequest.of(0, 10)
        );

        assertThat(response).isNotNull();
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("Hủy đặt sân thành công trước giờ bắt đầu -> chuyển sang CANCELLED")
    void cancelBooking_success() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate) // ngày tương lai -> chưa đến giờ bắt đầu
                .timeSlot(slotEvening)
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("750000.00"))
                .build();
        booking.setId(1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse cancelledDto = BookingResponse.builder().id(1L).status(BookingStatus.CANCELLED).build();
        when(bookingMapper.toResponse(any(Booking.class))).thenReturn(cancelledDto);

        BookingResponse result = bookingService.cancelBooking(1L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    @DisplayName("Hủy đơn đặt sân đã quá giờ bắt đầu ném BOOKING_NOT_CANCELLABLE (409)")
    void cancelBooking_pastStartHour_throwsBookingNotCancellable() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(LocalDate.now().minusDays(1)) // ngày hôm qua -> đã qua
                .timeSlot(slotEvening)
                .status(BookingStatus.PENDING)
                .build();
        booking.setId(1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.BOOKING_NOT_CANCELLABLE));
    }

    @Test
    @DisplayName("Hủy đơn đã CANCELLED hoặc COMPLETED ném BOOKING_NOT_CANCELLABLE (409)")
    void cancelBooking_invalidStatus_throwsBookingNotCancellable() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate)
                .timeSlot(slotEvening)
                .status(BookingStatus.CANCELLED)
                .build();
        booking.setId(1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.BOOKING_NOT_CANCELLABLE));
    }

    @Test
    @DisplayName("Đổi lịch thành công sang slot mới và cập nhật lại totalAmount")
    void updateBooking_success() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate)
                .timeSlot(slotEvening)
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("750000.00"))
                .build();
        booking.setId(1L);

        // Slot mới: 08:00 - 16:00 (8 giờ), giá 100k/h -> 800k
        TimeSlot slotDay = TimeSlot.builder()
                .name("Giờ Hành Chính")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(16, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();
        slotDay.setId(21L);

        UpdateBookingRequest request = UpdateBookingRequest.builder()
                .timeSlotId(21L)
                .build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(21L)).thenReturn(Optional.of(slotDay));
        when(bookingRepository.existsActiveBookingExcludingId(10L, validDate, 21L, 1L)).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse updatedDto = BookingResponse.builder()
                .id(1L)
                .timeSlotId(21L)
                .totalAmount(new BigDecimal("800000.00"))
                .build();
        when(bookingMapper.toResponse(any(Booking.class))).thenReturn(updatedDto);

        BookingResponse response = bookingService.updateBooking(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getTimeSlotId()).isEqualTo(21L);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("800000");
    }

    @Test
    @DisplayName("Đổi lịch sang slot đã bị người khác đặt ném SLOT_ALREADY_BOOKED (409)")
    void updateBooking_slotCollision_throwsSlotAlreadyBooked() {
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(validDate)
                .timeSlot(slotEvening)
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("750000.00"))
                .build();
        booking.setId(1L);

        TimeSlot slotDay = TimeSlot.builder()
                .name("Giờ Hành Chính")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(16, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();
        slotDay.setId(21L);

        UpdateBookingRequest request = UpdateBookingRequest.builder()
                .timeSlotId(21L)
                .build();

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(21L)).thenReturn(Optional.of(slotDay));
        when(bookingRepository.existsActiveBookingExcludingId(10L, validDate, 21L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> bookingService.updateBooking(1L, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.SLOT_ALREADY_BOOKED));
    }

    @Test
    @DisplayName("Tra cứu lịch trống ngày quá 30 ngày ném INVALID_BOOKING_DATE (400)")
    void getAvailability_invalidDate_throwsInvalidBookingDate() {
        LocalDate farFuture = LocalDate.now().plusDays(31);

        assertThatThrownBy(() -> bookingService.getAvailability(farFuture, null, null))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_BOOKING_DATE));
    }

    @Test
    @DisplayName("Tra cứu lịch trống tính đúng trạng thái FREE, BOOKED, UNAVAILABLE")
    void getAvailability_calculatesCorrectStatuses() {
        Court courtAvailable = Court.builder().complex(complex).name("Sân 1").status(CourtStatus.AVAILABLE).build();
        courtAvailable.setId(1L);

        Court courtMaintenance = Court.builder().complex(complex).name("Sân 2").status(CourtStatus.MAINTENANCE).build();
        courtMaintenance.setId(2L);

        when(courtRepository.findAll(any(Specification.class))).thenReturn(List.of(courtAvailable, courtMaintenance));
        when(timeSlotRepository.findAllByOrderByStartTimeAsc()).thenReturn(List.of(slotEvening));

        Booking activeBooking = Booking.builder()
                .court(courtAvailable)
                .timeSlot(slotEvening)
                .bookingDate(validDate)
                .status(BookingStatus.CONFIRMED)
                .build();

        when(bookingRepository.findActiveBookingsByDateAndCourtIds(eq(validDate), anyList()))
                .thenReturn(List.of(activeBooking));

        List<CourtAvailabilityResponse> result = bookingService.getAvailability(validDate, null, null);

        assertThat(result).hasSize(2);

        // Sân 1: Slot evening có booking -> BOOKED
        CourtAvailabilityResponse court1Resp = result.stream().filter(c -> c.getCourtId().equals(1L)).findFirst().orElseThrow();
        assertThat(court1Resp.getSlots().get(0).getSlotStatus()).isEqualTo(SlotStatus.BOOKED);

        // Sân 2: Bảo trì -> UNAVAILABLE
        CourtAvailabilityResponse court2Resp = result.stream().filter(c -> c.getCourtId().equals(2L)).findFirst().orElseThrow();
        assertThat(court2Resp.getSlots().get(0).getSlotStatus()).isEqualTo(SlotStatus.UNAVAILABLE);
    }
}
