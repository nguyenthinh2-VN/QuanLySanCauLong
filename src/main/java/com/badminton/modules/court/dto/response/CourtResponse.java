package com.badminton.modules.court.dto.response;

import com.badminton.modules.court.entity.CourtStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtResponse {

    private Long id;
    private String name;
    private CourtStatus status;
    private Long complexId;
    private String complexName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
