package com.badminton.modules.booking.dto.response;

import com.badminton.modules.booking.entity.SlotStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotAvailabilityResponse {

    private Long timeSlotId;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal pricePerHour;
    private SlotStatus slotStatus;
}
