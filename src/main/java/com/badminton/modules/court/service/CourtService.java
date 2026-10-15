package com.badminton.modules.court.service;

import com.badminton.modules.court.dto.request.CreateCourtRequest;
import com.badminton.modules.court.dto.request.UpdateCourtRequest;
import com.badminton.modules.court.dto.response.CourtResponse;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.shared.response.PageResponse;

public interface CourtService {

    PageResponse<CourtResponse> getCourts(Long complexId, CourtStatus status, String q, int page, int size,
            String sort);

    CourtResponse getCourtById(Long id);

    CourtResponse createCourt(CreateCourtRequest request);

    CourtResponse updateCourt(Long id, UpdateCourtRequest request);

    void deleteCourt(Long id);
}
