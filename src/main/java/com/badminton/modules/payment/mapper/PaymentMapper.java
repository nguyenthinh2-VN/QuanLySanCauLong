package com.badminton.modules.payment.mapper;

import com.badminton.modules.payment.dto.response.PaymentResponse;
import com.badminton.modules.payment.entity.Payment;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        builder = @Builder(disableBuilder = true),
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface PaymentMapper {

    @Mapping(target = "bookingId", source = "booking.id")
    PaymentResponse toResponse(Payment payment);
}
