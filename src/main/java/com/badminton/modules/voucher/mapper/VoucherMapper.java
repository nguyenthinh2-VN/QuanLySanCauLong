package com.badminton.modules.voucher.mapper;

import com.badminton.modules.voucher.dto.request.CreateVoucherRequest;
import com.badminton.modules.voucher.dto.request.UpdateVoucherRequest;
import com.badminton.modules.voucher.dto.response.VoucherResponse;
import com.badminton.modules.voucher.entity.Voucher;
import org.mapstruct.BeanMapping;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        builder = @Builder(disableBuilder = true),
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface VoucherMapper {

    VoucherResponse toResponse(Voucher voucher);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "usedCount", constant = "0")
    @Mapping(target = "code", expression = "java(request.getCode() != null ? request.getCode().trim().toUpperCase() : null)")
    Voucher toEntity(CreateVoucherRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "discountType", ignore = true)
    @Mapping(target = "discountValue", ignore = true)
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "usedCount", ignore = true)
    void updateEntityFromRequest(UpdateVoucherRequest request, @MappingTarget Voucher voucher);
}
