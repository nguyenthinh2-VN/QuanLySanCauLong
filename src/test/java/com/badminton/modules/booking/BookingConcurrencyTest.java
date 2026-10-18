package com.badminton.modules.booking;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.CreatePosBookingRequest;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
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

import java.time.LocalDate;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private Court court;
    private TimeSlot slot;
    private LocalDate bookingDate;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();

        user1 = userRepository.findByEmail("customer@badminton.com")
                .orElseThrow();

        user2 = userRepository.findByEmail("staff@badminton.com")
                .orElseThrow();

        court = courtRepository.findAll().stream()
                .filter(c -> c.getStatus() == CourtStatus.AVAILABLE)
                .findFirst()
                .orElseThrow();

        slot = timeSlotRepository.findAll().stream()
                .findFirst()
                .orElseThrow();

        bookingDate = LocalDate.now().plusDays(5);
    }

    @Test
    @DisplayName("2 luồng đồng thời đặt cùng 1 slot -> đúng 1 thành công (201), luồng còn lại nhận 409 SLOT_ALREADY_BOOKED")
    void concurrentBooking_onlyOneSucceeds() throws InterruptedException {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger conflictCount = new AtomicInteger();
        AtomicInteger otherErrorCount = new AtomicInteger();

        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(court.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot.getId())
                .note("Đặt chỗ đồng thời test lock")
                .build();

        Runnable task1 = () -> {
            try {
                CustomUserDetails userDetails = new CustomUserDetails(user1);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);

                readyLatch.countDown();
                startLatch.await();

                bookingService.createBooking(request);
                successCount.incrementAndGet();
            } catch (AppException e) {
                if (e.getErrorCode() == ErrorCode.SLOT_ALREADY_BOOKED) {
                    conflictCount.incrementAndGet();
                } else {
                    otherErrorCount.incrementAndGet();
                }
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
            } finally {
                SecurityContextHolder.clearContext();
                doneLatch.countDown();
            }
        };

        Runnable task2 = () -> {
            try {
                CustomUserDetails userDetails = new CustomUserDetails(user2);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);

                readyLatch.countDown();
                startLatch.await();

                bookingService.createBooking(request);
                successCount.incrementAndGet();
            } catch (AppException e) {
                if (e.getErrorCode() == ErrorCode.SLOT_ALREADY_BOOKED) {
                    conflictCount.incrementAndGet();
                } else {
                    otherErrorCount.incrementAndGet();
                }
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
            } finally {
                SecurityContextHolder.clearContext();
                doneLatch.countDown();
            }
        };

        executor.submit(task1);
        executor.submit(task2);

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        boolean completed = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(otherErrorCount.get()).isEqualTo(0);
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);

        long count = bookingRepository.count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("2 luồng: 1 luồng đặt Online, 1 luồng đặt tại quầy POS cùng slot -> đúng 1 thành công, 1 bị 409")
    void concurrentPosAndOnlineBooking_onlyOneSucceeds() throws InterruptedException {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger conflictCount = new AtomicInteger();
        AtomicInteger otherErrorCount = new AtomicInteger();

        CreateBookingRequest onlineRequest = CreateBookingRequest.builder()
                .courtId(court.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot.getId())
                .note("Khách đặt online")
                .build();

        CreatePosBookingRequest posRequest = CreatePosBookingRequest.builder()
                .courtId(court.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot.getId())
                .guestName("Khách Quầy")
                .guestPhone("0988776655")
                .note("Nhân viên đặt tại quầy")
                .build();

        Runnable onlineTask = () -> {
            try {
                CustomUserDetails userDetails = new CustomUserDetails(user1);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);

                readyLatch.countDown();
                startLatch.await();

                bookingService.createBooking(onlineRequest);
                successCount.incrementAndGet();
            } catch (AppException e) {
                if (e.getErrorCode() == ErrorCode.SLOT_ALREADY_BOOKED) {
                    conflictCount.incrementAndGet();
                } else {
                    otherErrorCount.incrementAndGet();
                }
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
            } finally {
                SecurityContextHolder.clearContext();
                doneLatch.countDown();
            }
        };

        Runnable posTask = () -> {
            try {
                readyLatch.countDown();
                startLatch.await();

                bookingService.createPosBooking(posRequest);
                successCount.incrementAndGet();
            } catch (AppException e) {
                if (e.getErrorCode() == ErrorCode.SLOT_ALREADY_BOOKED) {
                    conflictCount.incrementAndGet();
                } else {
                    otherErrorCount.incrementAndGet();
                }
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
            } finally {
                SecurityContextHolder.clearContext();
                doneLatch.countDown();
            }
        };

        executor.submit(onlineTask);
        executor.submit(posTask);

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        boolean completed = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(otherErrorCount.get()).isEqualTo(0);
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);

        long count = bookingRepository.count();
        assertThat(count).isEqualTo(1);
    }
}
