package com.badminton.benchmark;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.repository.VoucherUsageRepository;
import com.badminton.modules.voucher.service.VoucherService;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class SystemLoadBenchmarkTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherUsageRepository voucherUsageRepository;

    @Autowired
    private UserRepository userRepository;

    private User customer;
    private Court court;
    private TimeSlot slot;
    private LocalDate targetDate;

    @BeforeEach
    void setUp() {
        customer = userRepository.findByEmail("customer@badminton.com")
                .orElseThrow(() -> new IllegalStateException("customer@badminton.com must exist from DataSeeder"));

        court = courtRepository.findAll().stream()
                .filter(c -> c.getStatus() == CourtStatus.AVAILABLE)
                .findFirst()
                .orElseThrow();

        slot = timeSlotRepository.findAll().stream()
                .findFirst()
                .orElseThrow();

        targetDate = LocalDate.now().plusDays(2);
    }

    private void authenticateAs(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("BENCHMARK 1: Đọc lịch trống (Availability) với 1,000 requests đồng thời")
    void benchmark1_readAvailability_1000Requests() throws InterruptedException {
        int totalRequests = 1000;
        runReadBenchmark("KỊCH BẢN 1: ĐỌC DỮ LIỆU LỊCH TRỐNG (1,000 REQUESTS)", totalRequests);
    }

    @Test
    @DisplayName("BENCHMARK 2: Đọc lịch trống (Availability) với 10,000 requests đồng thời (Virtual Threads)")
    void benchmark2_readAvailability_10000Requests() throws InterruptedException {
        int totalRequests = 10000;
        runReadBenchmark("KỊCH BẢN 2: STRESS TEST CÔNG SUẤT ĐỌC (10,000 REQUESTS QUA VIRTUAL THREADS)", totalRequests);
    }

    private void runReadBenchmark(String title, int totalRequests) throws InterruptedException {
        // Warm up JVM JIT compiler
        for (int i = 0; i < 50; i++) {
            bookingService.getAvailability(targetDate, court.getId(), null);
        }

        CountDownLatch readyLatch = new CountDownLatch(totalRequests);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalRequests);

        List<Long> latenciesNano = Collections.synchronizedList(new ArrayList<>(totalRequests));
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < totalRequests; i++) {
                executor.submit(() -> {
                    readyLatch.countDown();
                    try {
                        startLatch.await();
                        long start = System.nanoTime();
                        bookingService.getAvailability(targetDate, court.getId(), null);
                        long elapsed = System.nanoTime() - start;
                        latenciesNano.add(elapsed);
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            readyLatch.await();
            long benchmarkStart = System.currentTimeMillis();
            startLatch.countDown(); // Bắn đồng thời toàn bộ requests
            doneLatch.await();
            long totalDurationMs = System.currentTimeMillis() - benchmarkStart;

            BenchmarkReport report = calculateReport(
                    title, totalRequests, totalRequests, totalDurationMs,
                    latenciesNano, successCount.get(), 0, errorCount.get());
            report.printToConsole();

            assertThat(errorCount.get()).isZero();
            assertThat(successCount.get()).isEqualTo(totalRequests);
        }
    }

    @Test
    @DisplayName("BENCHMARK 3: Tranh chấp Giờ Vàng (Hotspot Booking) - 1,000 user đặt cùng 1 slot sân")
    void benchmark3_hotspotBookingContention_1000Requests() throws InterruptedException {
        int totalRequests = 1000;
        // Chọn ngày xa hẳn trong hạn 30 ngày để không va chạm các test khác
        LocalDate bookingDate = LocalDate.now().plusDays(28);

        // Đảm bảo slot chưa bị ai đặt trước đó (chỉ dọn đúng slot này nếu có)
        bookingRepository.findAll().stream()
                .filter(b -> b.getCourt().getId().equals(court.getId())
                        && b.getBookingDate().equals(bookingDate)
                        && b.getTimeSlot().getId().equals(slot.getId()))
                .forEach(bookingRepository::delete);

        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(court.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot.getId())
                .note("Stress test booking contention")
                .build();

        CountDownLatch readyLatch = new CountDownLatch(totalRequests);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalRequests);

        List<Long> latenciesNano = Collections.synchronizedList(new ArrayList<>(totalRequests));
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger slotBookedConflictCount = new AtomicInteger(0);
        AtomicInteger unexpectedErrorCount = new AtomicInteger(0);
        AtomicReference<Long> createdBookingId = new AtomicReference<>();

        try {
            try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
                for (int i = 0; i < totalRequests; i++) {
                    executor.submit(() -> {
                        authenticateAs(customer);
                        readyLatch.countDown();
                        long start = 0;
                        try {
                            startLatch.await();
                            start = System.nanoTime();
                            BookingResponse response = bookingService.createBooking(request);
                            long elapsed = System.nanoTime() - start;
                            latenciesNano.add(elapsed);
                            createdBookingId.set(response.getId());
                            successCount.incrementAndGet();
                        } catch (AppException e) {
                            long elapsed = System.nanoTime() - start;
                            latenciesNano.add(elapsed);
                            if (e.getErrorCode() == ErrorCode.SLOT_ALREADY_BOOKED) {
                                slotBookedConflictCount.incrementAndGet();
                            } else {
                                unexpectedErrorCount.incrementAndGet();
                            }
                        } catch (Exception e) {
                            long elapsed = (start > 0) ? (System.nanoTime() - start) : 0;
                            latenciesNano.add(elapsed);
                            unexpectedErrorCount.incrementAndGet();
                        } finally {
                            doneLatch.countDown();
                        }
                    });
                }

                readyLatch.await();
                long benchmarkStart = System.currentTimeMillis();
                startLatch.countDown();
                doneLatch.await();
                long totalDurationMs = System.currentTimeMillis() - benchmarkStart;

                BenchmarkReport report = calculateReport(
                        "KỊCH BẢN 3: TRANH CHẤP GIỜ VÀNG (1,000 LUỒNG CÙNG ĐẶT 1 KHUNG GIỜ)",
                        totalRequests, totalRequests, totalDurationMs,
                        latenciesNano, successCount.get(), slotBookedConflictCount.get(), unexpectedErrorCount.get());
                report.printToConsole();

                // Tính toàn vẹn dữ liệu: Đúng 1 người thắng, 999 người bị từ chối 409, 0 lỗi hệ thống 500!
                assertThat(successCount.get()).isEqualTo(1);
                assertThat(slotBookedConflictCount.get()).isEqualTo(totalRequests - 1);
                assertThat(unexpectedErrorCount.get()).isZero();
            }
        } finally {
            // Dọn đúng booking do test này tạo ra, không xóa dữ liệu test khác
            if (createdBookingId.get() != null) {
                bookingRepository.deleteById(createdBookingId.get());
            }
        }
    }

    @Test
    @DisplayName("BENCHMARK 4: Flash Sale Voucher Contention - 1,000 user tranh 10 voucher giới hạn")
    void benchmark4_voucherFlashSaleContention_1000Requests() throws InterruptedException {
        int totalRequests = 1000;
        int limit = 10;

        // Sinh code duy nhất mỗi lần chạy để chống test pollution
        String voucherCode = "FLASH10_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        Voucher voucher = voucherRepository.save(Voucher.builder()
                .code(voucherCode)
                .name("Flash sale 10 slot")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000.00"))
                .minOrderAmount(new BigDecimal("10000.00"))
                .usageLimit(limit)
                .usedCount(0)
                .userUsageLimit(100)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .active(true)
                .build());

        // Chuẩn bị 1,000 booking độc lập
        List<Booking> bookings = new ArrayList<>();
        for (int i = 0; i < totalRequests; i++) {
            bookings.add(bookingRepository.save(Booking.builder()
                    .user(customer)
                    .court(court)
                    .timeSlot(slot)
                    .bookingDate(targetDate)
                    .status(BookingStatus.PENDING)
                    .totalAmount(new BigDecimal("100000.00"))
                    .build()));
        }
        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();

        CountDownLatch readyLatch = new CountDownLatch(totalRequests);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalRequests);

        List<Long> latenciesNano = Collections.synchronizedList(new ArrayList<>(totalRequests));
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger usageExceededCount = new AtomicInteger(0);
        AtomicInteger unexpectedErrorCount = new AtomicInteger(0);

        try {
            try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
                for (int i = 0; i < totalRequests; i++) {
                    final Long bookingId = bookingIds.get(i);
                    executor.submit(() -> {
                        authenticateAs(customer);
                        readyLatch.countDown();
                        long start = 0;
                        try {
                            startLatch.await();
                            start = System.nanoTime();
                            voucherService.applyVoucher(new ApplyVoucherRequest(bookingId, voucherCode));
                            long elapsed = System.nanoTime() - start;
                            latenciesNano.add(elapsed);
                            successCount.incrementAndGet();
                        } catch (AppException e) {
                            long elapsed = System.nanoTime() - start;
                            latenciesNano.add(elapsed);
                            if (e.getErrorCode() == ErrorCode.VOUCHER_USAGE_EXCEEDED) {
                                usageExceededCount.incrementAndGet();
                            } else {
                                unexpectedErrorCount.incrementAndGet();
                            }
                        } catch (Exception e) {
                            long elapsed = (start > 0) ? (System.nanoTime() - start) : 0;
                            latenciesNano.add(elapsed);
                            unexpectedErrorCount.incrementAndGet();
                        } finally {
                            doneLatch.countDown();
                        }
                    });
                }

                readyLatch.await();
                long benchmarkStart = System.currentTimeMillis();
                startLatch.countDown();
                doneLatch.await();
                long totalDurationMs = System.currentTimeMillis() - benchmarkStart;

                BenchmarkReport report = calculateReport(
                        "KỊCH BẢN 4: FLASH SALE VOUCHER (1,000 LUỒNG TRANH 10 SUẤT GIẢM GIÁ)",
                        totalRequests, totalRequests, totalDurationMs,
                        latenciesNano, successCount.get(), usageExceededCount.get(), unexpectedErrorCount.get());
                report.printToConsole();

                // Đúng 10 suất thành công, 990 suất còn lại bị từ chối 400 VOUCHER_USAGE_EXCEEDED, 0 thất thoát!
                assertThat(successCount.get()).isEqualTo(limit);
                assertThat(usageExceededCount.get()).isEqualTo(totalRequests - limit);
                assertThat(unexpectedErrorCount.get()).isZero();
            }
        } finally {
            // Dọn dẹp đúng dữ liệu do chính test này tạo ra
            for (Long bId : bookingIds) {
                voucherUsageRepository.findByBookingId(bId).ifPresent(voucherUsageRepository::delete);
            }
            if (voucher.getId() != null) {
                voucherRepository.deleteById(voucher.getId());
            }
            bookingRepository.deleteAllById(bookingIds);
        }
    }

    private BenchmarkReport calculateReport(
            String title, int totalRequests, int concurrency, long totalDurationMs,
            List<Long> latenciesNano, int success, int conflicts, int errors) {
        List<Long> sorted = new ArrayList<>(latenciesNano);
        Collections.sort(sorted);

        double rps = (totalDurationMs > 0) ? (totalRequests * 1000.0) / totalDurationMs : totalRequests;

        double min = sorted.isEmpty() ? 0 : sorted.getFirst() / 1_000_000.0;
        double max = sorted.isEmpty() ? 0 : sorted.getLast() / 1_000_000.0;
        double avg = sorted.isEmpty() ? 0
                : sorted.stream().mapToLong(Long::longValue).average().orElse(0) / 1_000_000.0;
        double p50 = getPercentile(sorted, 50);
        double p90 = getPercentile(sorted, 90);
        double p95 = getPercentile(sorted, 95);
        double p99 = getPercentile(sorted, 99);

        return new BenchmarkReport(
                title, totalRequests, concurrency, totalDurationMs, rps,
                min, avg, p50, p90, p95, p99, max,
                success, conflicts, errors);
    }

    private double getPercentile(List<Long> sorted, double percentile) {
        if (sorted.isEmpty())
            return 0;
        int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
        index = Math.max(0, Math.min(index, sorted.size() - 1));
        return sorted.get(index) / 1_000_000.0;
    }

    public record BenchmarkReport(
            String title, int totalRequests, int concurrency, long durationMs, double rps,
            double minMs, double avgMs, double p50Ms, double p90Ms, double p95Ms, double p99Ms, double maxMs,
            int success, int conflicts, int errors) {
        public void printToConsole() {
            System.out.println(
                    "\n=========================================================================================");
            System.out.println("📊 BÁO CÁO ĐO LƯỜNG HIỆU NĂNG & KHẢ NĂNG CHỊU TẢI (STRESS TEST BENCHMARK)");
            System.out.println("🏷️  " + title);
            System.out.println(
                    "-----------------------------------------------------------------------------------------");
            System.out.printf("• Tổng số requests:           %,d reqs\n", totalRequests);
            System.out.printf("• Luồng đồng thời:            %,d Virtual Threads (Java 23 Project Loom)\n",
                    concurrency);
            System.out.printf("• Tổng thời gian hoàn thành:  %,d ms (%.2f giây)\n", durationMs, durationMs / 1000.0);
            System.out.printf("• THÔNG LƯỢNG (THROUGHPUT):   %,.2f req/s (RPS)\n", rps);
            System.out.println(
                    "-----------------------------------------------------------------------------------------");
            System.out.printf("• Giao dịch thành công (200): %,d (%.2f%%)\n", success,
                    (success * 100.0) / totalRequests);
            if (conflicts > 0) {
                System.out.printf(
                        "• Xung đột nghiệp vụ chặn:    %,d (%.2f%%) [Mã 409 Conflict / 400 Guards - Chuẩn thiết kế]\n",
                        conflicts, (conflicts * 100.0) / totalRequests);
            }
            System.out.printf("• Lỗi hệ thống ngoài ý muốn:  %,d (%.2f%%) [HTTP 500 / Timeout]\n",
                    errors, (errors * 100.0) / totalRequests);
            System.out.println(
                    "-----------------------------------------------------------------------------------------");
            System.out.println("⏱️  PHÂN BỐ THỜI GIAN ĐÁP ỨNG (LATENCY DISTRIBUTION):");
            System.out.printf("   - Nhanh nhất (Min):          %8.2f ms\n", minMs);
            System.out.printf("   - Trung bình (Avg):          %8.2f ms\n", avgMs);
            System.out.printf("   - Trung vị (P50 - 50%% users):%8.2f ms\n", p50Ms);
            System.out.printf("   - Phân vị P90 (90%% users):   %8.2f ms\n", p90Ms);
            System.out.printf("   - Phân vị P95 (95%% users):   %8.2f ms\n", p95Ms);
            System.out.printf("   - Phân vị P99 (99%% users):   %8.2f ms\n", p99Ms);
            System.out.printf("   - Lâu nhất (Max):            %8.2f ms\n", maxMs);
            System.out.println(
                    "=========================================================================================\n");
        }
    }
}
