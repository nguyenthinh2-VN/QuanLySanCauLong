package com.badminton.modules.report;

import com.badminton.modules.report.dto.response.OccupancyReportResponse;
import com.badminton.modules.report.dto.response.RevenueReportResponse;
import com.badminton.modules.report.dto.response.RevenueTotalsResponse;
import com.badminton.modules.report.service.ReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @Test
    @DisplayName("GET /api/v1/reports/revenue: không truyền token -> 401 Unauthorized")
    void revenue_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/revenue"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("GET /api/v1/reports/revenue: vai trò CUSTOMER -> 403 Forbidden")
    void revenue_customerRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/revenue"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/reports/revenue: vai trò STAFF -> 403 Forbidden")
    void revenue_staffRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/revenue"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/reports/revenue: vai trò ADMIN -> 200 OK")
    void revenue_adminRole_returns200() throws Exception {
        RevenueReportResponse mockResponse = RevenueReportResponse.builder()
                .from(LocalDate.of(2026, 10, 5))
                .to(LocalDate.of(2026, 11, 3))
                .totals(RevenueTotalsResponse.builder()
                        .grossRevenue(BigDecimal.valueOf(1000000))
                        .refundedAmount(BigDecimal.ZERO)
                        .netRevenue(BigDecimal.valueOf(1000000))
                        .transactionCount(10)
                        .build())
                .timeline(Collections.emptyList())
                .byPaymentMethod(Collections.emptyList())
                .build();

        when(reportService.getRevenueReport(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/reports/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totals.grossRevenue").value(1000000));
    }

    @Test
    @DisplayName("GET /api/v1/reports/occupancy: không truyền token -> 401 Unauthorized")
    void occupancy_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/occupancy"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("GET /api/v1/reports/occupancy: vai trò CUSTOMER -> 403 Forbidden")
    void occupancy_customerRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/occupancy"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/reports/occupancy: vai trò STAFF -> 403 Forbidden")
    void occupancy_staffRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/occupancy"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/reports/occupancy: vai trò ADMIN -> 200 OK")
    void occupancy_adminRole_returns200() throws Exception {
        OccupancyReportResponse mockResponse = OccupancyReportResponse.builder()
                .from(LocalDate.of(2026, 10, 5))
                .to(LocalDate.of(2026, 11, 3))
                .overallRate(new BigDecimal("75.50"))
                .bookedSlots(150)
                .totalSlots(200)
                .byCourt(Collections.emptyList())
                .daily(Collections.emptyList())
                .build();

        when(reportService.getOccupancyReport(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/reports/occupancy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.overallRate").value(75.50));
    }
}

