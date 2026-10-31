package com.badminton.modules.voucher;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.entity.VoucherUsage;
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
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class VoucherConcurrencyTest {

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherUsageRepository voucherUsageRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private User customer;
    private Court court;
    private TimeSlot slot;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        voucherUsageRepository.deleteAll();
        voucherRepository.deleteAll();

        now = LocalDateTime.now();
        customer = userRepository.findByEmail("customer@badminton.com")
                .orElseThrow();

        court = courtRepository.findAll().stream()
                .filter(c -> c.getStatus() == CourtStatus.AVAILABLE)
                .findFirst()
                .orElseThrow();

        slot = timeSlotRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
    }

    private void authenticateAs(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Kịch bản 1: 2 voucher khác nhau áp cùng lúc vào 1 booking PENDING -> Khóa kép (Booking + Voucher) bảo đảm đúng 1 bên thành công, bên còn lại nhận 409 VOUCHER_ALREADY_APPLIED hoặc BOOKING_NOT_PAYABLE")
    void concurrentApply_twoDifferentVouchers_onlyOneSucceeds() throws InterruptedException {
        Booking booking = bookingRepository.save(Booking.builder()
                .user(customer)
                .court(court)
                .timeSlot(slot)
                .bookingDate(LocalDate.now().plusDays(2))
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("300000.00"))
                .note("Booking test concurrency 2 vouchers")
                .build());

        Voucher voucherA = voucherRepository.save(Voucher.builder()
                .code("VOUCHER_A")
                .name("Voucher A 30K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("30000.00"))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(10))
                .active(true)
                .build());

        Voucher voucherB = voucherRepository.save(Voucher.builder()
                .code("VOUCHER_B")
                .name("Voucher B 50K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000.00"))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(10))
                .active(true)
                .build());

        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        // Thread 1: áp Voucher A
        executor.submit(() -> {
            authenticateAs(customer);
            readyLatch.countDown();
            try {
                startLatch.await();
                voucherService.applyVoucher(ApplyVoucherRequest.builder()
                        .bookingId(booking.getId())
                        .code("VOUCHER_A")
                        .build());
                successCount.incrementAndGet();
            } catch (AppException ex) {
                if (ex.getErrorCode() == ErrorCode.VOUCHER_ALREADY_APPLIED
                        || ex.getErrorCode() == ErrorCode.BOOKING_NOT_PAYABLE) {
                    conflictCount.incrementAndGet();
                }
            } catch (Exception ignored) {
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread 2: áp Voucher B
        executor.submit(() -> {
            authenticateAs(customer);
            readyLatch.countDown();
            try {
                startLatch.await();
                voucherService.applyVoucher(ApplyVoucherRequest.builder()
                        .bookingId(booking.getId())
                        .code("VOUCHER_B")
                        .build());
                successCount.incrementAndGet();
            } catch (AppException ex) {
                if (ex.getErrorCode() == ErrorCode.VOUCHER_ALREADY_APPLIED
                        || ex.getErrorCode() == ErrorCode.BOOKING_NOT_PAYABLE) {
                    conflictCount.incrementAndGet();
                }
            } catch (Exception ignored) {
            } finally {
                doneLatch.countDown();
            }
        });

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown(); // Kích hoạt 2 luồng đồng thời
        assertThat(doneLatch.await(10, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        // Kiểm tra đúng 1 bên thành công, 1 bên bị conflict 409
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);

        // Kiểm tra DB: Chỉ có đúng 1 bản ghi VoucherUsage cho booking này
        List<VoucherUsage> usages = voucherUsageRepository.findAll();
        assertThat(usages).hasSize(1);

        // Kiểm tra totalAmount chỉ giảm đúng 1 lần (hoặc 270.000 hoặc 250.000, không bao giờ là 220.000)
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updatedBooking.getTotalAmount()).isIn(
                new BigDecimal("270000.00"),
                new BigDecimal("250000.00")
        );
    }

    @Test
    @DisplayName("Kịch bản 2: Nhiều luồng cùng tranh chấp 1 voucher giới hạn usageLimit = 1 -> Khóa bi quan voucher bảo đảm chỉ đúng 1 luồng thành công, các luồng còn lại 400 VOUCHER_USAGE_EXCEEDED")
    void concurrentApply_limitedVoucher_budgetProtected() throws InterruptedException {
        Voucher limitedVoucher = voucherRepository.save(Voucher.builder()
                .code("ONLY_ONE")
                .name("Chỉ 1 lượt duy nhất")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000.00"))
                .usageLimit(1)
                .usedCount(0)
                .userUsageLimit(5)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(10))
                .active(true)
                .build());

        int threads = 6;
        List<Booking> testBookings = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            Booking b = bookingRepository.save(Booking.builder()
                    .user(customer)
                    .court(court)
                    .timeSlot(slot)
                    .bookingDate(LocalDate.now().plusDays(i + 1))
                    .status(BookingStatus.PENDING)
                    .totalAmount(new BigDecimal("200000.00"))
                    .note("Booking " + i)
                    .build());
            testBookings.add(b);
        }

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger usageExceededCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final int index = i;
            executor.submit(() -> {
                authenticateAs(customer);
                readyLatch.countDown();
                try {
                    startLatch.await();
                    voucherService.applyVoucher(ApplyVoucherRequest.builder()
                            .bookingId(testBookings.get(index).getId())
                            .code("ONLY_ONE")
                            .build());
                    successCount.incrementAndGet();
                } catch (AppException ex) {
                    if (ex.getErrorCode() == ErrorCode.VOUCHER_USAGE_EXCEEDED) {
                        usageExceededCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();
        assertThat(doneLatch.await(10, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        // Khẳng định chỉ đúng 1 luồng thành công, 5 luồng còn lại nhận lỗi VOUCHER_USAGE_EXCEEDED
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(usageExceededCount.get()).isEqualTo(5);

        // Voucher usedCount trong DB đúng bằng 1
        Voucher updatedVoucher = voucherRepository.findById(limitedVoucher.getId()).orElseThrow();
        assertThat(updatedVoucher.getUsedCount()).isEqualTo(1);
    }
}

