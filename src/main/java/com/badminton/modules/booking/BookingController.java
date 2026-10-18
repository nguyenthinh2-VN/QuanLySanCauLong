package com.badminton.modules.booking;

import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.CreatePosBookingRequest;
import com.badminton.modules.booking.dto.request.CreateRecurringBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.dto.response.RecurringBookingResponse;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.shared.response.ApiResponse;
import com.badminton.shared.response.PageResponse;
import com.badminton.shared.util.SortUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Quản lý đặt sân online và kiểm soát xung đột đặt chỗ")
public class BookingController {

        private static final Set<String> ALLOWED_MY_BOOKINGS_SORT = Set.of("bookingDate", "createdAt", "totalAmount");

        private final BookingService bookingService;

        @GetMapping("/availability")
        @Operation(summary = "Xem lịch trống các sân theo ngày (Public)", description = "Tra cứu tình trạng các khung giờ theo ngày cụ thể (FREE, BOOKED, PASSED, UNAVAILABLE). Public không cần đăng nhập.")
        public ResponseEntity<ApiResponse<List<CourtAvailabilityResponse>>> getAvailability(
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                        @RequestParam(required = false) Long courtId,
                        @RequestParam(required = false) Long complexId) {
                List<CourtAvailabilityResponse> response = bookingService.getAvailability(date, courtId, complexId);
                return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu lịch trống sân thành công"));
        }

        @PostMapping
        @PreAuthorize("isAuthenticated()")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Đặt sân online", description = "Khách hàng đặt sân cho chính mình. Trả về trạng thái PENDING. Được kiểm soát đồng thời bằng pessimistic write lock.")
        public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
                        @Valid @RequestBody CreateBookingRequest request) {
                BookingResponse response = bookingService.createBooking(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(response, "Đặt sân thành công, đơn đặt đang chờ thanh toán"));
        }

        @GetMapping("/my")
        @PreAuthorize("isAuthenticated()")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Xem lịch sử đặt sân của bản thân", description = "Lấy danh sách các đơn đặt sân của user hiện tại, có phân trang, lọc theo trạng thái và khoảng thời gian. Sort whitelist: bookingDate, createdAt, totalAmount.")
        public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
                        @RequestParam(required = false) BookingStatus status,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt,desc") String sort) {
                Sort resolvedSort = SortUtils.parseSort(sort, "createdAt", ALLOWED_MY_BOOKINGS_SORT);
                Pageable pageable = PageRequest.of(page, size, resolvedSort);
                PageResponse<BookingResponse> response = bookingService.getMyBookings(status, fromDate, toDate,
                                pageable);
                return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử đặt sân thành công"));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN) or @bookingSecurity.isOwner(#id)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Đổi lịch đặt sân", description = "Chủ booking hoặc ADMIN đổi lịch đặt sân trước thời điểm bắt đầu của khung giờ đã đặt.")
        public ResponseEntity<ApiResponse<BookingResponse>> updateBooking(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateBookingRequest request) {
                BookingResponse response = bookingService.updateBooking(id, request);
                return ResponseEntity.ok(ApiResponse.success(response, "Đổi lịch đặt sân thành công"));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN) or @bookingSecurity.isOwner(#id)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Hủy lịch đặt sân", description = "Chủ booking hoặc ADMIN hủy lịch đặt sân trước thời điểm bắt đầu (Soft-Cancel -> CANCELLED).")
        public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
                        @PathVariable Long id) {
                BookingResponse response = bookingService.cancelBooking(id);
                return ResponseEntity.ok(ApiResponse.success(response, "Hủy lịch đặt sân thành công"));
        }

        @PostMapping("/pos")
        @PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Đặt sân tại quầy (POS)", description = "Nhân viên lễ tân/Admin đặt sân trực tiếp tại quầy cho khách thành viên (userId) hoặc khách vãng lai (guestName + guestPhone). Trạng thái khởi tạo là CONFIRMED.")
        public ResponseEntity<ApiResponse<BookingResponse>> createPosBooking(
                        @Valid @RequestBody CreatePosBookingRequest request) {
                BookingResponse response = bookingService.createPosBooking(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(response, "Đặt sân tại quầy thành công"));
        }

        @PostMapping("/{id}/check-in")
        @PreAuthorize("hasAnyRole(T(com.badminton.shared.constant.RoleConstants).STAFF, T(com.badminton.shared.constant.RoleConstants).ADMIN)")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Check-in khách vào sân", description = "Nhân viên lễ tân/Admin xác nhận khách có mặt tại sân. Chỉ check-in cho đơn đặt trong ngày hôm nay, trước giờ kết thúc của khung giờ và có trạng thái PENDING hoặc CONFIRMED.")
        public ResponseEntity<ApiResponse<BookingResponse>> checkInBooking(
                        @PathVariable Long id) {
                BookingResponse response = bookingService.checkInBooking(id);
                return ResponseEntity.ok(ApiResponse.success(response, "Check-in thành công"));
        }

        @PostMapping("/recurring")
        @PreAuthorize("isAuthenticated()")
        @SecurityRequirement(name = "BearerAuth")
        @Operation(summary = "Đặt lịch cố định theo tuần (Recurring)", description = "Khách hàng đặt lịch định kỳ theo tuần (tối đa 12 tuần, phạm vi tối đa 90 ngày). Nguyên tắc all-or-nothing: nếu có bất kỳ ngày nào bị xung đột thì toàn bộ giao dịch bị rollback và trả về 409.")
        public ResponseEntity<ApiResponse<RecurringBookingResponse>> createRecurringBooking(
                        @Valid @RequestBody CreateRecurringBookingRequest request) {
                RecurringBookingResponse response = bookingService.createRecurringBooking(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(response, "Đặt lịch cố định thành công"));
        }
}
