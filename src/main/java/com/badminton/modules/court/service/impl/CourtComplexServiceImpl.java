package com.badminton.modules.court.service.impl;

import com.badminton.modules.court.dto.request.CreateComplexRequest;
import com.badminton.modules.court.dto.request.UpdateComplexRequest;
import com.badminton.modules.court.dto.response.ComplexDetailResponse;
import com.badminton.modules.court.dto.response.ComplexResponse;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.mapper.CourtComplexMapper;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.service.CourtComplexService;
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
public class CourtComplexServiceImpl implements CourtComplexService {

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "id",
            "name",
            "address",
            "status",
            "createdAt",
            "updatedAt"
    );

    private final CourtComplexRepository courtComplexRepository;
    private final CourtRepository courtRepository;
    private final CourtComplexMapper courtComplexMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplexResponse> getComplexes(String q, ComplexStatus status, int page, int size,
            String sort) {
        Sort sortObj = SortUtils.parseSort(sort, "createdAt", ALLOWED_SORT_PROPERTIES);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sortObj);

        Specification<CourtComplex> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(q)) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate namePredicate = cb.like(cb.lower(root.get("name")), pattern);
                Predicate addressPredicate = cb.like(cb.lower(root.get("address")), pattern);
                predicates.add(cb.or(namePredicate, addressPredicate));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CourtComplex> complexPage = courtComplexRepository.findAll(spec, pageable);
        return PageResponse.from(complexPage.map(courtComplexMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ComplexDetailResponse getComplexById(Long id) {
        CourtComplex complex = findComplexById(id);
        return courtComplexMapper.toDetailResponse(complex);
    }

    @Override
    @Transactional
    public ComplexResponse createComplex(CreateComplexRequest request) {
        String trimmedName = request.getName().trim();
        if (courtComplexRepository.existsByName(trimmedName)) {
            throw new AppException(ErrorCode.DUPLICATE_COMPLEX_NAME);
        }

        CourtComplex complex = courtComplexMapper.toEntity(request);
        complex.setName(trimmedName);
        if (complex.getStatus() == null) {
            complex.setStatus(ComplexStatus.ACTIVE);
        }

        CourtComplex saved = courtComplexRepository.save(complex);
        log.info("Đã tạo mới cụm sân: id={}, name='{}'", saved.getId(), saved.getName());
        return courtComplexMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ComplexResponse updateComplex(Long id, UpdateComplexRequest request) {
        CourtComplex complex = findComplexById(id);
        String trimmedName = request.getName().trim();

        if (courtComplexRepository.existsByNameAndIdNot(trimmedName, id)) {
            throw new AppException(ErrorCode.DUPLICATE_COMPLEX_NAME);
        }

        courtComplexMapper.updateEntityFromRequest(complex, request);
        complex.setName(trimmedName);

        CourtComplex updated = courtComplexRepository.save(complex);
        log.info("Đã cập nhật cụm sân: id={}, name='{}'", updated.getId(), updated.getName());
        return courtComplexMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteComplex(Long id) {
        CourtComplex complex = findComplexById(id);

        long childCount = courtRepository.countByComplexId(id);
        if (childCount > 0) {
            log.warn("Từ chối xóa cụm sân id={} vì còn {} sân con", id, childCount);
            throw new AppException(ErrorCode.COMPLEX_HAS_COURTS);
        }

        courtComplexRepository.delete(complex);
        log.info("Đã xóa cụm sân thành công: id={}, name='{}'", id, complex.getName());
    }

    private CourtComplex findComplexById(Long id) {
        return courtComplexRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPLEX_NOT_FOUND));
    }
}
