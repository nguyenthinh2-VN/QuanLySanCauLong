package com.badminton.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION("INTERNAL_ERROR", "Đã xảy ra lỗi nội bộ hệ thống", HttpStatus.INTERNAL_SERVER_ERROR),
    RESOURCE_NOT_FOUND("NOT_FOUND", "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    VALIDATION_FAILED("VALIDATION_FAILED", "Dữ liệu gửi lên không hợp lệ", HttpStatus.BAD_REQUEST),
    BAD_REQUEST("BAD_REQUEST", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", "Bạn cần đăng nhập để truy cập tài nguyên này", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("ACCESS_DENIED", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),

    // Auth specific
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email này đã được sử dụng", HttpStatus.CONFLICT),
    PHONE_ALREADY_EXISTS("PHONE_ALREADY_EXISTS", "Số điện thoại này đã được sử dụng", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    USER_LOCKED("USER_LOCKED", "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND("USER_NOT_FOUND", "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND("ROLE_NOT_FOUND", "Vai trò người dùng không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    REFRESH_TOKEN_EXPIRED("REFRESH_TOKEN_EXPIRED", "Refresh token đã hết hạn, vui lòng đăng nhập lại",
            HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN("INVALID_REFRESH_TOKEN", "Refresh token không hợp lệ hoặc đã bị thu hồi",
            HttpStatus.UNAUTHORIZED),
    RESET_TOKEN_INVALID("RESET_TOKEN_INVALID", "Mã đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng",
            HttpStatus.BAD_REQUEST),
    RESET_TOKEN_EXPIRED("RESET_TOKEN_EXPIRED", "Mã đặt lại mật khẩu đã hết hạn", HttpStatus.BAD_REQUEST),

    // Module 2 - User Management guards
    CANNOT_LOCK_SELF("CANNOT_LOCK_SELF", "Quản trị viên không thể tự khóa tài khoản của chính mình",
            HttpStatus.BAD_REQUEST),
    CANNOT_REMOVE_OWN_ADMIN_ROLE("CANNOT_REMOVE_OWN_ADMIN_ROLE",
            "Quản trị viên không thể tự gỡ vai trò ADMIN của chính mình", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_SELF("CANNOT_DELETE_SELF", "Quản trị viên không thể tự xóa tài khoản của chính mình",
            HttpStatus.BAD_REQUEST),
    LAST_ADMIN_CANNOT_BE_MODIFIED("LAST_ADMIN_CANNOT_BE_MODIFIED",
            "Không thể khóa, gỡ vai trò hoặc xóa Quản trị viên duy nhất còn lại trong hệ thống",
            HttpStatus.BAD_REQUEST),
    CANNOT_CREATE_ADMIN("CANNOT_CREATE_ADMIN",
            "Không được phép tạo tài khoản có vai trò Quản trị viên (ADMIN) qua API này", HttpStatus.BAD_REQUEST),
    INVALID_ROLE("INVALID_ROLE", "Vai trò không hợp lệ trong hệ thống", HttpStatus.BAD_REQUEST),

    // Module 3 - Courts, TimeSlots & Pricing
    COMPLEX_NOT_FOUND("COMPLEX_NOT_FOUND", "Không tìm thấy cụm sân trong hệ thống", HttpStatus.NOT_FOUND),
    COURT_NOT_FOUND("COURT_NOT_FOUND", "Không tìm thấy sân cầu lông trong hệ thống", HttpStatus.NOT_FOUND),
    TIMESLOT_NOT_FOUND("TIMESLOT_NOT_FOUND", "Không tìm thấy khung giờ trong hệ thống", HttpStatus.NOT_FOUND),
    COMPLEX_HAS_COURTS("COMPLEX_HAS_COURTS", "Không thể xóa cụm sân đang có sân con bên trong", HttpStatus.BAD_REQUEST),
    DUPLICATE_COURT_NAME("DUPLICATE_COURT_NAME", "Tên sân đã tồn tại trong cụm sân này", HttpStatus.CONFLICT),
    DUPLICATE_COMPLEX_NAME("DUPLICATE_COMPLEX_NAME", "Tên cụm sân đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
    INVALID_TIME_RANGE("INVALID_TIME_RANGE", "Giờ bắt đầu phải trước giờ kết thúc", HttpStatus.BAD_REQUEST),
    OVERLAPPING_TIME_SLOT("OVERLAPPING_TIME_SLOT", "Khung giờ bị trùng hoặc đè lên khung giờ đã tồn tại", HttpStatus.CONFLICT),
    INVALID_SORT_FIELD("INVALID_SORT_FIELD", "Trường sắp xếp không hợp lệ", HttpStatus.BAD_REQUEST),

    // Module 4 - Bookings & Concurrency Control
    BOOKING_NOT_FOUND("BOOKING_NOT_FOUND", "Không tìm thấy thông tin đặt sân", HttpStatus.NOT_FOUND),
    SLOT_ALREADY_BOOKED("SLOT_ALREADY_BOOKED", "Khung giờ này đã được đặt hoặc đang chờ thanh toán", HttpStatus.CONFLICT),
    COURT_NOT_AVAILABLE("COURT_NOT_AVAILABLE", "Sân hiện đang bảo trì hoặc không khả dụng", HttpStatus.CONFLICT),
    INVALID_BOOKING_DATE("INVALID_BOOKING_DATE", "Ngày đặt sân không hợp lệ (chỉ được đặt trong vòng 30 ngày tới)", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_CANCELLABLE("BOOKING_NOT_CANCELLABLE", "Không thể hủy đơn đặt sân ở trạng thái hiện tại hoặc đã quá giờ bắt đầu", HttpStatus.CONFLICT),
    BOOKING_NOT_RESCHEDULABLE("BOOKING_NOT_RESCHEDULABLE", "Không thể đổi lịch đơn đặt sân ở trạng thái hiện tại hoặc đã quá giờ bắt đầu", HttpStatus.CONFLICT),

    // Module 5 - Court Operations (POS, Check-in & Recurring)
    INVALID_POS_REQUEST("INVALID_POS_REQUEST", "Yêu cầu đặt sân tại quầy không hợp lệ (chỉ chọn một trong hai: có tài khoản hoặc khách lẻ)", HttpStatus.BAD_REQUEST),
    CHECK_IN_NOT_ALLOWED("CHECK_IN_NOT_ALLOWED", "Không thể check-in đơn đặt sân ở trạng thái hiện tại hoặc không đúng ngày/giờ", HttpStatus.CONFLICT),
    RECURRING_SLOT_CONFLICT("RECURRING_SLOT_CONFLICT", "Một số ngày trong chuỗi đặt lặp đã bị trùng hoặc đã có người đặt", HttpStatus.CONFLICT),
    RECURRING_HORIZON_EXCEEDED("RECURRING_HORIZON_EXCEEDED", "Chuỗi ngày đặt lặp vượt quá giới hạn tối đa 90 ngày kể từ hôm nay", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
