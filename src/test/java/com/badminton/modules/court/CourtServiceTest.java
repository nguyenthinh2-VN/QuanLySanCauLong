package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateCourtRequest;
import com.badminton.modules.court.dto.request.UpdateCourtRequest;
import com.badminton.modules.court.dto.response.CourtResponse;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.mapper.CourtMapper;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.service.impl.CourtServiceImpl;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourtServiceTest {

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private CourtComplexRepository courtComplexRepository;

    @Mock
    private CourtMapper courtMapper;

    @InjectMocks
    private CourtServiceImpl courtService;

    private CourtComplex complex1;
    private CourtComplex complex2;
    private Court court1;

    @BeforeEach
    void setUp() {
        complex1 = CourtComplex.builder()
                .name("Cụm Cầu Giấy")
                .address("123 Cầu Giấy")
                .status(ComplexStatus.ACTIVE)
                .build();
        complex1.setId(1L);

        complex2 = CourtComplex.builder()
                .name("Cụm Thanh Xuân")
                .address("456 Nguyễn Trãi")
                .status(ComplexStatus.ACTIVE)
                .build();
        complex2.setId(2L);

        court1 = Court.builder()
                .complex(complex1)
                .name("Sân 1")
                .status(CourtStatus.AVAILABLE)
                .build();
        court1.setId(10L);
    }

    @Test
    @DisplayName("Lấy danh sách sân con thành công")
    void getCourts_success() {
        Page<Court> page = new PageImpl<>(List.of(court1));
        when(courtRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        CourtResponse responseDto = CourtResponse.builder()
                .id(10L)
                .name("Sân 1")
                .complexId(1L)
                .complexName("Cụm Cầu Giấy")
                .build();
        when(courtMapper.toResponse(court1)).thenReturn(responseDto);

        PageResponse<CourtResponse> result = courtService.getCourts(1L, CourtStatus.AVAILABLE, "Sân", 0, 10, "createdAt,desc");

        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getName()).isEqualTo("Sân 1");
    }

    @Test
    @DisplayName("GET sân với trường sắp xếp lạ ném INVALID_SORT_FIELD")
    void getCourts_invalidSort_throwsInvalidSortField() {
        assertThatThrownBy(() -> courtService.getCourts(null, null, null, 0, 10, "tenKhongHopLe,asc"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INVALID_SORT_FIELD));
    }

    @Test
    @DisplayName("Xem chi tiết sân con thành công")
    void getCourtById_success() {
        when(courtRepository.findById(10L)).thenReturn(Optional.of(court1));
        CourtResponse responseDto = CourtResponse.builder().id(10L).name("Sân 1").build();
        when(courtMapper.toResponse(court1)).thenReturn(responseDto);

        CourtResponse result = courtService.getCourtById(10L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Xem chi tiết sân con không tồn tại ném COURT_NOT_FOUND")
    void getCourtById_notFound() {
        when(courtRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.getCourtById(999L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.COURT_NOT_FOUND));
    }

    @Test
    @DisplayName("Tạo sân con thành công khi tên chưa tồn tại trong cụm")
    void createCourt_success() {
        CreateCourtRequest request = CreateCourtRequest.builder()
                .complexId(1L)
                .name("Sân 2")
                .status(CourtStatus.AVAILABLE)
                .build();

        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(complex1));
        when(courtRepository.existsByComplexIdAndName(1L, "Sân 2")).thenReturn(false);

        Court newCourt = Court.builder().complex(complex1).name("Sân 2").status(CourtStatus.AVAILABLE).build();
        when(courtRepository.save(any(Court.class))).thenReturn(newCourt);

        CourtResponse responseDto = CourtResponse.builder().id(11L).name("Sân 2").build();
        when(courtMapper.toResponse(newCourt)).thenReturn(responseDto);

        CourtResponse result = courtService.createCourt(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Sân 2");
        verify(courtRepository).save(any(Court.class));
    }

    @Test
    @DisplayName("Tạo sân con với complexId không tồn tại ném COMPLEX_NOT_FOUND")
    void createCourt_complexNotFound() {
        CreateCourtRequest request = CreateCourtRequest.builder()
                .complexId(999L)
                .name("Sân Mới")
                .build();

        when(courtComplexRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courtService.createCourt(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.COMPLEX_NOT_FOUND));

        verify(courtRepository, never()).save(any(Court.class));
    }

    @Test
    @DisplayName("Tạo 2 sân trùng tên trong CÙNG 1 cụm ném DUPLICATE_COURT_NAME (409)")
    void createCourt_duplicateNameInSameComplex_throwsDuplicateCourtName() {
        CreateCourtRequest request = CreateCourtRequest.builder()
                .complexId(1L)
                .name("Sân 1")
                .build();

        when(courtComplexRepository.findById(1L)).thenReturn(Optional.of(complex1));
        when(courtRepository.existsByComplexIdAndName(1L, "Sân 1")).thenReturn(true);

        assertThatThrownBy(() -> courtService.createCourt(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_COURT_NAME));

        verify(courtRepository, never()).save(any(Court.class));
    }

    @Test
    @DisplayName("Tạo sân trùng tên nhưng ở 2 cụm KHÁC NHAU thì thành công")
    void createCourt_sameNameDifferentComplex_success() {
        CreateCourtRequest request = CreateCourtRequest.builder()
                .complexId(2L)
                .name("Sân 1")
                .build();

        when(courtComplexRepository.findById(2L)).thenReturn(Optional.of(complex2));
        when(courtRepository.existsByComplexIdAndName(2L, "Sân 1")).thenReturn(false);

        Court courtInComplex2 = Court.builder().complex(complex2).name("Sân 1").status(CourtStatus.AVAILABLE).build();
        when(courtRepository.save(any(Court.class))).thenReturn(courtInComplex2);

        CourtResponse responseDto = CourtResponse.builder().id(20L).name("Sân 1").complexId(2L).build();
        when(courtMapper.toResponse(courtInComplex2)).thenReturn(responseDto);

        CourtResponse result = courtService.createCourt(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Sân 1");
        assertThat(result.getComplexId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Cập nhật sân con trùng tên trong cùng cụm ném DUPLICATE_COURT_NAME")
    void updateCourt_duplicateNameInSameComplex_throwsDuplicateCourtName() {
        UpdateCourtRequest request = UpdateCourtRequest.builder()
                .name("Sân Đã Có")
                .status(CourtStatus.AVAILABLE)
                .build();

        when(courtRepository.findById(10L)).thenReturn(Optional.of(court1));
        when(courtRepository.existsByComplexIdAndNameAndIdNot(1L, "Sân Đã Có", 10L)).thenReturn(true);

        assertThatThrownBy(() -> courtService.updateCourt(10L, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_COURT_NAME));
    }

    @Test
    @DisplayName("Xóa sân con thành công")
    void deleteCourt_success() {
        when(courtRepository.findById(10L)).thenReturn(Optional.of(court1));

        courtService.deleteCourt(10L);

        verify(courtRepository).delete(court1);
    }
}
