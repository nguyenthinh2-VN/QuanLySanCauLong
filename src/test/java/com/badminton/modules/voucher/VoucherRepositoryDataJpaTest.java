package com.badminton.modules.voucher;

import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.entity.VoucherUsage;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.repository.VoucherUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class VoucherRepositoryDataJpaTest {

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherUsageRepository voucherUsageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CourtComplexRepository courtComplexRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private User user;
    private Booking booking;
    private Voucher activeVoucher;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();

        user = userRepository.save(User.builder()
                .email("testuser@test.com")
                .password("hashed")
                .fullName("Test User")
                .phone("0987654321")
                .active(true)
                .build());

        CourtComplex complex = courtComplexRepository.save(CourtComplex.builder()
                .name("Sân Cầu Giấy")
                .address("Cầu Giấy, Hà Nội")
                .status(ComplexStatus.ACTIVE)
                .build());

        Court court = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân 1")
                .status(CourtStatus.AVAILABLE)
                .build());

        TimeSlot timeSlot = timeSlotRepository.save(TimeSlot.builder()
                .name("Ca sáng")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(9, 0))
                .pricePerHour(BigDecimal.valueOf(100000))
                .build());

        booking = bookingRepository.save(Booking.builder()
                .court(court)
                .timeSlot(timeSlot)
                .user(user)
                .bookingDate(LocalDate.now().plusDays(1))
                .totalAmount(BigDecimal.valueOf(100000))
                .status(BookingStatus.PENDING)
                .build());

        activeVoucher = voucherRepository.save(Voucher.builder()
                .code("ACTIVE2026")
                .name("Voucher Đang Chạy")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .maxDiscountAmount(BigDecimal.valueOf(20000))
                .minOrderAmount(BigDecimal.valueOf(50000))
                .usageLimit(100)
                .usedCount(0)
                .userUsageLimit(3)
                .startDate(now.minusDays(2))
                .endDate(now.plusDays(15))
                .active(true)
                .build());
    }

    @Test
    @DisplayName("findByCode tìm chính xác mã voucher")
    void findByCode_Success() {
        Optional<Voucher> found = voucherRepository.findByCode("ACTIVE2026");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Voucher Đang Chạy");
    }

    @Test
    @DisplayName("existsByCode kiểm tra sự tồn tại của code")
    void existsByCode_Success() {
        assertThat(voucherRepository.existsByCode("ACTIVE2026")).isTrue();
        assertThat(voucherRepository.existsByCode("NOT_EXIST")).isFalse();
    }

    @Test
    @DisplayName("findByIdForUpdate khóa dòng và trả về đúng voucher")
    void findByIdForUpdate_Success() {
        Optional<Voucher> locked = voucherRepository.findByIdForUpdate(activeVoucher.getId());

        assertThat(locked).isPresent();
        assertThat(locked.get().getId()).isEqualTo(activeVoucher.getId());
    }

    @Test
    @DisplayName("findActiveVouchers chỉ lấy voucher active=true và trong khoảng start-end date")
    void findActiveVouchers_FiltersCorrectly() {
        // Voucher hết hạn
        voucherRepository.save(Voucher.builder()
                .code("EXPIRED")
                .name("Đã hết hạn")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .startDate(now.minusDays(10))
                .endDate(now.minusDays(1))
                .active(true)
                .build());

        // Voucher inactive
        voucherRepository.save(Voucher.builder()
                .code("INACTIVE")
                .name("Không kích hoạt")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(10))
                .active(false)
                .build());

        Page<Voucher> activePage = voucherRepository.findActiveVouchers(now, PageRequest.of(0, 10));

        assertThat(activePage.getContent()).hasSize(1);
        assertThat(activePage.getContent().get(0).getCode()).isEqualTo("ACTIVE2026");
    }

    @Test
    @DisplayName("VoucherUsageRepository đếm chính xác số lần user sử dụng voucher và kiểm tra existsByBookingId")
    void voucherUsageRepository_AuditTrail_Success() {
        assertThat(voucherUsageRepository.existsByBookingId(booking.getId())).isFalse();
        assertThat(voucherUsageRepository.countByVoucherIdAndUserId(activeVoucher.getId(), user.getId())).isEqualTo(0);

        VoucherUsage usage = voucherUsageRepository.save(VoucherUsage.builder()
                .voucher(activeVoucher)
                .user(user)
                .booking(booking)
                .discountAmount(BigDecimal.valueOf(10000))
                .orderAmount(BigDecimal.valueOf(100000))
                .usedAt(now)
                .build());

        assertThat(voucherUsageRepository.existsByBookingId(booking.getId())).isTrue();
        assertThat(voucherUsageRepository.countByVoucherIdAndUserId(activeVoucher.getId(), user.getId())).isEqualTo(1);

        Optional<VoucherUsage> foundUsage = voucherUsageRepository.findByBookingId(booking.getId());
        assertThat(foundUsage).isPresent();
        assertThat(foundUsage.get().getDiscountAmount()).isEqualByComparingTo("10000");
    }
}
