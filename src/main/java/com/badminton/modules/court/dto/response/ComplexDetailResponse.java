package com.badminton.modules.court.dto.response;

import com.badminton.modules.court.entity.ComplexStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplexDetailResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private ComplexStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<CourtSummaryResponse> courts = new ArrayList<>();
}
