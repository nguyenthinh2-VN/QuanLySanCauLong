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
    INVALID_ROLE("INVALID_ROLE", "Vai trò không hợp lệ trong hệ thống", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
