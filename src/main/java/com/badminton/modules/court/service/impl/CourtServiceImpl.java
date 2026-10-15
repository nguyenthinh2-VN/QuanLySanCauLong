package com.badminton.modules.court.service.impl;

import com.badminton.modules.court.dto.request.CreateCourtRequest;
import com.badminton.modules.court.dto.request.UpdateCourtRequest;
import com.badminton.modules.court.dto.response.CourtResponse;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.mapper.CourtMapper;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.service.CourtService;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import com.badminton.shared.util.SortUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourtServiceImpl implements CourtService {

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "id",
            "name",
            "status",
            "createdAt",
            "updatedAt");

    private final CourtRepository courtRepository;
    private final CourtComplexRepository courtComplexRepository;
    private final CourtMapper courtMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourtResponse> getCourts(Long complexId, CourtStatus status, String q, int page, int size,
            String sort) {
        Sort sortObj = SortUtils.parseSort(sort, "createdAt", ALLOWED_SORT_PROPERTIES);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sortObj);

        Specification<Court> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (complexId != null) {
                predicates.add(cb.equal(root.get("complex").get("id"), complexId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(q)) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Court> courtPage = courtRepository.findAll(spec, pageable);
        return PageResponse.from(courtPage.map(courtMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public CourtResponse getCourtById(Long id) {
        Court court = findCourtById(id);
        return courtMapper.toResponse(court);
    }

    @Override
    @Transactional
    public CourtResponse createCourt(CreateCourtRequest request) {
        CourtComplex complex = courtComplexRepository.findById(request.getComplexId())
                .orElseThrow(() -> new AppException(ErrorCode.COMPLEX_NOT_FOUND));

        String trimmedName = request.getName().trim();
        if (courtRepository.existsByComplexIdAndName(complex.getId(), trimmedName)) {
            log.warn("Trùng tên sân trong cùng cụm: complexId={}, name='{}'", complex.getId(), trimmedName);
            throw new AppException(ErrorCode.DUPLICATE_COURT_NAME);
        }

        Court court = Court.builder()
                .complex(complex)
                .name(trimmedName)
                .status(request.getStatus() != null ? request.getStatus() : CourtStatus.AVAILABLE)
                .build();

        Court saved = courtRepository.save(court);
        log.info("Đã tạo mới sân con: id={}, name='{}', complexId={}", saved.getId(), saved.getName(), complex.getId());
        return courtMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CourtResponse updateCourt(Long id, UpdateCourtRequest request) {
        Court court = findCourtById(id);
        String trimmedName = request.getName().trim();

        if (courtRepository.existsByComplexIdAndNameAndIdNot(court.getComplex().getId(), trimmedName, id)) {
            log.warn("Trùng tên sân khi cập nhật: complexId={}, name='{}', courtId={}",
                    court.getComplex().getId(), trimmedName, id);
            throw new AppException(ErrorCode.DUPLICATE_COURT_NAME);
        }

        court.setName(trimmedName);
        court.setStatus(request.getStatus());

        Court updated = courtRepository.save(court);
        log.info("Đã cập nhật sân con: id={}, name='{}', status={}", updated.getId(), updated.getName(),
                updated.getStatus());
        return courtMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCourt(Long id) {
        Court court = findCourtById(id);
        // Note: Lịch đặt sân sẽ được kiểm tra tại Module 4 (Booking) trước khi cho phép
        // xóa sân
        courtRepository.delete(court);
        log.info("Đã xóa sân con thành công: id={}, name='{}'", id, court.getName());
    }

    private Court findCourtById(Long id) {
        return courtRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
    }
}
