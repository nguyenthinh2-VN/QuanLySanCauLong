package com.badminton.modules.report.service.impl;

import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.payment.entity.PaymentStatus;
import com.badminton.modules.payment.repository.PaymentRepository;
import com.badminton.modules.report.dto.request.ReportGroupBy;
import com.badminton.modules.report.dto.request.ReportRangeRequest;
import com.badminton.modules.report.dto.response.CourtOccupancyResponse;
import com.badminton.modules.report.dto.response.DailyOccupancyResponse;
import com.badminton.modules.report.dto.response.OccupancyReportResponse;
import com.badminton.modules.report.dto.response.PaymentMethodBreakdownResponse;
import com.badminton.modules.report.dto.response.RevenuePeriodBucketResponse;
import com.badminton.modules.report.dto.response.RevenueReportResponse;
import com.badminton.modules.report.dto.response.RevenueTotalsResponse;
import com.badminton.modules.report.repository.projection.DailyCourtOccupancyProjection;
import com.badminton.modules.report.repository.projection.DailyRevenueProjection;
import com.badminton.modules.report.repository.projection.PaymentMethodRevenueProjection;
import com.badminton.modules.report.service.ReportService;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private static final long MAX_REPORT_DAYS = 366;
    private static final List<BookingStatus> OCCUPANCY_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED
    );

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final TimeSlotRepository timeSlotRepository;

    @Override
    public RevenueReportResponse getRevenueReport(ReportRangeRequest request) {
        DateRange range = resolveAndValidateDateRange(request);
        ReportGroupBy groupBy = (request != null && request.getGroupBy() != null)
                ? request.getGroupBy()
                : ReportGroupBy.DAY;

        LocalDateTime fromStart = range.from().atStartOfDay();
        LocalDateTime toEnd = range.to().atTime(LocalTime.MAX);

        List<DailyRevenueProjection> dailyAggs = paymentRepository.findDailyRevenueAggregations(
                fromStart, toEnd, List.of(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)
        );
        List<PaymentMethodRevenueProjection> methodAggs = paymentRepository.findPaymentMethodRevenueAggregations(
                fromStart, toEnd
        );

        // Aggregate daily data
        Map<LocalDate, DailyRevenueAccumulator> dailyMap = new HashMap<>();
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalRefunded = BigDecimal.ZERO;
        long totalSuccessTx = 0;

        for (DailyRevenueProjection agg : dailyAggs) {
            LocalDate date = agg.getReportDate();
            DailyRevenueAccumulator acc = dailyMap.computeIfAbsent(date, k -> new DailyRevenueAccumulator());

            if (agg.getStatus() == PaymentStatus.SUCCESS) {
                acc.gross = acc.gross.add(agg.getTotalAmount());
                acc.count += agg.getTransactionCount();
                totalGross = totalGross.add(agg.getTotalAmount());
                totalSuccessTx += agg.getTransactionCount();
            } else if (agg.getStatus() == PaymentStatus.REFUNDED) {
                acc.refunded = acc.refunded.add(agg.getTotalAmount());
                totalRefunded = totalRefunded.add(agg.getTotalAmount());
            }
        }

        BigDecimal netRevenue = totalGross.subtract(totalRefunded);
        RevenueTotalsResponse totals = RevenueTotalsResponse.builder()
                .grossRevenue(totalGross)
                .refundedAmount(totalRefunded)
                .netRevenue(netRevenue)
                .transactionCount(totalSuccessTx)
                .build();

        List<PaymentMethodBreakdownResponse> byPaymentMethod = methodAggs.stream()
                .map(m -> PaymentMethodBreakdownResponse.builder()
                        .paymentMethod(m.getPaymentMethod())
                        .grossRevenue(m.getTotalAmount())
                        .transactionCount(m.getTransactionCount())
                        .build())
                .toList();

        List<RevenuePeriodBucketResponse> timeline = buildRevenueTimeline(range.from(), range.to(), groupBy, dailyMap);

        return RevenueReportResponse.builder()
                .from(range.from())
                .to(range.to())
                .groupBy(groupBy)
                .totals(totals)
                .byPaymentMethod(byPaymentMethod)
                .timeline(timeline)
                .build();
    }

    @Override
    public OccupancyReportResponse getOccupancyReport(ReportRangeRequest request) {
        DateRange range = resolveAndValidateDateRange(request);
        Long courtId = (request != null) ? request.getCourtId() : null;

        Court selectedCourt = null;
        if (courtId != null) {
            selectedCourt = courtRepository.findById(courtId)
                    .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
        }

        long timeSlotsCount = timeSlotRepository.count();
        List<Court> availableCourts = courtRepository.findByStatus(CourtStatus.AVAILABLE);
        long courtCountForDenominator = (courtId != null) ? 1L : availableCourts.size();
        long totalDays = range.days();
        long totalSlots = courtCountForDenominator * timeSlotsCount * totalDays;

        List<DailyCourtOccupancyProjection> occupancyAggs = (courtId != null)
                ? bookingRepository.findOccupancyAggregationsByCourt(range.from(), range.to(), courtId, OCCUPANCY_STATUSES)
                : bookingRepository.findOccupancyAggregations(range.from(), range.to(), OCCUPANCY_STATUSES);

        long totalBookedSlots = occupancyAggs.stream()
                .mapToLong(DailyCourtOccupancyProjection::getBookedCount)
                .sum();

        BigDecimal overallRate = calculateRate(totalBookedSlots, totalSlots);

        // Daily breakdown
        Map<LocalDate, Long> dailyBookedMap = occupancyAggs.stream()
                .collect(Collectors.groupingBy(
                        DailyCourtOccupancyProjection::getBookingDate,
                        Collectors.summingLong(DailyCourtOccupancyProjection::getBookedCount)
                ));

        long dailyTotalSlots = courtCountForDenominator * timeSlotsCount;
        List<DailyOccupancyResponse> daily = new ArrayList<>();
        for (LocalDate d = range.from(); !d.isAfter(range.to()); d = d.plusDays(1)) {
            long booked = dailyBookedMap.getOrDefault(d, 0L);
            daily.add(DailyOccupancyResponse.builder()
                    .date(d)
                    .bookedSlots(booked)
                    .totalSlots(dailyTotalSlots)
                    .occupancyRate(calculateRate(booked, dailyTotalSlots))
                    .build());
        }

        // byCourt breakdown
        List<CourtOccupancyResponse> byCourt = new ArrayList<>();
        long singleCourtTotalSlots = timeSlotsCount * totalDays;

        if (courtId != null) {
            byCourt.add(CourtOccupancyResponse.builder()
                    .courtId(selectedCourt.getId())
                    .courtName(selectedCourt.getName())
                    .bookedSlots(totalBookedSlots)
                    .totalSlots(singleCourtTotalSlots)
                    .occupancyRate(calculateRate(totalBookedSlots, singleCourtTotalSlots))
                    .build());
        } else {
            Map<Long, Long> courtBookedMap = occupancyAggs.stream()
                    .collect(Collectors.groupingBy(
                            DailyCourtOccupancyProjection::getCourtId,
                            Collectors.summingLong(DailyCourtOccupancyProjection::getBookedCount)
                    ));

            for (Court c : availableCourts) {
                long booked = courtBookedMap.getOrDefault(c.getId(), 0L);
                byCourt.add(CourtOccupancyResponse.builder()
                        .courtId(c.getId())
                        .courtName(c.getName())
                        .bookedSlots(booked)
                        .totalSlots(singleCourtTotalSlots)
                        .occupancyRate(calculateRate(booked, singleCourtTotalSlots))
                        .build());
            }
        }

        return OccupancyReportResponse.builder()
                .from(range.from())
                .to(range.to())
                .overallRate(overallRate)
                .bookedSlots(totalBookedSlots)
                .totalSlots(totalSlots)
                .byCourt(byCourt)
                .daily(daily)
                .build();
    }

    private List<RevenuePeriodBucketResponse> buildRevenueTimeline(
            LocalDate from,
            LocalDate to,
            ReportGroupBy groupBy,
            Map<LocalDate, DailyRevenueAccumulator> dailyMap
    ) {
        List<RevenuePeriodBucketResponse> timeline = new ArrayList<>();

        switch (groupBy) {
            case DAY -> {
                for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                    DailyRevenueAccumulator acc = dailyMap.getOrDefault(d, new DailyRevenueAccumulator());
                    timeline.add(RevenuePeriodBucketResponse.builder()
                            .period(d.toString())
                            .grossRevenue(acc.gross)
                            .refundedAmount(acc.refunded)
                            .netRevenue(acc.gross.subtract(acc.refunded))
                            .transactionCount(acc.count)
                            .build());
                }
            }
            case WEEK -> {
                LocalDate firstMonday = from.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate lastMonday = to.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

                for (LocalDate monday = firstMonday; !monday.isAfter(lastMonday); monday = monday.plusWeeks(1)) {
                    LocalDate sunday = monday.plusDays(6);
                    BigDecimal weekGross = BigDecimal.ZERO;
                    BigDecimal weekRefunded = BigDecimal.ZERO;
                    long weekCount = 0;

                    for (LocalDate d = monday; !d.isAfter(sunday); d = d.plusDays(1)) {
                        DailyRevenueAccumulator acc = dailyMap.get(d);
                        if (acc != null) {
                            weekGross = weekGross.add(acc.gross);
                            weekRefunded = weekRefunded.add(acc.refunded);
                            weekCount += acc.count;
                        }
                    }

                    timeline.add(RevenuePeriodBucketResponse.builder()
                            .period(monday.toString())
                            .grossRevenue(weekGross)
                            .refundedAmount(weekRefunded)
                            .netRevenue(weekGross.subtract(weekRefunded))
                            .transactionCount(weekCount)
                            .build());
                }
            }
            case MONTH -> {
                YearMonth startMonth = YearMonth.from(from);
                YearMonth endMonth = YearMonth.from(to);

                for (YearMonth ym = startMonth; !ym.isAfter(endMonth); ym = ym.plusMonths(1)) {
                    BigDecimal monthGross = BigDecimal.ZERO;
                    BigDecimal monthRefunded = BigDecimal.ZERO;
                    long monthCount = 0;

                    for (Map.Entry<LocalDate, DailyRevenueAccumulator> entry : dailyMap.entrySet()) {
                        if (YearMonth.from(entry.getKey()).equals(ym)) {
                            monthGross = monthGross.add(entry.getValue().gross);
                            monthRefunded = monthRefunded.add(entry.getValue().refunded);
                            monthCount += entry.getValue().count;
                        }
                    }

                    timeline.add(RevenuePeriodBucketResponse.builder()
                            .period(ym.toString())
                            .grossRevenue(monthGross)
                            .refundedAmount(monthRefunded)
                            .netRevenue(monthGross.subtract(monthRefunded))
                            .transactionCount(monthCount)
                            .build());
                }
            }
        }

        return timeline;
    }

    private DateRange resolveAndValidateDateRange(ReportRangeRequest request) {
        LocalDate to = (request != null && request.getTo() != null) ? request.getTo() : LocalDate.now();
        LocalDate from = (request != null && request.getFrom() != null) ? request.getFrom() : to.minusDays(29);

        if (from.isAfter(to)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày bắt đầu không được sau ngày kết thúc");
        }

        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days > MAX_REPORT_DAYS) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Khoảng thời gian báo cáo không được vượt quá 366 ngày");
        }

        return new DateRange(from, to, days);
    }

    private BigDecimal calculateRate(long booked, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(booked)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private record DateRange(LocalDate from, LocalDate to, long days) {}

    private static class DailyRevenueAccumulator {
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;
        long count = 0;
    }
}

