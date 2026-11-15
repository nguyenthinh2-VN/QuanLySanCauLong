package com.badminton.modules.realtime.dto;

import com.badminton.modules.booking.entity.SlotStatus;

import java.time.LocalDate;

public record AvailabilityMessage(
        String type,
        Long courtId,
        LocalDate bookingDate,
        Long timeSlotId,
        SlotStatus slotStatus
) {
}

