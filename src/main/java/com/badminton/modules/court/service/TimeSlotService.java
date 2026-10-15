package com.badminton.modules.court.service;

import com.badminton.modules.court.dto.request.CreateTimeSlotRequest;
import com.badminton.modules.court.dto.request.UpdateTimeSlotRequest;
import com.badminton.modules.court.dto.response.TimeSlotResponse;

import java.util.List;

public interface TimeSlotService {

    List<TimeSlotResponse> getTimeSlots();

    TimeSlotResponse createTimeSlot(CreateTimeSlotRequest request);

    TimeSlotResponse updateTimeSlot(Long id, UpdateTimeSlotRequest request);
}
