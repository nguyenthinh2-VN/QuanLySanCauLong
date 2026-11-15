package com.badminton.modules.booking.event;

import com.badminton.modules.booking.entity.SlotStatus;

import java.time.LocalDate;

public record AvailabilityChangedEvent(
        Long courtId,
        LocalDate bookingDate,
        Long timeSlotId,
        SlotStatus slotStatus
) {
}

