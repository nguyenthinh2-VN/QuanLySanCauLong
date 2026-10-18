package com.badminton.modules.booking.service;

import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.CreatePosBookingRequest;
import com.badminton.modules.booking.dto.request.CreateRecurringBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.dto.response.RecurringBookingResponse;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    List<CourtAvailabilityResponse> getAvailability(LocalDate date, Long courtId, Long complexId);

    BookingResponse createBooking(CreateBookingRequest request);

    PageResponse<BookingResponse> getMyBookings(BookingStatus status, LocalDate fromDate, LocalDate toDate,
            Pageable pageable);

    BookingResponse updateBooking(Long id, UpdateBookingRequest request);

    BookingResponse cancelBooking(Long id);

    BookingResponse createPosBooking(CreatePosBookingRequest request);

    BookingResponse checkInBooking(Long id);

    RecurringBookingResponse createRecurringBooking(CreateRecurringBookingRequest request);
}
