package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateComplexRequest;
import com.badminton.modules.court.dto.request.UpdateComplexRequest;
import com.badminton.modules.court.dto.response.ComplexDetailResponse;
import com.badminton.modules.court.dto.response.ComplexResponse;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.mapper.CourtComplexMapper;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.service.impl.CourtComplexServiceImpl;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
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
class CourtComplexServiceTest {

    @Mock
    private CourtComplexRepository courtComplexRepository;

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private CourtComplexMapper courtComplexMapper;

    @InjectMocks
    private CourtComplexServiceImpl courtComplexService;

    private CourtComplex sampleComplex;

    @BeforeEach
    void setUp() {
        sampleComplex = CourtComplex.builder()
                .name("Cụm Sân Cầu Giấy")
                .address("123 Cầu Giấy")
                .phone("0912345678")
                .status(ComplexStatus.ACTIVE)
                .courts(new ArrayList<>())
                .build();
        sampleComplex.setId(1L);
    }

    @Test
    @DisplayName("Lấy danh sách cụm sân thành công")
    void getComplexes_success() {
        Page<CourtComplex> page = new PageImpl<>(List.of(sampleComplex));
        when(courtComplexRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ComplexResponse responseDto = ComplexResponse.builder()
                .id(1L)
                .name("Cụm Sân Cầu Giấy")
                .build();
        when(courtComplexMapper.toResponse(sampleComplex)).thenReturn(responseDto);

        PageResponse<ComplexResponse> result = courtComplexService.getComplexes("Cầu Giấy", ComplexStatus.ACTIVE, 0, 10, "createdAt,desc");

        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getName()).isEqualTo("Cụm Sân Cầu Giấy");
    }

    @Test
    @DisplayName("GET với trường sắp xếp không hợp lệ ném INVALID_SORT_FIELD")
    void getComplexes_invalidSort_throwsInvalidSortField() {
        assertThatThrownBy(() -> courtComplexService.getComplexes(null, null, 0, 10, "invalidField,asc"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_SORT_FIELD);
                });
    }

    @Test
    @DisplayName("Xem chi tiết cụm sân thành công")
    void getComplexById_success() {
        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(sampleComplex));
        ComplexDetailResponse detailDto = ComplexDetailResponse.builder()
                .id(1L)
                .name("Cụm Sân Cầu Giấy")
                .build();
        when(courtComplexMapper.toDetailResponse(sampleComplex)).thenReturn(detailDto);

        ComplexDetailResponse result = courtComplexService.getComplexById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Cụm Sân Cầu Giấy");
    }

    @Test
    @DisplayName("Xem chi tiết cụm sân không tồn tại ném COMPLEX_NOT_FOUND")
    void getComplexById_notFound() {
        when(courtComplexRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtComplexService.getComplexById(999L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.COMPLEX_NOT_FOUND));
    }

    @Test
    @DisplayName("Tạo mới cụm sân thành công")
    void createComplex_success() {
        CreateComplexRequest request = CreateComplexRequest.builder()
                .name("Cụm Sân Mỹ Đình")
                .address("Lê Đức Thọ")
                .phone("0901234567")
                .status(ComplexStatus.ACTIVE)
                .build();

        when(courtComplexRepository.existsByName("Cụm Sân Mỹ Đình")).thenReturn(false);

        CourtComplex newComplex = CourtComplex.builder()
                .name("Cụm Sân Mỹ Đình")
                .address("Lê Đức Thọ")
                .status(ComplexStatus.ACTIVE)
                .build();
        when(courtComplexMapper.toEntity(request)).thenReturn(newComplex);
        when(courtComplexRepository.save(any(CourtComplex.class))).thenReturn(newComplex);

        ComplexResponse responseDto = ComplexResponse.builder().id(2L).name("Cụm Sân Mỹ Đình").build();
        when(courtComplexMapper.toResponse(newComplex)).thenReturn(responseDto);

        ComplexResponse result = courtComplexService.createComplex(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Cụm Sân Mỹ Đình");
        verify(courtComplexRepository).save(any(CourtComplex.class));
    }

    @Test
    @DisplayName("Tạo cụm sân trùng tên ném DUPLICATE_COMPLEX_NAME")
    void createComplex_duplicateName() {
        CreateComplexRequest request = CreateComplexRequest.builder()
                .name("Cụm Sân Cầu Giấy")
                .address("123 Cầu Giấy")
                .build();

        when(courtComplexRepository.existsByName("Cụm Sân Cầu Giấy")).thenReturn(true);

        assertThatThrownBy(() -> courtComplexService.createComplex(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_COMPLEX_NAME));

        verify(courtComplexRepository, never()).save(any(CourtComplex.class));
    }

    @Test
    @DisplayName("Cập nhật cụm sân trùng tên ném DUPLICATE_COMPLEX_NAME")
    void updateComplex_duplicateName() {
        UpdateComplexRequest request = UpdateComplexRequest.builder()
                .name("Cụm Sân Trùng")
                .address("Địa chỉ mới")
                .status(ComplexStatus.ACTIVE)
                .build();

        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(sampleComplex));
        when(courtComplexRepository.existsByNameAndIdNot("Cụm Sân Trùng", 1L)).thenReturn(true);

        assertThatThrownBy(() -> courtComplexService.updateComplex(1L, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_COMPLEX_NAME));
    }

    @Test
    @DisplayName("Guard xóa cụm sân: còn sân con bên trong ném COMPLEX_HAS_COURTS và không xóa")
    void deleteComplex_hasCourts_throwsComplexHasCourts() {
        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(sampleComplex));
        when(courtRepository.countByComplexId(1L)).thenReturn(3L);

        assertThatThrownBy(() -> courtComplexService.deleteComplex(1L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.COMPLEX_HAS_COURTS));

        verify(courtComplexRepository, never()).delete(any(CourtComplex.class));
    }

    @Test
    @DisplayName("Xóa cụm sân thành công khi không còn sân con")
    void deleteComplex_success() {
        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(sampleComplex));
        when(courtRepository.countByComplexId(1L)).thenReturn(0L);

        courtComplexService.deleteComplex(1L);

        verify(courtComplexRepository).delete(sampleComplex);
    }
}
