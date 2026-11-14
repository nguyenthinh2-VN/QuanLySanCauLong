package com.badminton.modules.payment.mapper;

import com.badminton.modules.payment.dto.response.PaymentDetailResponse;
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

    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "bookingDate", source = "booking.bookingDate")
    @Mapping(target = "startTime", source = "booking.timeSlot.startTime")
    @Mapping(target = "endTime", source = "booking.timeSlot.endTime")
    @Mapping(target = "courtName", source = "booking.court.name")
    @Mapping(target = "complexName", source = "booking.court.complex.name")
    @Mapping(target = "bookingStatus", source = "booking.status")
    @Mapping(target = "bookingTotalAmount", source = "booking.totalAmount")
    @Mapping(target = "customerName", expression = "java(resolveCustomerName(payment))")
    @Mapping(target = "customerPhone", expression = "java(resolveCustomerPhone(payment))")
    @Mapping(target = "customerEmail", expression = "java(resolveCustomerEmail(payment))")
    PaymentDetailResponse toDetailResponse(Payment payment);

    default String resolveCustomerName(Payment payment) {
        if (payment == null || payment.getBooking() == null) {
            return null;
        }
        return payment.getBooking().getUser() != null
                ? payment.getBooking().getUser().getFullName()
                : payment.getBooking().getGuestName();
    }

    default String resolveCustomerPhone(Payment payment) {
        if (payment == null || payment.getBooking() == null) {
            return null;
        }
        return payment.getBooking().getUser() != null
                ? payment.getBooking().getUser().getPhone()
                : payment.getBooking().getGuestPhone();
    }

    default String resolveCustomerEmail(Payment payment) {
        if (payment == null || payment.getBooking() == null || payment.getBooking().getUser() == null) {
            return null;
        }
        return payment.getBooking().getUser().getEmail();
    }
}
