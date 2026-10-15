package com.badminton.modules.court.mapper;

import com.badminton.modules.court.dto.request.CreateComplexRequest;
import com.badminton.modules.court.dto.request.UpdateComplexRequest;
import com.badminton.modules.court.dto.response.ComplexDetailResponse;
import com.badminton.modules.court.dto.response.ComplexResponse;
import com.badminton.modules.court.dto.response.CourtSummaryResponse;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
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
public interface CourtComplexMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "courts", ignore = true)
    CourtComplex toEntity(CreateComplexRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "courts", ignore = true)
    void updateEntityFromRequest(@MappingTarget CourtComplex complex, UpdateComplexRequest request);

    @Mapping(
            target = "totalCourts",
            expression = "java(complex.getCourts() != null ? complex.getCourts().size() : 0)"
    )
    ComplexResponse toResponse(CourtComplex complex);

    ComplexDetailResponse toDetailResponse(CourtComplex complex);

    CourtSummaryResponse toCourtSummaryResponse(Court court);
}
