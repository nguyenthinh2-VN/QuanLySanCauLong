package com.badminton.modules.report.controller;

import com.badminton.modules.report.dto.request.ReportRangeRequest;
import com.badminton.modules.report.dto.response.OccupancyReportResponse;
import com.badminton.modules.report.dto.response.RevenueReportResponse;
import com.badminton.modules.report.service.ReportService;
import com.badminton.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "APIs Thống kê & Báo cáo Quản trị (Admin Dashboard)")
@SecurityRequirement(name = "BearerAuth")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/revenue")
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @Operation(
            summary = "Báo cáo doanh thu theo kỳ",
            description = "Thống kê doanh thu gộp, hoàn tiền, doanh thu thuần và phân rã theo ngày/tuần/tháng dành cho Quản trị viên"
    )
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @ModelAttribute @Valid ReportRangeRequest request
    ) {
        RevenueReportResponse response = reportService.getRevenueReport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @Operation(
            summary = "Báo cáo tỉ lệ lấp đầy sân",
            description = "Thống kê công suất sử dụng sân theo kỳ, chi tiết theo từng sân và theo ngày dành cho Quản trị viên"
    )
    public ResponseEntity<ApiResponse<OccupancyReportResponse>> getOccupancyReport(
            @ModelAttribute @Valid ReportRangeRequest request
    ) {
        OccupancyReportResponse response = reportService.getOccupancyReport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

