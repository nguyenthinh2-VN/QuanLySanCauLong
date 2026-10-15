package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateTimeSlotRequest;
import com.badminton.modules.court.dto.request.UpdateTimeSlotRequest;
import com.badminton.modules.court.dto.response.TimeSlotResponse;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.mapper.TimeSlotMapper;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.court.service.impl.TimeSlotServiceImpl;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceTest {

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private TimeSlotMapper timeSlotMapper;

    @InjectMocks
    private TimeSlotServiceImpl timeSlotService;

    private TimeSlot slot1;

    @BeforeEach
    void setUp() {
        slot1 = TimeSlot.builder()
                .name("Sáng 06:00–12:00")
                .startTime(LocalTime.of(6, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(new BigDecimal("80000"))
                .build();
        slot1.setId(1L);
    }

    @Test
    @DisplayName("Lấy danh sách khung giờ sắp xếp theo startTime tăng dần")
    void getTimeSlots_success() {
        when(timeSlotRepository.findAllByOrderByStartTimeAsc()).thenReturn(List.of(slot1));
        TimeSlotResponse responseDto = TimeSlotResponse.builder()
                .id(1L)
                .name("Sáng 06:00–12:00")
                .startTime(LocalTime.of(6, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(new BigDecimal("80000"))
                .build();
        when(timeSlotMapper.toResponse(slot1)).thenReturn(responseDto);

        List<TimeSlotResponse> result = timeSlotService.getTimeSlots();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Sáng 06:00–12:00");
    }

    @Test
    @DisplayName("Tạo khung giờ thành công khi hợp lệ")
    void createTimeSlot_success() {
        CreateTimeSlotRequest request = CreateTimeSlotRequest.builder()
                .name("Chiều 12:00–18:00")
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(18, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();

        when(timeSlotRepository.existsOverlappingSlot(LocalTime.of(12, 0), LocalTime.of(18, 0))).thenReturn(false);

        TimeSlot newSlot = TimeSlot.builder()
                .name("Chiều 12:00–18:00")
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(18, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();
        when(timeSlotMapper.toEntity(request)).thenReturn(newSlot);
        when(timeSlotRepository.save(any(TimeSlot.class))).thenReturn(newSlot);

        TimeSlotResponse responseDto = TimeSlotResponse.builder().id(2L).name("Chiều 12:00–18:00").build();
        when(timeSlotMapper.toResponse(newSlot)).thenReturn(responseDto);

        TimeSlotResponse result = timeSlotService.createTimeSlot(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Chiều 12:00–18:00");
        verify(timeSlotRepository).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("Guard tạo khung giờ: startTime >= endTime ném INVALID_TIME_RANGE (400)")
    void createTimeSlot_startTimeAfterOrEqualEndTime_throwsInvalidTimeRange() {
        CreateTimeSlotRequest request = CreateTimeSlotRequest.builder()
                .name("Sai giờ")
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_TIME_RANGE));

        verify(timeSlotRepository, never()).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("Guard tạo khung giờ: startTime == endTime ném INVALID_TIME_RANGE (400)")
    void createTimeSlot_startTimeEqualsEndTime_throwsInvalidTimeRange() {
        CreateTimeSlotRequest request = CreateTimeSlotRequest.builder()
                .name("Sai giờ")
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_TIME_RANGE));
    }

    @Test
    @DisplayName("Guard tạo khung giờ: overlap khung giờ đã có ném OVERLAPPING_TIME_SLOT (409)")
    void createTimeSlot_overlappingSlot_throwsOverlappingTimeSlot() {
        CreateTimeSlotRequest request = CreateTimeSlotRequest.builder()
                .name("Trùng giờ")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(14, 0))
                .pricePerHour(new BigDecimal("100000"))
                .build();

        when(timeSlotRepository.existsOverlappingSlot(LocalTime.of(8, 0), LocalTime.of(14, 0))).thenReturn(true);

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.OVERLAPPING_TIME_SLOT));

        verify(timeSlotRepository, never()).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("Guard tạo khung giờ: giá âm ném BAD_REQUEST")
    void createTimeSlot_negativePrice_throwsBadRequest() {
        CreateTimeSlotRequest request = CreateTimeSlotRequest.builder()
                .name("Giá âm")
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(18, 0))
                .pricePerHour(new BigDecimal("-1000"))
                .build();

        assertThatThrownBy(() -> timeSlotService.createTimeSlot(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));
    }

    @Test
    @DisplayName("Cập nhật khung giờ thành công")
    void updateTimeSlot_success() {
        UpdateTimeSlotRequest request = UpdateTimeSlotRequest.builder()
                .name("Sáng sớm 05:30–11:30")
                .startTime(LocalTime.of(5, 30))
                .endTime(LocalTime.of(11, 30))
                .pricePerHour(new BigDecimal("85000"))
                .build();

        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(slot1));
        when(timeSlotRepository.existsOverlappingSlotExcludingId(LocalTime.of(5, 30), LocalTime.of(11, 30), 1L)).thenReturn(false);
        when(timeSlotRepository.save(any(TimeSlot.class))).thenReturn(slot1);

        TimeSlotResponse responseDto = TimeSlotResponse.builder().id(1L).name("Sáng sớm 05:30–11:30").build();
        when(timeSlotMapper.toResponse(slot1)).thenReturn(responseDto);

        TimeSlotResponse result = timeSlotService.updateTimeSlot(1L, request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Sáng sớm 05:30–11:30");
    }

    @Test
    @DisplayName("Cập nhật khung giờ overlap với slot khác ném OVERLAPPING_TIME_SLOT (409)")
    void updateTimeSlot_overlappingSlot_throwsOverlappingTimeSlot() {
        UpdateTimeSlotRequest request = UpdateTimeSlotRequest.builder()
                .name("Cập nhật trùng")
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(15, 0))
                .pricePerHour(new BigDecimal("90000"))
                .build();

        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(slot1));
        when(timeSlotRepository.existsOverlappingSlotExcludingId(LocalTime.of(11, 0), LocalTime.of(15, 0), 1L)).thenReturn(true);

        assertThatThrownBy(() -> timeSlotService.updateTimeSlot(1L, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.OVERLAPPING_TIME_SLOT));
    }

    @Test
    @DisplayName("Cập nhật khung giờ không tồn tại ném TIMESLOT_NOT_FOUND (404)")
    void updateTimeSlot_notFound() {
        UpdateTimeSlotRequest request = UpdateTimeSlotRequest.builder()
                .name("Không có")
                .startTime(LocalTime.of(6, 0))
                .endTime(LocalTime.of(12, 0))
                .pricePerHour(new BigDecimal("80000"))
                .build();

        when(timeSlotRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> timeSlotService.updateTimeSlot(999L, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.TIMESLOT_NOT_FOUND));
    }
}
