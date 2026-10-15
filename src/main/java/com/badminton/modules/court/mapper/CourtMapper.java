package com.badminton.modules.court.mapper;

import com.badminton.modules.court.dto.response.CourtResponse;
import com.badminton.modules.court.entity.Court;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true), nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CourtMapper {

    @Mapping(target = "complexId", source = "complex.id")
    @Mapping(target = "complexName", source = "complex.name")
    CourtResponse toResponse(Court court);
}
