package com.badminton.modules.report.service;

import com.badminton.modules.report.dto.request.ReportRangeRequest;
import com.badminton.modules.report.dto.response.OccupancyReportResponse;
import com.badminton.modules.report.dto.response.RevenueReportResponse;

public interface ReportService {

    RevenueReportResponse getRevenueReport(ReportRangeRequest request);

    OccupancyReportResponse getOccupancyReport(ReportRangeRequest request);
}

