package com.badminton.modules.court;

import com.badminton.modules.court.dto.request.CreateTimeSlotRequest;
import com.badminton.modules.court.dto.request.UpdateTimeSlotRequest;
import com.badminton.modules.court.dto.response.TimeSlotResponse;
import com.badminton.modules.court.service.TimeSlotService;
import com.badminton.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/time-slots")
@RequiredArgsConstructor
@Tag(name = "Time Slots", description = "Quản lý Khung giờ & Bảng giá thuê sân")
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    @GetMapping
    @Operation(
            summary = "Lấy danh sách khung giờ & giá thuê (Public)",
            description = "Cho phép khách xem danh sách các khung giờ hoạt động và mức giá thuê mỗi giờ tương ứng, sắp xếp theo thời gian bắt đầu"
    )
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getTimeSlots() {
        List<TimeSlotResponse> response = timeSlotService.getTimeSlots();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách khung giờ thành công"));
    }

    @PostMapping
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Tạo mới khung giờ & giá (Admin Only)",
            description = "Yêu cầu quyền ADMIN. Guards: Giờ bắt đầu phải trước giờ kết thúc, không trùng lặp/đè lên khung giờ hiện có, giá thuê không âm"
    )
    public ResponseEntity<ApiResponse<TimeSlotResponse>> createTimeSlot(@Valid @RequestBody CreateTimeSlotRequest request) {
        TimeSlotResponse response = timeSlotService.createTimeSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo mới khung giờ thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Cập nhật khung giờ & giá (Admin Only)",
            description = "Yêu cầu quyền ADMIN. Guards: Áp dụng cùng các kiểm tra logic như khi tạo mới. Không hỗ trợ xóa khung giờ để đảm bảo toàn vẹn dữ liệu đặt sân"
    )
    public ResponseEntity<ApiResponse<TimeSlotResponse>> updateTimeSlot(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTimeSlotRequest request) {
        TimeSlotResponse response = timeSlotService.updateTimeSlot(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật khung giờ thành công"));
    }
}
