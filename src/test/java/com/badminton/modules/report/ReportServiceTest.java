package com.badminton.modules.report;

import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.payment.entity.PaymentMethod;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.repository.PaymentRepository;
import com.badminton.modules.report.dto.request.ReportGroupBy;
import com.badminton.modules.report.dto.request.ReportRangeRequest;
import com.badminton.modules.report.dto.response.CourtOccupancyResponse;
import com.badminton.modules.report.dto.response.DailyOccupancyResponse;
import com.badminton.modules.report.dto.response.OccupancyReportResponse;
import com.badminton.modules.report.dto.response.RevenuePeriodBucketResponse;
import com.badminton.modules.report.dto.response.RevenueReportResponse;
import com.badminton.modules.report.repository.projection.DailyCourtOccupancyProjection;
import com.badminton.modules.report.repository.projection.DailyRevenueProjection;
import com.badminton.modules.report.repository.projection.PaymentMethodRevenueProjection;
import com.badminton.modules.report.service.impl.ReportServiceImpl;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Court court1;
    private Court court2;

    @BeforeEach
    void setUp() {
        court1 = Court.builder().name("Sân 1").status(CourtStatus.AVAILABLE).build();
        court1.setId(1L);

        court2 = Court.builder().name("Sân 2").status(CourtStatus.AVAILABLE).build();
        court2.setId(2L);
    }

    @Test
    @DisplayName("getRevenueReport: mặc định 30 ngày gần nhất khi không truyền from/to")
    void testGetRevenueReport_defaultDates() {
        when(paymentRepository.findDailyRevenueAggregations(any(LocalDateTime.class), any(LocalDateTime.class), any()))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findPaymentMethodRevenueAggregations(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        RevenueReportResponse response = reportService.getRevenueReport(new ReportRangeRequest());

        LocalDate today = LocalDate.now();
        LocalDate expectedFrom = today.minusDays(29);

        assertThat(response.getTo()).isEqualTo(today);
        assertThat(response.getFrom()).isEqualTo(expectedFrom);
        assertThat(response.getTimeline()).hasSize(30);
        assertThat(response.getTotals().getGrossRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTotals().getNetRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getRevenueReport: groupBy = DAY sinh đủ mọi ngày và tính đúng netRevenue = gross - refunded")
    void testGetRevenueReport_groupByDay() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 3);

        DailyRevenueProjection d1Success = mock(DailyRevenueProjection.class);
        when(d1Success.getReportDate()).thenReturn(LocalDate.of(2026, 11, 1));
        when(d1Success.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(d1Success.getTotalAmount()).thenReturn(new BigDecimal("100000.00"));
        when(d1Success.getTransactionCount()).thenReturn(1L);

        DailyRevenueProjection d1Refund = mock(DailyRevenueProjection.class);
        when(d1Refund.getReportDate()).thenReturn(LocalDate.of(2026, 11, 1));
        when(d1Refund.getStatus()).thenReturn(PaymentStatus.REFUNDED);
        when(d1Refund.getTotalAmount()).thenReturn(new BigDecimal("20000.00"));

        DailyRevenueProjection d3Success = mock(DailyRevenueProjection.class);
        when(d3Success.getReportDate()).thenReturn(LocalDate.of(2026, 11, 3));
        when(d3Success.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(d3Success.getTotalAmount()).thenReturn(new BigDecimal("200000.00"));
        when(d3Success.getTransactionCount()).thenReturn(2L);

        when(paymentRepository.findDailyRevenueAggregations(any(), any(), any()))
                .thenReturn(List.of(d1Success, d1Refund, d3Success));

        PaymentMethodRevenueProjection mBank = mock(PaymentMethodRevenueProjection.class);
        when(mBank.getPaymentMethod()).thenReturn(PaymentMethod.BANK_TRANSFER);
        when(mBank.getTotalAmount()).thenReturn(new BigDecimal("300000.00"));
        when(mBank.getTransactionCount()).thenReturn(3L);

        when(paymentRepository.findPaymentMethodRevenueAggregations(any(), any()))
                .thenReturn(List.of(mBank));

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(from)
                .to(to)
                .groupBy(ReportGroupBy.DAY)
                .build();

        RevenueReportResponse response = reportService.getRevenueReport(request);

        assertThat(response.getTotals().getGrossRevenue()).isEqualByComparingTo("300000.00");
        assertThat(response.getTotals().getRefundedAmount()).isEqualByComparingTo("20000.00");
        assertThat(response.getTotals().getNetRevenue()).isEqualByComparingTo("280000.00");
        assertThat(response.getTotals().getTransactionCount()).isEqualTo(3L);

        List<RevenuePeriodBucketResponse> timeline = response.getTimeline();
        assertThat(timeline).hasSize(3);

        RevenuePeriodBucketResponse b1 = timeline.get(0);
        assertThat(b1.getPeriod()).isEqualTo("2026-11-01");
        assertThat(b1.getGrossRevenue()).isEqualByComparingTo("100000.00");
        assertThat(b1.getRefundedAmount()).isEqualByComparingTo("20000.00");
        assertThat(b1.getNetRevenue()).isEqualByComparingTo("80000.00");
        assertThat(b1.getTransactionCount()).isEqualTo(1L);

        RevenuePeriodBucketResponse b2 = timeline.get(1); // Ngày rỗng
        assertThat(b2.getPeriod()).isEqualTo("2026-11-02");
        assertThat(b2.getGrossRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(b2.getNetRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(b2.getTransactionCount()).isZero();

        RevenuePeriodBucketResponse b3 = timeline.get(2);
        assertThat(b3.getPeriod()).isEqualTo("2026-11-03");
        assertThat(b3.getGrossRevenue()).isEqualByComparingTo("200000.00");
        assertThat(b3.getNetRevenue()).isEqualByComparingTo("200000.00");
        assertThat(b3.getTransactionCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("getRevenueReport: groupBy = WEEK gom theo tuần với nhãn là ngày Thứ Hai")
    void testGetRevenueReport_groupByWeek() {
        // Tuần 1: Thứ Hai 2026-11-02 -> Chủ Nhật 2026-11-08
        // Tuần 2: Thứ Hai 2026-11-09 -> Chủ Nhật 2026-11-15
        LocalDate from = LocalDate.of(2026, 11, 4); // Thứ Tư
        LocalDate to = LocalDate.of(2026, 11, 12); // Thứ Năm tuần sau

        DailyRevenueProjection p1 = mock(DailyRevenueProjection.class);
        when(p1.getReportDate()).thenReturn(LocalDate.of(2026, 11, 5));
        when(p1.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(p1.getTotalAmount()).thenReturn(new BigDecimal("150000.00"));
        when(p1.getTransactionCount()).thenReturn(1L);

        DailyRevenueProjection p2 = mock(DailyRevenueProjection.class);
        when(p2.getReportDate()).thenReturn(LocalDate.of(2026, 11, 10));
        when(p2.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(p2.getTotalAmount()).thenReturn(new BigDecimal("250000.00"));
        when(p2.getTransactionCount()).thenReturn(2L);

        when(paymentRepository.findDailyRevenueAggregations(any(), any(), any()))
                .thenReturn(List.of(p1, p2));
        when(paymentRepository.findPaymentMethodRevenueAggregations(any(), any()))
                .thenReturn(Collections.emptyList());

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(from)
                .to(to)
                .groupBy(ReportGroupBy.WEEK)
                .build();

        RevenueReportResponse response = reportService.getRevenueReport(request);

        List<RevenuePeriodBucketResponse> timeline = response.getTimeline();
        assertThat(timeline).hasSize(2);

        RevenuePeriodBucketResponse w1 = timeline.get(0);
        assertThat(w1.getPeriod()).isEqualTo("2026-11-02"); // Thứ Hai của tuần 1
        assertThat(w1.getGrossRevenue()).isEqualByComparingTo("150000.00");

        RevenuePeriodBucketResponse w2 = timeline.get(1);
        assertThat(w2.getPeriod()).isEqualTo("2026-11-09"); // Thứ Hai của tuần 2
        assertThat(w2.getGrossRevenue()).isEqualByComparingTo("250000.00");
    }

    @Test
    @DisplayName("getRevenueReport: groupBy = MONTH gom theo tháng yyyy-MM")
    void testGetRevenueReport_groupByMonth() {
        LocalDate from = LocalDate.of(2026, 9, 15);
        LocalDate to = LocalDate.of(2026, 11, 10);

        DailyRevenueProjection p1 = mock(DailyRevenueProjection.class);
        when(p1.getReportDate()).thenReturn(LocalDate.of(2026, 9, 20));
        when(p1.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(p1.getTotalAmount()).thenReturn(new BigDecimal("100000.00"));
        when(p1.getTransactionCount()).thenReturn(1L);

        DailyRevenueProjection p2 = mock(DailyRevenueProjection.class);
        when(p2.getReportDate()).thenReturn(LocalDate.of(2026, 11, 5));
        when(p2.getStatus()).thenReturn(PaymentStatus.SUCCESS);
        when(p2.getTotalAmount()).thenReturn(new BigDecimal("300000.00"));
        when(p2.getTransactionCount()).thenReturn(2L);

        when(paymentRepository.findDailyRevenueAggregations(any(), any(), any()))
                .thenReturn(List.of(p1, p2));
        when(paymentRepository.findPaymentMethodRevenueAggregations(any(), any()))
                .thenReturn(Collections.emptyList());

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(from)
                .to(to)
                .groupBy(ReportGroupBy.MONTH)
                .build();

        RevenueReportResponse response = reportService.getRevenueReport(request);

        List<RevenuePeriodBucketResponse> timeline = response.getTimeline();
        assertThat(timeline).hasSize(3); // 2026-09, 2026-10, 2026-11

        assertThat(timeline.get(0).getPeriod()).isEqualTo("2026-09");
        assertThat(timeline.get(0).getGrossRevenue()).isEqualByComparingTo("100000.00");

        assertThat(timeline.get(1).getPeriod()).isEqualTo("2026-10");
        assertThat(timeline.get(1).getGrossRevenue()).isEqualByComparingTo(BigDecimal.ZERO); // Tháng rỗng

        assertThat(timeline.get(2).getPeriod()).isEqualTo("2026-11");
        assertThat(timeline.get(2).getGrossRevenue()).isEqualByComparingTo("300000.00");
    }

    @Test
    @DisplayName("Guards ngày: from > to ném 400 BAD_REQUEST")
    void testDateGuard_fromAfterTo() {
        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(LocalDate.of(2026, 11, 5))
                .to(LocalDate.of(2026, 11, 1))
                .build();

        assertThatThrownBy(() -> reportService.getRevenueReport(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST)
                .hasMessage("Ngày bắt đầu không được sau ngày kết thúc");
    }

    @Test
    @DisplayName("Guards ngày: kỳ dài hơn 366 ngày ném 400 BAD_REQUEST")
    void testDateGuard_exceed366Days() {
        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(LocalDate.of(2025, 1, 1))
                .to(LocalDate.of(2026, 2, 1)) // 397 ngày
                .build();

        assertThatThrownBy(() -> reportService.getRevenueReport(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST)
                .hasMessage("Khoảng thời gian báo cáo không được vượt quá 366 ngày");
    }

    @Test
    @DisplayName("getOccupancyReport: tính toán đúng tổng slot, tỉ lệ lấp đầy toàn cụm và theo ngày")
    void testGetOccupancyReport_allCourts() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 2);

        when(timeSlotRepository.count()).thenReturn(2L); // 2 timeslots
        when(courtRepository.findByStatus(CourtStatus.AVAILABLE)).thenReturn(List.of(court1, court2)); // 2 sân

        // Mẫu số toàn kỳ = 2 sân * 2 timeslots * 2 ngày = 8 slots
        // Booking: ngày 1 có sân 1: 2 bookings; ngày 2 có sân 2: 1 booking. Tổng = 3 bookings
        DailyCourtOccupancyProjection o1 = mock(DailyCourtOccupancyProjection.class);
        when(o1.getBookingDate()).thenReturn(LocalDate.of(2026, 11, 1));
        when(o1.getCourtId()).thenReturn(1L);
        when(o1.getBookedCount()).thenReturn(2L);

        DailyCourtOccupancyProjection o2 = mock(DailyCourtOccupancyProjection.class);
        when(o2.getBookingDate()).thenReturn(LocalDate.of(2026, 11, 2));
        when(o2.getCourtId()).thenReturn(2L);
        when(o2.getBookedCount()).thenReturn(1L);

        when(bookingRepository.findOccupancyAggregations(eq(from), eq(to), any()))
                .thenReturn(List.of(o1, o2));

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(from)
                .to(to)
                .build();

        OccupancyReportResponse response = reportService.getOccupancyReport(request);

        assertThat(response.getTotalSlots()).isEqualTo(8L);
        assertThat(response.getBookedSlots()).isEqualTo(3L);
        // overallRate = (3 * 100) / 8 = 37.50%
        assertThat(response.getOverallRate()).isEqualByComparingTo("37.50");

        // Daily
        List<DailyOccupancyResponse> daily = response.getDaily();
        assertThat(daily).hasSize(2);
        assertThat(daily.get(0).getDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(daily.get(0).getBookedSlots()).isEqualTo(2L);
        assertThat(daily.get(0).getTotalSlots()).isEqualTo(4L);
        assertThat(daily.get(0).getOccupancyRate()).isEqualByComparingTo("50.00");

        assertThat(daily.get(1).getDate()).isEqualTo(LocalDate.of(2026, 11, 2));
        assertThat(daily.get(1).getBookedSlots()).isEqualTo(1L);
        assertThat(daily.get(1).getTotalSlots()).isEqualTo(4L);
        assertThat(daily.get(1).getOccupancyRate()).isEqualByComparingTo("25.00");

        // byCourt
        List<CourtOccupancyResponse> byCourt = response.getByCourt();
        assertThat(byCourt).hasSize(2);
        CourtOccupancyResponse c1 = byCourt.stream().filter(c -> c.getCourtId().equals(1L)).findFirst().orElseThrow();
        assertThat(c1.getBookedSlots()).isEqualTo(2L);
        assertThat(c1.getTotalSlots()).isEqualTo(4L);
        assertThat(c1.getOccupancyRate()).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("getOccupancyReport: lọc theo courtId cụ thể")
    void testGetOccupancyReport_singleCourt() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 2);

        when(courtRepository.findById(1L)).thenReturn(Optional.of(court1));
        when(timeSlotRepository.count()).thenReturn(2L);

        DailyCourtOccupancyProjection o1 = mock(DailyCourtOccupancyProjection.class);
        when(o1.getBookingDate()).thenReturn(LocalDate.of(2026, 11, 1));
        when(o1.getBookedCount()).thenReturn(2L);

        when(bookingRepository.findOccupancyAggregationsByCourt(eq(from), eq(to), eq(1L), any()))
                .thenReturn(List.of(o1));

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(from)
                .to(to)
                .courtId(1L)
                .build();

        OccupancyReportResponse response = reportService.getOccupancyReport(request);

        // Mẫu số khi có courtId = 1 sân * 2 timeslot * 2 ngày = 4 slots
        assertThat(response.getTotalSlots()).isEqualTo(4L);
        assertThat(response.getBookedSlots()).isEqualTo(2L);
        assertThat(response.getOverallRate()).isEqualByComparingTo("50.00");
        assertThat(response.getByCourt()).hasSize(1);
        assertThat(response.getByCourt().get(0).getCourtId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getOccupancyReport: courtId không tồn tại ném 404 COURT_NOT_FOUND")
    void testGetOccupancyReport_courtNotFound() {
        when(courtRepository.findById(999L)).thenReturn(Optional.empty());

        ReportRangeRequest request = ReportRangeRequest.builder()
                .courtId(999L)
                .build();

        assertThatThrownBy(() -> reportService.getOccupancyReport(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COURT_NOT_FOUND);
    }

    @Test
    @DisplayName("getOccupancyReport: không có sân AVAILABLE -> rate = 0.00, không bị lỗi chia cho 0")
    void testGetOccupancyReport_zeroAvailableCourts_noDivisionByZero() {
        when(courtRepository.findByStatus(CourtStatus.AVAILABLE)).thenReturn(Collections.emptyList());
        when(timeSlotRepository.count()).thenReturn(2L);
        when(bookingRepository.findOccupancyAggregations(any(), any(), any())).thenReturn(Collections.emptyList());

        ReportRangeRequest request = ReportRangeRequest.builder()
                .from(LocalDate.of(2026, 11, 1))
                .to(LocalDate.of(2026, 11, 2))
                .build();

        OccupancyReportResponse response = reportService.getOccupancyReport(request);

        assertThat(response.getTotalSlots()).isZero();
        assertThat(response.getOverallRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
