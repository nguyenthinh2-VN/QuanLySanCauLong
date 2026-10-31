package com.badminton.modules.voucher;

import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.entity.Booking;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.dto.response.ApplyVoucherResponse;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.entity.VoucherUsage;
import com.badminton.modules.voucher.mapper.VoucherMapper;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.repository.VoucherUsageRepository;
import com.badminton.modules.voucher.service.impl.VoucherServiceImpl;
import com.badminton.modules.voucher.strategy.DiscountStrategy;
import com.badminton.modules.voucher.strategy.DiscountStrategyFactory;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VoucherServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private VoucherUsageRepository voucherUsageRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DiscountStrategyFactory discountStrategyFactory;

    @Mock
    private DiscountStrategy discountStrategy;

    @Mock
    private VoucherMapper voucherMapper;

    @Mock
    private jakarta.persistence.EntityManager entityManager;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private User customerUser;
    private User staffUser;
    private Booking booking;
    private Voucher voucher;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();

        Role customerRole = Role.builder().name(RoleType.ROLE_CUSTOMER).build();
        customerUser = User.builder()
                .email("customer@test.com")
                .fullName("Nguyễn Văn Khách")
                .roles(Set.of(customerRole))
                .build();
        customerUser.setId(10L);

        Role staffRole = Role.builder().name(RoleType.ROLE_STAFF).build();
        staffUser = User.builder()
                .email("staff@test.com")
                .fullName("Nhân Viên Quầy")
                .roles(Set.of(staffRole))
                .build();
        staffUser.setId(20L);

        booking = Booking.builder()
                .user(customerUser)
                .totalAmount(BigDecimal.valueOf(200000))
                .status(BookingStatus.PENDING)
                .build();
        booking.setId(100L);

        voucher = Voucher.builder()
                .code("GIAM20")
                .name("Giảm 20%")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(50000))
                .minOrderAmount(BigDecimal.valueOf(100000))
                .usageLimit(50)
                .usedCount(0)
                .userUsageLimit(2)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(10))
                .active(true)
                .build();
        voucher.setId(1L);

        // Giả lập login customer
        CustomUserDetails userDetails = new CustomUserDetails(customerUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Lấy danh sách active vouchers thành công")
    void getActiveVouchers_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Voucher> page = new PageImpl<>(List.of(voucher), pageable, 1);
        VoucherResponse responseDto = VoucherResponse.builder().id(1L).code("GIAM20").build();

        when(voucherRepository.findActiveVouchers(any(LocalDateTime.class), eq(pageable))).thenReturn(page);
        when(voucherMapper.toResponse(voucher)).thenReturn(responseDto);

        PageResponse<VoucherResponse> response = voucherService.getActiveVouchers(pageable);

        assertThat(response).isNotNull();
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("Áp voucher PERCENTAGE thành công, giảm đúng 40.000đ, totalAmount còn 160.000đ")
    void applyVoucher_Percentage_Success() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("giam20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 10L)).thenReturn(0L);
        when(discountStrategyFactory.getStrategy(DiscountType.PERCENTAGE)).thenReturn(discountStrategy);
        when(discountStrategy.calculateDiscount(voucher, BigDecimal.valueOf(200000)))
                .thenReturn(BigDecimal.valueOf(40000));

        ApplyVoucherResponse response = voucherService.applyVoucher(request);

        assertThat(response).isNotNull();
        assertThat(response.getBookingId()).isEqualTo(100L);
        assertThat(response.getVoucherCode()).isEqualTo("GIAM20");
        assertThat(response.getOriginalAmount()).isEqualByComparingTo("200000");
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("40000");
        assertThat(response.getFinalAmount()).isEqualByComparingTo("160000");

        assertThat(booking.getTotalAmount()).isEqualByComparingTo("160000");
        assertThat(voucher.getUsedCount()).isEqualTo(1);

        verify(bookingRepository).save(booking);
        verify(voucherUsageRepository).save(any(VoucherUsage.class));
        verify(voucherRepository).save(voucher);
    }

    @Test
    @DisplayName("Áp voucher FIXED_AMOUNT thành công")
    void applyVoucher_FixedAmount_Success() {
        voucher.setDiscountType(DiscountType.FIXED_AMOUNT);
        voucher.setDiscountValue(BigDecimal.valueOf(30000));

        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 10L)).thenReturn(0L);
        when(discountStrategyFactory.getStrategy(DiscountType.FIXED_AMOUNT)).thenReturn(discountStrategy);
        when(discountStrategy.calculateDiscount(voucher, BigDecimal.valueOf(200000)))
                .thenReturn(BigDecimal.valueOf(30000));

        ApplyVoucherResponse response = voucherService.applyVoucher(request);

        assertThat(response).isNotNull();
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("30000");
        assertThat(response.getFinalAmount()).isEqualByComparingTo("170000");
    }

    @Test
    @DisplayName("Áp voucher thất bại khi mã voucher không tồn tại -> 404 VOUCHER_NOT_FOUND")
    void applyVoucher_VoucherNotFound_ThrowsException() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("NOTEXIST")
                .build();

        when(voucherRepository.findByCode("NOTEXIST")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_NOT_FOUND);

        verify(bookingRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("Áp voucher thất bại khi booking không tồn tại -> 404 BOOKING_NOT_FOUND")
    void applyVoucher_BookingNotFound_ThrowsException() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(999L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi booking không ở trạng thái PENDING -> 409 BOOKING_NOT_PAYABLE")
    void applyVoucher_BookingNotPending_ThrowsException() {
        booking.setStatus(BookingStatus.CONFIRMED);
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BOOKING_NOT_PAYABLE);
    }

    @Test
    @DisplayName("Khách áp voucher cho booking của người khác -> 403 ACCESS_DENIED")
    void applyVoucher_NotOwner_ThrowsException() {
        User otherUser = User.builder().email("other@test.com").build();
        otherUser.setId(99L);
        booking.setUser(otherUser);

        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("Nhân viên STAFF có quyền áp voucher cho booking của khách")
    void applyVoucher_StaffCanApplyForCustomer_Success() {
        // Đăng nhập bằng Staff
        CustomUserDetails staffDetails = new CustomUserDetails(staffUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                staffDetails, null, staffDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 10L)).thenReturn(0L);
        when(discountStrategyFactory.getStrategy(DiscountType.PERCENTAGE)).thenReturn(discountStrategy);
        when(discountStrategy.calculateDiscount(voucher, BigDecimal.valueOf(200000)))
                .thenReturn(BigDecimal.valueOf(40000));

        ApplyVoucherResponse response = voucherService.applyVoucher(request);

        assertThat(response).isNotNull();
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("40000");
    }

    @Test
    @DisplayName("Áp voucher thất bại khi booking đã được áp voucher trước đó -> 409 VOUCHER_ALREADY_APPLIED")
    void applyVoucher_AlreadyApplied_ThrowsException() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(true);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_ALREADY_APPLIED);

        verify(voucherUsageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Áp voucher thất bại khi voucher đang bị vô hiệu hóa -> 400 VOUCHER_NOT_ACTIVE")
    void applyVoucher_NotActive_ThrowsException() {
        voucher.setActive(false);
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_NOT_ACTIVE);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi voucher chưa tới ngày bắt đầu -> 400 VOUCHER_NOT_STARTED")
    void applyVoucher_NotStarted_ThrowsException() {
        voucher.setStartDate(now.plusDays(2));
        voucher.setEndDate(now.plusDays(10));
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_NOT_STARTED);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi voucher đã hết hạn -> 400 VOUCHER_EXPIRED")
    void applyVoucher_Expired_ThrowsException() {
        voucher.setStartDate(now.minusDays(10));
        voucher.setEndDate(now.minusDays(1));
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_EXPIRED);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi đơn chưa đạt minOrderAmount -> 400 VOUCHER_MIN_AMOUNT_NOT_MET")
    void applyVoucher_MinAmountNotMet_ThrowsException() {
        voucher.setMinOrderAmount(BigDecimal.valueOf(500000));
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_MIN_AMOUNT_NOT_MET);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi hết lượt dùng toàn hệ thống (usageLimit) -> 400 VOUCHER_USAGE_EXCEEDED")
    void applyVoucher_UsageExceeded_ThrowsException() {
        voucher.setUsageLimit(50);
        voucher.setUsedCount(50);
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_USAGE_EXCEEDED);
    }

    @Test
    @DisplayName("Áp voucher thất bại khi khách đã dùng hết lượt cá nhân (userUsageLimit) -> 400 VOUCHER_USER_LIMIT_EXCEEDED")
    void applyVoucher_UserLimitExceeded_ThrowsException() {
        voucher.setUserUsageLimit(2);
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .bookingId(100L)
                .code("GIAM20")
                .build();

        when(voucherRepository.findByCode("GIAM20")).thenReturn(Optional.of(voucher));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(voucherRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(voucher));
        when(voucherUsageRepository.existsByBookingId(100L)).thenReturn(false);
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 10L)).thenReturn(2L);

        assertThatThrownBy(() -> voucherService.applyVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_USER_LIMIT_EXCEEDED);
    }
}
