package com.badminton.modules.booking.security;

import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("bookingSecurity")
@RequiredArgsConstructor
public class BookingSecurity {

    private final BookingRepository bookingRepository;

    public boolean isOwner(Long bookingId) {
        if (bookingId == null) {
            return false;
        }

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentUserId -> bookingRepository.findById(bookingId)
                        .map(booking -> booking.getUser() != null && currentUserId.equals(booking.getUser().getId())))
                .orElse(false);
    }
}
