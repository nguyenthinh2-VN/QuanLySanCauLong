package com.badminton.modules.payment.service;

import com.badminton.modules.payment.dto.request.CreatePaymentRequest;
import com.badminton.modules.payment.dto.request.RefundPaymentRequest;
import com.badminton.modules.payment.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest request);

    PaymentResponse refundPayment(Long paymentId, RefundPaymentRequest request);
}
