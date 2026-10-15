package com.badminton.modules.court.mapper;

import com.badminton.modules.court.dto.request.CreateTimeSlotRequest;
import com.badminton.modules.court.dto.request.UpdateTimeSlotRequest;
import com.badminton.modules.court.dto.response.TimeSlotResponse;
import com.badminton.modules.court.entity.TimeSlot;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        builder = @Builder(disableBuilder = true),
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface TimeSlotMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TimeSlot toEntity(CreateTimeSlotRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(@MappingTarget TimeSlot timeSlot, UpdateTimeSlotRequest request);

    TimeSlotResponse toResponse(TimeSlot timeSlot);
}
