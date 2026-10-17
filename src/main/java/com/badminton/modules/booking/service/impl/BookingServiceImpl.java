package com.badminton.modules.booking.service.impl;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.dto.response.SlotAvailabilityResponse;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.entity.SlotStatus;
import com.badminton.modules.booking.mapper.BookingMapper;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.security.SecurityUtils;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingServiceImpl implements BookingService {

    private static final int MAX_BOOKING_DAYS_AHEAD = 30;

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;

    @Override
    public List<CourtAvailabilityResponse> getAvailability(LocalDate date, Long courtId, Long complexId) {
        if (date == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày tra cứu lịch trống không được để trống");
        }

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(MAX_BOOKING_DAYS_AHEAD);
        if (date.isBefore(today) || date.isAfter(maxDate)) {
            throw new AppException(ErrorCode.INVALID_BOOKING_DATE);
        }

        Specification<Court> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (courtId != null) {
                predicates.add(cb.equal(root.get("id"), courtId));
            }
            if (complexId != null) {
                predicates.add(cb.equal(root.get("complex").get("id"), complexId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Court> courts = courtRepository.findAll(spec);
        if (courts.isEmpty()) {
            return Collections.emptyList();
        }

        List<TimeSlot> timeSlots = timeSlotRepository.findAllByOrderByStartTimeAsc();
        List<Long> courtIds = courts.stream().map(Court::getId).toList();
        List<Booking> activeBookings = bookingRepository.findActiveBookingsByDateAndCourtIds(date, courtIds);

        Set<String> bookedSlotKeys = activeBookings.stream()
                .map(b -> b.getCourt().getId() + ":" + b.getTimeSlot().getId())
                .collect(Collectors.toSet());

        LocalTime now = LocalTime.now();
        boolean isToday = date.isEqual(today);

        List<CourtAvailabilityResponse> responseList = new ArrayList<>();
        for (Court court : courts) {
            List<SlotAvailabilityResponse> slotResponses = new ArrayList<>();
            for (TimeSlot slot : timeSlots) {
                SlotStatus slotStatus;
                if (court.getStatus() == CourtStatus.MAINTENANCE) {
                    slotStatus = SlotStatus.UNAVAILABLE;
                } else if (isToday && !now.isBefore(slot.getEndTime())) {
                    slotStatus = SlotStatus.PASSED;
                } else if (bookedSlotKeys.contains(court.getId() + ":" + slot.getId())) {
                    slotStatus = SlotStatus.BOOKED;
                } else {
                    slotStatus = SlotStatus.FREE;
                }

                slotResponses.add(SlotAvailabilityResponse.builder()
                        .timeSlotId(slot.getId())
                        .name(slot.getName())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .pricePerHour(slot.getPricePerHour())
                        .slotStatus(slotStatus)
                        .build());
            }

            responseList.add(CourtAvailabilityResponse.builder()
                    .courtId(court.getId())
                    .courtName(court.getName())
                    .complexName(court.getComplex() != null ? court.getComplex().getName() : null)
                    .courtStatus(court.getStatus())
                    .slots(slotResponses)
                    .build());
        }

        return responseList;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(MAX_BOOKING_DAYS_AHEAD);
        if (request.getBookingDate() == null || request.getBookingDate().isBefore(today)
                || request.getBookingDate().isAfter(maxDate)) {
            throw new AppException(ErrorCode.INVALID_BOOKING_DATE);
        }

        // Lock Court row with pessimistic write lock to serialize concurrent bookings
        Court court = courtRepository.findByIdForUpdate(request.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        if (court.getStatus() == CourtStatus.MAINTENANCE) {
            throw new AppException(ErrorCode.COURT_NOT_AVAILABLE);
        }

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new AppException(ErrorCode.TIMESLOT_NOT_FOUND));

        // If booking for today, verify the slot has not already passed
        if (request.getBookingDate().isEqual(today) && !LocalTime.now().isBefore(timeSlot.getEndTime())) {
            throw new AppException(ErrorCode.INVALID_BOOKING_DATE, "Khung giờ này đã kết thúc trong ngày hôm nay");
        }

        // Check if slot is already occupied by an active booking
        if (bookingRepository.existsActiveBooking(court.getId(), request.getBookingDate(), timeSlot.getId())) {
            throw new AppException(ErrorCode.SLOT_ALREADY_BOOKED);
        }

        BigDecimal totalAmount = calculateTotalAmount(timeSlot);

        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .bookingDate(request.getBookingDate())
                .timeSlot(timeSlot)
                .status(BookingStatus.PENDING)
                .totalAmount(totalAmount)
                .note(request.getNote())
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking created successfully: id={}, user={}, court={}, date={}, slot={}",
                savedBooking.getId(), user.getId(), court.getId(), request.getBookingDate(), timeSlot.getId());

        return bookingMapper.toResponse(savedBooking);
    }

    @Override
    public PageResponse<BookingResponse> getMyBookings(BookingStatus status, LocalDate fromDate, LocalDate toDate,
            Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        Specification<Booking> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), currentUserId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bookingDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("bookingDate"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Booking> page = bookingRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(bookingMapper::toResponse));
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, UpdateBookingRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Guard: Status must be PENDING or CONFIRMED
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.BOOKING_NOT_RESCHEDULABLE);
        }

        // Guard: Current time must be strictly before current slot start time
        LocalDateTime currentSlotStart = LocalDateTime.of(booking.getBookingDate(),
                booking.getTimeSlot().getStartTime());
        if (!LocalDateTime.now().isBefore(currentSlotStart)) {
            throw new AppException(ErrorCode.BOOKING_NOT_RESCHEDULABLE);
        }

        boolean hasCourtChange = request.getCourtId() != null
                && !request.getCourtId().equals(booking.getCourt().getId());
        boolean hasDateChange = request.getBookingDate() != null
                && !request.getBookingDate().equals(booking.getBookingDate());
        boolean hasSlotChange = request.getTimeSlotId() != null
                && !request.getTimeSlotId().equals(booking.getTimeSlot().getId());
        boolean hasNoteChange = request.getNote() != null && !request.getNote().equals(booking.getNote());

        if (!hasCourtChange && !hasDateChange && !hasSlotChange && !hasNoteChange) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Yêu cầu thay đổi ít nhất một thông tin đặt sân");
        }

        Long targetCourtId = request.getCourtId() != null ? request.getCourtId() : booking.getCourt().getId();
        LocalDate targetDate = request.getBookingDate() != null ? request.getBookingDate() : booking.getBookingDate();
        Long targetSlotId = request.getTimeSlotId() != null ? request.getTimeSlotId() : booking.getTimeSlot().getId();

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(MAX_BOOKING_DAYS_AHEAD);
        if (targetDate.isBefore(today) || targetDate.isAfter(maxDate)) {
            throw new AppException(ErrorCode.INVALID_BOOKING_DATE);
        }

        // Lock target court row
        Court targetCourt = courtRepository.findByIdForUpdate(targetCourtId)
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        if (targetCourt.getStatus() == CourtStatus.MAINTENANCE) {
            throw new AppException(ErrorCode.COURT_NOT_AVAILABLE);
        }

        TimeSlot targetSlot = timeSlotRepository.findById(targetSlotId)
                .orElseThrow(() -> new AppException(ErrorCode.TIMESLOT_NOT_FOUND));

        if (targetDate.isEqual(today) && !LocalTime.now().isBefore(targetSlot.getEndTime())) {
            throw new AppException(ErrorCode.INVALID_BOOKING_DATE, "Khung giờ mới đã kết thúc trong ngày hôm nay");
        }

        // Check if the target slot is already occupied by another active booking
        if (bookingRepository.existsActiveBookingExcludingId(targetCourt.getId(), targetDate, targetSlot.getId(),
                booking.getId())) {
            throw new AppException(ErrorCode.SLOT_ALREADY_BOOKED);
        }

        booking.setCourt(targetCourt);
        booking.setBookingDate(targetDate);
        booking.setTimeSlot(targetSlot);
        booking.setTotalAmount(calculateTotalAmount(targetSlot));

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking updated successfully: id={}, newCourt={}, newDate={}, newSlot={}, newAmount={}",
                updatedBooking.getId(), targetCourt.getId(), targetDate, targetSlot.getId(),
                updatedBooking.getTotalAmount());

        return bookingMapper.toResponse(updatedBooking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Guard: Status must be PENDING or CONFIRMED
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.BOOKING_NOT_CANCELLABLE);
        }

        // Guard: Current time must be strictly before current slot start time
        LocalDateTime currentSlotStart = LocalDateTime.of(booking.getBookingDate(),
                booking.getTimeSlot().getStartTime());
        if (!LocalDateTime.now().isBefore(currentSlotStart)) {
            throw new AppException(ErrorCode.BOOKING_NOT_CANCELLABLE);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking cancelledBooking = bookingRepository.save(booking);
        log.info("Booking cancelled successfully: id={}, user={}", cancelledBooking.getId(), booking.getUser().getId());

        return bookingMapper.toResponse(cancelledBooking);
    }

    private BigDecimal calculateTotalAmount(TimeSlot timeSlot) {
        long durationMinutes = Duration.between(timeSlot.getStartTime(), timeSlot.getEndTime()).toMinutes();
        return timeSlot.getPricePerHour()
                .multiply(BigDecimal.valueOf(durationMinutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}
