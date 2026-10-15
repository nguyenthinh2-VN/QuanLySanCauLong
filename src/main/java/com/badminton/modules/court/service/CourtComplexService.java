package com.badminton.modules.court.service;

import com.badminton.modules.court.dto.request.CreateComplexRequest;
import com.badminton.modules.court.dto.request.UpdateComplexRequest;
import com.badminton.modules.court.dto.response.ComplexDetailResponse;
import com.badminton.modules.court.dto.response.ComplexResponse;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.shared.response.PageResponse;

public interface CourtComplexService {

    PageResponse<ComplexResponse> getComplexes(String q, ComplexStatus status, int page, int size, String sort);

    ComplexDetailResponse getComplexById(Long id);

    ComplexResponse createComplex(CreateComplexRequest request);

    ComplexResponse updateComplex(Long id, UpdateComplexRequest request);

    void deleteComplex(Long id);
}
