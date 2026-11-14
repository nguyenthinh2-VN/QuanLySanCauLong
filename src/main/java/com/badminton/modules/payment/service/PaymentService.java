package com.badminton.modules.payment.service;

import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.dto.request.PaymentFilterRequest;
import com.badminton.modules.payment.dto.request.RefundPaymentRequest;
import com.badminton.modules.payment.dto.response.PaymentDetailResponse;
import com.badminton.modules.payment.dto.response.PaymentResponse;
import com.badminton.shared.response.PageResponse;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest request);

    PaymentResponse refundPayment(Long paymentId, RefundPaymentRequest request);

    PageResponse<PaymentResponse> getPayments(PaymentFilterRequest filter, int page, int size, String sort);

    PageResponse<PaymentResponse> getMyPayments(PaymentFilterRequest filter, int page, int size, String sort);

    PaymentDetailResponse getPaymentById(Long paymentId);
}
