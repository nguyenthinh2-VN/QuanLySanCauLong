package com.badminton.modules.report.repository.projection;

import java.time.LocalDate;

public interface DailyCourtOccupancyProjection {
    LocalDate getBookingDate();
    Long getCourtId();
    Long getBookedCount();
}

