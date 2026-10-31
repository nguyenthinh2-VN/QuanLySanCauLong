package com.badminton.modules.voucher.service;

import com.badminton.modules.voucher.dto.request.CreateVoucherRequest;
import com.badminton.modules.voucher.dto.request.UpdateVoucherRequest;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface VoucherAdminService {

    VoucherResponse createVoucher(CreateVoucherRequest request);

    PageResponse<VoucherResponse> getVouchers(String keyword, Boolean active, Pageable pageable);

    VoucherResponse getVoucherById(Long id);

    VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request);

    VoucherResponse toggleVoucherStatus(Long id);

    void deleteVoucher(Long id);
}

