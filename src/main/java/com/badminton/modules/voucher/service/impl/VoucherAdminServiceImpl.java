package com.badminton.modules.voucher.service.impl;

import com.badminton.modules.voucher.dto.request.CreateVoucherRequest;
import com.badminton.modules.voucher.dto.request.UpdateVoucherRequest;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.entity.DiscountType;
import com.badminton.modules.voucher.entity.Voucher;
import com.badminton.modules.voucher.mapper.VoucherMapper;
import com.badminton.modules.voucher.repository.VoucherRepository;
import com.badminton.modules.voucher.service.VoucherAdminService;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherAdminServiceImpl implements VoucherAdminService {

    private final VoucherRepository voucherRepository;
    private final VoucherMapper voucherMapper;

    @Override
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCode(normalizedCode)) {
            throw new AppException(ErrorCode.VOUCHER_CODE_EXISTS);
        }

        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE
                && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Giá trị phần trăm giảm giá không được vượt quá 100%");
        }

        Voucher voucher = voucherMapper.toEntity(request);
        voucher.setCode(normalizedCode);
        if (voucher.getUserUsageLimit() <= 0) {
            voucher.setUserUsageLimit(1);
        }

        Voucher saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VoucherResponse> getVouchers(String keyword, Boolean active, Pageable pageable) {
        Specification<Voucher> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), pattern),
                        cb.like(cb.lower(root.get("name")), pattern)
                ));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Voucher> page = voucherRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(voucherMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getVoucherById(Long id) {
        Voucher voucher = findVoucherById(id);
        return voucherMapper.toResponse(voucher);
    }

    @Override
    public VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request) {
        Voucher voucher = findVoucherById(id);

        if (request.getEndDate() != null && !request.getEndDate().isAfter(voucher.getStartDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        voucherMapper.updateEntityFromRequest(request, voucher);
        Voucher saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Override
    public VoucherResponse toggleVoucherStatus(Long id) {
        Voucher voucher = findVoucherById(id);
        voucher.setActive(!voucher.isActive());
        Voucher saved = voucherRepository.save(voucher);
        return voucherMapper.toResponse(saved);
    }

    @Override
    public void deleteVoucher(Long id) {
        Voucher voucher = findVoucherById(id);
        if (voucher.getUsedCount() == 0) {
            voucherRepository.delete(voucher);
        } else {
            voucher.setActive(false);
            voucherRepository.save(voucher);
        }
    }

    private Voucher findVoucherById(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
    }
}

