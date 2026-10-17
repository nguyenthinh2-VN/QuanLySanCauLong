package com.badminton.modules.booking.dto.response;

import com.badminton.modules.booking.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long courtId;
    private String courtName;
    private Long complexId;
    private String complexName;
    private LocalDate bookingDate;
    private Long timeSlotId;
    private String timeSlotName;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;
    private BigDecimal totalAmount;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
