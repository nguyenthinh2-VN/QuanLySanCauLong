package com.badminton.modules.booking.mapper;

import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.entity.Booking;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        builder = @Builder(disableBuilder = true),
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface BookingMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userFullName", source = "user.fullName")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "courtId", source = "court.id")
    @Mapping(target = "courtName", source = "court.name")
    @Mapping(target = "complexId", source = "court.complex.id")
    @Mapping(target = "complexName", source = "court.complex.name")
    @Mapping(target = "timeSlotId", source = "timeSlot.id")
    @Mapping(target = "timeSlotName", source = "timeSlot.name")
    @Mapping(target = "startTime", source = "timeSlot.startTime")
    @Mapping(target = "endTime", source = "timeSlot.endTime")
    BookingResponse toResponse(Booking booking);
}
