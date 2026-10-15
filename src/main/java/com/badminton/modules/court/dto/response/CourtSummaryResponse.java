package com.badminton.modules.court.dto.response;

import com.badminton.modules.court.entity.CourtStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtSummaryResponse {

    private Long id;
    private String name;
    private CourtStatus status;
}
