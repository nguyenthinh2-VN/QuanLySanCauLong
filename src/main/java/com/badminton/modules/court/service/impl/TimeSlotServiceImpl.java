package com.badminton.modules.court.service.impl;

import com.badminton.modules.court.dto.request.CreateTimeSlotRequest;
import com.badminton.modules.court.dto.request.UpdateTimeSlotRequest;
import com.badminton.modules.court.dto.response.TimeSlotResponse;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.mapper.TimeSlotMapper;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.court.service.TimeSlotService;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeSlotServiceImpl implements TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final TimeSlotMapper timeSlotMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getTimeSlots() {
        List<TimeSlot> slots = timeSlotRepository.findAllByOrderByStartTimeAsc();
        return slots.stream()
                .map(timeSlotMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TimeSlotResponse createTimeSlot(CreateTimeSlotRequest request) {
        // Guard 1: startTime < endTime
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            log.warn("Khoảng thời gian không hợp lệ: startTime={}, endTime={}",
                    request.getStartTime(), request.getEndTime());
            throw new AppException(ErrorCode.INVALID_TIME_RANGE);
        }

        // Guard 2: overlap check
        if (timeSlotRepository.existsOverlappingSlot(request.getStartTime(), request.getEndTime())) {
            log.warn("Khung giờ bị trùng/đè lên khung giờ đã có: startTime={}, endTime={}",
                    request.getStartTime(), request.getEndTime());
            throw new AppException(ErrorCode.OVERLAPPING_TIME_SLOT);
        }

        // Guard 3: pricePerHour >= 0
        if (request.getPricePerHour() == null || request.getPricePerHour().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Giá thuê mỗi giờ không được âm");
        }

        TimeSlot timeSlot = timeSlotMapper.toEntity(request);
        TimeSlot saved = timeSlotRepository.save(timeSlot);
        log.info("Đã tạo mới khung giờ: id={}, name='{}', {} - {}, price={}",
                saved.getId(), saved.getName(), saved.getStartTime(), saved.getEndTime(), saved.getPricePerHour());
        return timeSlotMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TimeSlotResponse updateTimeSlot(Long id, UpdateTimeSlotRequest request) {
        TimeSlot timeSlot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TIMESLOT_NOT_FOUND));

        // Guard 1: startTime < endTime
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            log.warn("Khoảng thời gian không hợp lệ khi cập nhật: startTime={}, endTime={}",
                    request.getStartTime(), request.getEndTime());
            throw new AppException(ErrorCode.INVALID_TIME_RANGE);
        }

        // Guard 2: overlap check excluding current id
        if (timeSlotRepository.existsOverlappingSlotExcludingId(request.getStartTime(), request.getEndTime(), id)) {
            log.warn("Khung giờ cập nhật bị trùng/đè lên khung giờ khác: id={}, startTime={}, endTime={}",
                    id, request.getStartTime(), request.getEndTime());
            throw new AppException(ErrorCode.OVERLAPPING_TIME_SLOT);
        }

        // Guard 3: pricePerHour >= 0
        if (request.getPricePerHour() == null || request.getPricePerHour().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Giá thuê mỗi giờ không được âm");
        }

        timeSlotMapper.updateEntityFromRequest(timeSlot, request);
        TimeSlot updated = timeSlotRepository.save(timeSlot);
        log.info("Đã cập nhật khung giờ: id={}, name='{}', {} - {}, price={}",
                updated.getId(), updated.getName(), updated.getStartTime(), updated.getEndTime(), updated.getPricePerHour());
        return timeSlotMapper.toResponse(updated);
    }
}
