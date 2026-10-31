package com.badminton.modules.voucher;

import com.badminton.modules.voucher.dto.request.CreateVoucherRequest;
import com.badminton.modules.voucher.dto.request.UpdateVoucherRequest;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.mapper.VoucherMapper;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.service.impl.VoucherAdminServiceImpl;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
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
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VoucherAdminServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private VoucherMapper voucherMapper;

    @InjectMocks
    private VoucherAdminServiceImpl voucherAdminService;

    private Voucher testVoucher;
    private VoucherResponse testVoucherResponse;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        testVoucher = Voucher.builder()
                .code("SUMMER2026")
                .name("Ưu đãi mùa hè")
                .description("Giảm giá 20% cho tất cả đơn đặt sân")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(50000))
                .minOrderAmount(BigDecimal.valueOf(100000))
                .usageLimit(100)
                .usedCount(0)
                .userUsageLimit(2)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .active(true)
                .build();
        testVoucher.setId(1L);

        testVoucherResponse = VoucherResponse.builder()
                .id(1L)
                .code("SUMMER2026")
                .name("Ưu đãi mùa hè")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(50000))
                .minOrderAmount(BigDecimal.valueOf(100000))
                .usageLimit(100)
                .usedCount(0)
                .userUsageLimit(2)
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Admin tạo voucher PERCENTAGE thành công")
    void createVoucher_Percentage_Success() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("summer2026")
                .name("Ưu đãi mùa hè")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .active(true)
                .build();

        when(voucherRepository.existsByCode("SUMMER2026")).thenReturn(false);
        when(voucherMapper.toEntity(request)).thenReturn(testVoucher);
        when(voucherRepository.save(any(Voucher.class))).thenReturn(testVoucher);
        when(voucherMapper.toResponse(testVoucher)).thenReturn(testVoucherResponse);

        VoucherResponse response = voucherAdminService.createVoucher(request);

        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("SUMMER2026");
        verify(voucherRepository).save(any(Voucher.class));
    }

    @Test
    @DisplayName("Admin tạo voucher FIXED_AMOUNT thành công")
    void createVoucher_FixedAmount_Success() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("FIXED50K")
                .name("Giảm 50K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50000))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .active(true)
                .build();

        Voucher fixedVoucher = Voucher.builder()
                .code("FIXED50K")
                .name("Giảm 50K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50000))
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .active(true)
                .build();
        fixedVoucher.setId(2L);

        VoucherResponse fixedResponse = VoucherResponse.builder()
                .id(2L)
                .code("FIXED50K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50000))
                .build();

        when(voucherRepository.existsByCode("FIXED50K")).thenReturn(false);
        when(voucherMapper.toEntity(request)).thenReturn(fixedVoucher);
        when(voucherRepository.save(any(Voucher.class))).thenReturn(fixedVoucher);
        when(voucherMapper.toResponse(fixedVoucher)).thenReturn(fixedResponse);

        VoucherResponse response = voucherAdminService.createVoucher(request);

        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("FIXED50K");
    }

    @Test
    @DisplayName("Tạo voucher thất bại khi mã code đã tồn tại trong hệ thống -> 409 VOUCHER_CODE_EXISTS")
    void createVoucher_DuplicateCode_ThrowsException() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("SUMMER2026")
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(30))
                .build();

        when(voucherRepository.existsByCode("SUMMER2026")).thenReturn(true);

        assertThatThrownBy(() -> voucherAdminService.createVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_CODE_EXISTS);

        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo voucher thất bại khi endDate trước hoặc bằng startDate -> 400 BAD_REQUEST")
    void createVoucher_InvalidDates_ThrowsException() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("INVALIDDATES")
                .startDate(now.plusDays(5))
                .endDate(now.plusDays(2))
                .build();

        when(voucherRepository.existsByCode("INVALIDDATES")).thenReturn(false);

        assertThatThrownBy(() -> voucherAdminService.createVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);

        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo voucher thất bại khi phần trăm giảm giá vượt quá 100% -> 400 BAD_REQUEST")
    void createVoucher_PercentageOver100_ThrowsException() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("OVER100")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(120))
                .startDate(now)
                .endDate(now.plusDays(10))
                .build();

        when(voucherRepository.existsByCode("OVER100")).thenReturn(false);

        assertThatThrownBy(() -> voucherAdminService.createVoucher(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
    }

    @Test
    @DisplayName("Lấy danh sách vouchers phân trang và lọc keyword thành công")
    void getVouchers_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Voucher> page = new PageImpl<>(List.of(testVoucher), pageable, 1);

        when(voucherRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(voucherMapper.toResponse(testVoucher)).thenReturn(testVoucherResponse);

        PageResponse<VoucherResponse> response = voucherAdminService.getVouchers("SUMMER", true, pageable);

        assertThat(response).isNotNull();
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Lấy chi tiết voucher theo ID thành công")
    void getVoucherById_Success() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));
        when(voucherMapper.toResponse(testVoucher)).thenReturn(testVoucherResponse);

        VoucherResponse response = voucherAdminService.getVoucherById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Lấy chi tiết voucher không tồn tại -> 404 VOUCHER_NOT_FOUND")
    void getVoucherById_NotFound_ThrowsException() {
        when(voucherRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voucherAdminService.getVoucherById(999L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VOUCHER_NOT_FOUND);
    }

    @Test
    @DisplayName("Cập nhật thông tin voucher thành công")
    void updateVoucher_Success() {
        UpdateVoucherRequest request = UpdateVoucherRequest.builder()
                .name("Tên mới")
                .endDate(now.plusDays(40))
                .build();

        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));
        when(voucherRepository.save(any(Voucher.class))).thenReturn(testVoucher);
        when(voucherMapper.toResponse(testVoucher)).thenReturn(testVoucherResponse);

        VoucherResponse response = voucherAdminService.updateVoucher(1L, request);

        assertThat(response).isNotNull();
        verify(voucherMapper).updateEntityFromRequest(request, testVoucher);
        verify(voucherRepository).save(testVoucher);
    }

    @Test
    @DisplayName("Cập nhật voucher với endDate trước startDate -> 400 BAD_REQUEST")
    void updateVoucher_InvalidEndDate_ThrowsException() {
        UpdateVoucherRequest request = UpdateVoucherRequest.builder()
                .endDate(testVoucher.getStartDate().minusDays(1))
                .build();

        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));

        assertThatThrownBy(() -> voucherAdminService.updateVoucher(1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);

        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("Bật/tắt trạng thái voucher thành công")
    void toggleVoucherStatus_Success() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));
        when(voucherRepository.save(any(Voucher.class))).thenReturn(testVoucher);
        when(voucherMapper.toResponse(testVoucher)).thenReturn(testVoucherResponse);

        VoucherResponse response = voucherAdminService.toggleVoucherStatus(1L);

        assertThat(response).isNotNull();
        assertThat(testVoucher.isActive()).isFalse();
        verify(voucherRepository).save(testVoucher);
    }

    @Test
    @DisplayName("Xóa cứng voucher khi usedCount == 0")
    void deleteVoucher_Unused_HardDeletes() {
        testVoucher.setUsedCount(0);
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));

        voucherAdminService.deleteVoucher(1L);

        verify(voucherRepository).delete(testVoucher);
        verify(voucherRepository, never()).save(any());
    }

    @Test
    @DisplayName("Xóa voucher khi usedCount > 0 -> chuyển active thành false để bảo toàn audit trail")
    void deleteVoucher_AlreadyUsed_SoftDeactivates() {
        testVoucher.setUsedCount(5);
        testVoucher.setActive(true);
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(testVoucher));

        voucherAdminService.deleteVoucher(1L);

        assertThat(testVoucher.isActive()).isFalse();
        verify(voucherRepository).save(testVoucher);
        verify(voucherRepository, never()).delete(any(Voucher.class));
    }
}
