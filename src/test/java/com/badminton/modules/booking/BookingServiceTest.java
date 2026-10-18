package com.badminton.modules.booking;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.CreatePosBookingRequest;
import com.badminton.modules.booking.dto.request.CreateRecurringBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.dto.response.RecurringBookingResponse;
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
import java.time.DayOfWeek;
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

    @Test
    @DisplayName("POS đặt cho thành viên (userId) -> thành công, status CONFIRMED")
    void createPosBooking_withMemberUser_createsConfirmedBooking() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .userId(100L)
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .note("POS Member")
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));
        when(bookingRepository.existsActiveBooking(10L, validDate, 20L)).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(50L);
            return b;
        });
        when(bookingMapper.toResponse(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return BookingResponse.builder()
                    .id(b.getId())
                    .userId(b.getUser().getId())
                    .courtId(b.getCourt().getId())
                    .status(b.getStatus())
                    .build();
        });

        BookingResponse response = bookingService.createPosBooking(request);

        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.getUserId()).isEqualTo(100L);
        verify(courtRepository).findByIdForUpdate(10L);
    }

    @Test
    @DisplayName("POS đặt cho khách vãng lai (guestName + guestPhone) -> thành công, user null, status CONFIRMED")
    void createPosBooking_withGuest_createsConfirmedBooking() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .guestName("Nguyễn Khách")
                .guestPhone("0987654321")
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));
        when(bookingRepository.existsActiveBooking(10L, validDate, 20L)).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(51L);
            return b;
        });
        when(bookingMapper.toResponse(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return BookingResponse.builder()
                    .id(b.getId())
                    .guestName(b.getGuestName())
                    .guestPhone(b.getGuestPhone())
                    .status(b.getStatus())
                    .build();
        });

        BookingResponse response = bookingService.createPosBooking(request);

        assertThat(response.getId()).isEqualTo(51L);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.getGuestName()).isEqualTo("Nguyễn Khách");
        assertThat(response.getGuestPhone()).isEqualTo("0987654321");
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("POS cung cấp cả userId và thông tin khách vãng lai -> ném INVALID_POS_REQUEST (400)")
    void createPosBooking_bothUserAndGuest_throwsInvalidPosRequest() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .userId(100L)
                .guestName("Nguyễn Khách")
                .guestPhone("0987654321")
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        assertThatThrownBy(() -> bookingService.createPosBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_POS_REQUEST));
    }

    @Test
    @DisplayName("POS không cung cấp cả userId lẫn khách vãng lai -> ném INVALID_POS_REQUEST (400)")
    void createPosBooking_neitherUserNorGuest_throwsInvalidPosRequest() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        assertThatThrownBy(() -> bookingService.createPosBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_POS_REQUEST));
    }

    @Test
    @DisplayName("POS chỉ cung cấp guestName mà thiếu guestPhone -> ném INVALID_POS_REQUEST (400)")
    void createPosBooking_partialGuest_throwsInvalidPosRequest() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .guestName("Nguyễn Khách")
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        assertThatThrownBy(() -> bookingService.createPosBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_POS_REQUEST));
    }

    @Test
    @DisplayName("POS đặt với userId không tồn tại -> ném USER_NOT_FOUND (404)")
    void createPosBooking_userNotFound_throwsUserNotFound() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .userId(999L)
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createPosBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));
    }

    @Test
    @DisplayName("POS đặt khung giờ đã bị chiếm -> ném SLOT_ALREADY_BOOKED (409)")
    void createPosBooking_slotAlreadyBooked_throwsSlotAlreadyBooked() {
        CreatePosBookingRequest request = CreatePosBookingRequest.builder()
                .userId(100L)
                .courtId(10L)
                .timeSlotId(20L)
                .bookingDate(validDate)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));
        when(bookingRepository.existsActiveBooking(10L, validDate, 20L)).thenReturn(true);

        assertThatThrownBy(() -> bookingService.createPosBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.SLOT_ALREADY_BOOKED));
    }

    @Test
    @DisplayName("Check-in đơn PENDING trong ngày hôm nay trước endTime -> thành công, status CHECKED_IN")
    void checkInBooking_validPending_success() {
        TimeSlot futureSlot = TimeSlot.builder()
                .startTime(LocalTime.now().plusHours(1))
                .endTime(LocalTime.now().plusHours(2))
                .pricePerHour(new BigDecimal("100000"))
                .build();
        futureSlot.setId(30L);

        Booking booking = Booking.builder()
                .court(court)
                .timeSlot(futureSlot)
                .bookingDate(LocalDate.now())
                .status(BookingStatus.PENDING)
                .build();
        booking.setId(60L);

        when(bookingRepository.findById(60L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingMapper.toResponse(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return BookingResponse.builder().id(b.getId()).status(b.getStatus()).build();
        });

        BookingResponse response = bookingService.checkInBooking(60L);

        assertThat(response.getStatus()).isEqualTo(BookingStatus.CHECKED_IN);
    }

    @Test
    @DisplayName("Check-in đơn đặt ngày hôm qua -> ném CHECK_IN_NOT_ALLOWED (409)")
    void checkInBooking_wrongDate_throwsCheckInNotAllowed() {
        Booking booking = Booking.builder()
                .court(court)
                .timeSlot(slotEvening)
                .bookingDate(LocalDate.now().minusDays(1))
                .status(BookingStatus.CONFIRMED)
                .build();
        booking.setId(61L);

        when(bookingRepository.findById(61L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.checkInBooking(61L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.CHECK_IN_NOT_ALLOWED));
    }

    @Test
    @DisplayName("Check-in lại đơn đã CHECKED_IN -> ném CHECK_IN_NOT_ALLOWED (409)")
    void checkInBooking_alreadyCheckedIn_throwsCheckInNotAllowed() {
        Booking booking = Booking.builder()
                .court(court)
                .timeSlot(slotEvening)
                .bookingDate(LocalDate.now())
                .status(BookingStatus.CHECKED_IN)
                .build();
        booking.setId(62L);

        when(bookingRepository.findById(62L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.checkInBooking(62L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.CHECK_IN_NOT_ALLOWED));
    }

    @Test
    @DisplayName("Check-in đơn hôm nay nhưng đã quá slot endTime -> ném CHECK_IN_NOT_ALLOWED (409)")
    void checkInBooking_pastEndTime_throwsCheckInNotAllowed() {
        TimeSlot pastSlot = TimeSlot.builder()
                .startTime(LocalTime.now().minusHours(2))
                .endTime(LocalTime.now().minusHours(1))
                .pricePerHour(new BigDecimal("100000"))
                .build();
        pastSlot.setId(31L);

        Booking booking = Booking.builder()
                .court(court)
                .timeSlot(pastSlot)
                .bookingDate(LocalDate.now())
                .status(BookingStatus.CONFIRMED)
                .build();
        booking.setId(63L);

        when(bookingRepository.findById(63L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.checkInBooking(63L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.CHECK_IN_NOT_ALLOWED));
    }

    @Test
    @DisplayName("Đặt lịch định kỳ 4 tuần thành công -> tạo đúng 4 booking PENDING cách nhau 7 ngày")
    void createRecurringBooking_success_createsAllWeeks() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        DayOfWeek dayOfWeek = startDate.getDayOfWeek();

        CreateRecurringBookingRequest request = CreateRecurringBookingRequest.builder()
                .courtId(10L)
                .timeSlotId(20L)
                .dayOfWeek(dayOfWeek)
                .startDate(startDate)
                .weeks(4)
                .note("Cố định tháng")
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));

        when(bookingRepository.existsActiveBooking(eq(10L), any(LocalDate.class), eq(20L))).thenReturn(false);

        when(bookingRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Booking> list = invocation.getArgument(0);
            long id = 100L;
            for (Booking b : list) {
                b.setId(id++);
            }
            return list;
        });

        when(bookingMapper.toResponse(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return BookingResponse.builder()
                    .id(b.getId())
                    .bookingDate(b.getBookingDate())
                    .status(b.getStatus())
                    .build();
        });

        RecurringBookingResponse response = bookingService.createRecurringBooking(request);

        assertThat(response.getCreatedCount()).isEqualTo(4);
        assertThat(response.getBookings()).hasSize(4);
        assertThat(response.getBookings().get(0).getBookingDate()).isEqualTo(startDate);
        assertThat(response.getBookings().get(1).getBookingDate()).isEqualTo(startDate.plusWeeks(1));
        assertThat(response.getBookings().get(2).getBookingDate()).isEqualTo(startDate.plusWeeks(2));
        assertThat(response.getBookings().get(3).getBookingDate()).isEqualTo(startDate.plusWeeks(3));
    }

    @Test
    @DisplayName("Đặt lịch định kỳ nhưng tuần 2 bị trùng -> ném RECURRING_SLOT_CONFLICT (409) chứa ngày trùng, không lưu booking nào")
    void createRecurringBooking_slotConflict_rollsBackAll() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        DayOfWeek dayOfWeek = startDate.getDayOfWeek();
        LocalDate week2 = startDate.plusWeeks(1);

        CreateRecurringBookingRequest request = CreateRecurringBookingRequest.builder()
                .courtId(10L)
                .timeSlotId(20L)
                .dayOfWeek(dayOfWeek)
                .startDate(startDate)
                .weeks(4)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(courtRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(court));
        when(timeSlotRepository.findById(20L)).thenReturn(Optional.of(slotEvening));

        when(bookingRepository.existsActiveBooking(10L, startDate, 20L)).thenReturn(false);
        when(bookingRepository.existsActiveBooking(10L, week2, 20L)).thenReturn(true);

        assertThatThrownBy(() -> bookingService.createRecurringBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.RECURRING_SLOT_CONFLICT);
                    assertThat(appEx.getData()).asList().contains(week2);
                });

        verify(bookingRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Đặt lịch định kỳ vượt quá phạm vi 90 ngày -> ném RECURRING_HORIZON_EXCEEDED (400)")
    void createRecurringBooking_horizonExceeded_throwsRecurringHorizonExceeded() {
        LocalDate startDate = LocalDate.now().plusDays(25);
        DayOfWeek dayOfWeek = startDate.getDayOfWeek();

        CreateRecurringBookingRequest request = CreateRecurringBookingRequest.builder()
                .courtId(10L)
                .timeSlotId(20L)
                .dayOfWeek(dayOfWeek)
                .startDate(startDate)
                .weeks(11) // 25 + 10 * 7 = 95 ngày > 90 ngày
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bookingService.createRecurringBooking(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.RECURRING_HORIZON_EXCEEDED));

        verify(courtRepository, never()).findByIdForUpdate(any());
    }
}
