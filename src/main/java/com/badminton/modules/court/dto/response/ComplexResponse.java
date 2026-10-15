package com.badminton.modules.court.dto.response;

import com.badminton.modules.court.entity.ComplexStatus;
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
public class ComplexResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private ComplexStatus status;
    private int totalCourts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
