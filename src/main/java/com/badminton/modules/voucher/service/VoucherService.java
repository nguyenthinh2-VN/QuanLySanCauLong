package com.badminton.modules.voucher.service;

import com.badminton.modules.voucher.dto.request.ApplyVoucherRequest;
import com.badminton.modules.voucher.dto.response.ApplyVoucherResponse;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface VoucherService {

    PageResponse<VoucherResponse> getActiveVouchers(Pageable pageable);

    ApplyVoucherResponse applyVoucher(ApplyVoucherRequest request);
}

