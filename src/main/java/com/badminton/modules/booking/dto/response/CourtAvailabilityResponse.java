package com.badminton.modules.booking.dto.response;

import com.badminton.modules.court.entity.CourtStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtAvailabilityResponse {

    private Long courtId;
    private String courtName;
    private String complexName;
    private CourtStatus courtStatus;
    private List<SlotAvailabilityResponse> slots;
}
