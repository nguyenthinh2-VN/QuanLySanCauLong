package com.badminton.modules.voucher.dto.request;

import com.badminton.modules.voucher.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9_-]{3,50}$", message = "Mã voucher chỉ gồm chữ cái, số, gạch ngang hoặc gạch dưới (3-50 ký tự)")
    private String code;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 100, message = "Tên voucher tối đa 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả voucher tối đa 500 ký tự")
    private String description;

    @NotNull(message = "Loại chiết khấu không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị chiết khấu không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị chiết khấu phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00", message = "Số tiền giảm tối đa không hợp lệ")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00", message = "Giá trị đơn tối thiểu không hợp lệ")
    private BigDecimal minOrderAmount;

    private Integer usageLimit;

    @Builder.Default
    private int userUsageLimit = 1;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endDate;

    @Builder.Default
    private Boolean active = true;
}

