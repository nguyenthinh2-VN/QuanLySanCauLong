package com.badminton.modules.booking;

import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.dto.response.CourtAvailabilityResponse;
import com.badminton.modules.booking.entity.BookingStatus;
import com.badminton.modules.booking.security.BookingSecurity;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BookingControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private BookingSecurity bookingSecurity;

    // -------------------------------------------------------------
    // GET /api/v1/bookings/{id}
    // -------------------------------------------------------------

    @Test
    @DisplayName("GET /api/v1/bookings/{id}: Chưa đăng nhập -> 401 Unauthorized")
    void getBookingById_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/bookings/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/bookings/{id}: Vai trò STAFF -> 200 OK")
    void getBookingById_staff_returns200() throws Exception {
        BookingResponse response = BookingResponse.builder()
                .id(1L)
                .status(BookingStatus.CONFIRMED)
                .build();
        when(bookingService.getBookingById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/bookings/{id}: Vai trò ADMIN -> 200 OK")
    void getBookingById_admin_returns200() throws Exception {
        BookingResponse response = BookingResponse.builder()
                .id(1L)
                .status(BookingStatus.CONFIRMED)
                .build();
        when(bookingService.getBookingById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "customer@example.com", roles = "CUSTOMER")
    @DisplayName("GET /api/v1/bookings/{id}: CUSTOMER là chính chủ -> 200 OK")
    void getBookingById_customerOwner_returns200() throws Exception {
        when(bookingSecurity.isOwner(1L)).thenReturn(true);
        BookingResponse response = BookingResponse.builder()
                .id(1L)
                .status(BookingStatus.PENDING)
                .build();
        when(bookingService.getBookingById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @WithMockUser(username = "other@example.com", roles = "CUSTOMER")
    @DisplayName("GET /api/v1/bookings/{id}: CUSTOMER không phải chủ đơn -> 403 Forbidden")
    void getBookingById_customerNotOwner_returns403() throws Exception {
        when(bookingSecurity.isOwner(1L)).thenReturn(false);

        mockMvc.perform(get("/api/v1/bookings/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/bookings/{id}: ID không tồn tại -> 404 Not Found")
    void getBookingById_notFound_returns404() throws Exception {
        when(bookingService.getBookingById(999L))
                .thenThrow(new AppException(ErrorCode.BOOKING_NOT_FOUND));

        mockMvc.perform(get("/api/v1/bookings/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("BOOKING_NOT_FOUND"));
    }

    // -------------------------------------------------------------
    // GET /api/v1/bookings
    // -------------------------------------------------------------

    @Test
    @DisplayName("GET /api/v1/bookings: Chưa đăng nhập -> 401 Unauthorized")
    void getBookings_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("GET /api/v1/bookings: Vai trò CUSTOMER -> 403 Forbidden")
    void getBookings_customer_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/bookings: Vai trò STAFF -> 200 OK")
    void getBookings_staff_returns200() throws Exception {
        PageResponse<BookingResponse> page = PageResponse.<BookingResponse>builder()
                .items(Collections.emptyList())
                .page(0)
                .size(10)
                .totalElements(0)
                .totalPages(0)
                .first(true)
                .last(true)
                .build();
        when(bookingService.getBookings(any(), any(), any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("GET /api/v1/bookings: Sort ngoài whitelist -> 400 Bad Request")
    void getBookings_invalidSort_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/bookings").param("sort", "password,asc"))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------
    // Kiểm chứng Routing: /my và /availability không bị nuốt bởi /{id}
    // -------------------------------------------------------------

    @Test
    @WithMockUser(username = "customer@example.com", roles = "CUSTOMER")
    @DisplayName("Routing: GET /api/v1/bookings/my được gọi đúng method, không bị nuốt bởi /{id}")
    void getMyBookings_routing_notSwallowedByPathVariable() throws Exception {
        PageResponse<BookingResponse> page = PageResponse.<BookingResponse>builder()
                .items(Collections.emptyList())
                .page(0)
                .size(10)
                .totalElements(0)
                .totalPages(0)
                .first(true)
                .last(true)
                .build();
        when(bookingService.getMyBookings(any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/bookings/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Routing: GET /api/v1/bookings/availability là public, không bị nuốt bởi /{id}")
    void getAvailability_routing_notSwallowedByPathVariable() throws Exception {
        when(bookingService.getAvailability(eq(LocalDate.now()), any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/bookings/availability").param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
