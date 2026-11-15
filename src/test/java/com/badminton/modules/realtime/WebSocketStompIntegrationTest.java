package com.badminton.modules.realtime;

import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.RoleRepository;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.booking.dto.request.CreateBookingRequest;
import com.badminton.modules.booking.dto.request.UpdateBookingRequest;
import com.badminton.modules.booking.dto.response.BookingResponse;
import com.badminton.modules.booking.entity.SlotStatus;
import com.badminton.modules.booking.repository.BookingRepository;
import com.badminton.modules.booking.service.BookingService;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.modules.realtime.dto.AvailabilityMessage;
import com.badminton.security.jwt.JwtTokenProvider;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleConstants;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebSocketStompIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CourtComplexRepository courtComplexRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Court court1;
    private Court court2;
    private TimeSlot slot1;
    private TimeSlot slot2;
    private LocalDate bookingDate;
    private String validToken;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        Role roleCustomer = roleRepository.findByName(RoleType.ROLE_CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_CUSTOMER)
                        .description("Customer")
                        .build()));

        testUser = userRepository.findByEmail("ws_test_user@badminton.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("ws_test_user@badminton.com")
                        .fullName("WebSocket Test User")
                        .phone("0988776655")
                        .password("hashed_password")
                        .active(true)
                        .roles(Set.of(roleCustomer))
                        .build()));

        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        validToken = jwtTokenProvider.generateAccessToken(userDetails);

        CourtComplex complex = courtComplexRepository.findAll().stream().findFirst()
                .orElseGet(() -> courtComplexRepository.save(CourtComplex.builder()
                        .name("Cụm Sân Realtime Test")
                        .address("123 Cầu Giấy, Hà Nội")
                        .phone("0241234567")
                        .build()));

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        court1 = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân WS 1 " + suffix)
                .status(CourtStatus.AVAILABLE)
                .build());

        court2 = courtRepository.save(Court.builder()
                .complex(complex)
                .name("Sân WS 2 " + suffix)
                .status(CourtStatus.AVAILABLE)
                .build());

        slot1 = timeSlotRepository.save(TimeSlot.builder()
                .name("18:00 - 19:00 " + suffix)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(19, 0))
                .pricePerHour(new BigDecimal("100000.00"))
                .build());

        slot2 = timeSlotRepository.save(TimeSlot.builder()
                .name("19:00 - 20:00 " + suffix)
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 0))
                .pricePerHour(new BigDecimal("120000.00"))
                .build());

        bookingDate = LocalDate.now().plusDays(3);

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);
    }

    @AfterEach
    void tearDown() {
        if (stompClient != null && stompClient.isRunning()) {
            stompClient.stop();
        }
        try {
            bookingRepository.deleteAll();
            if (court1 != null && court1.getId() != null) {
                courtRepository.deleteById(court1.getId());
            }
            if (court2 != null && court2.getId() != null) {
                courtRepository.deleteById(court2.getId());
            }
            if (slot1 != null && slot1.getId() != null) {
                timeSlotRepository.deleteById(slot1.getId());
            }
            if (slot2 != null && slot2.getId() != null) {
                timeSlotRepository.deleteById(slot2.getId());
            }
        } catch (Exception ignored) {
        }
        SecurityContextHolder.clearContext();
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/ws";
    }

    private void authenticateUser() {
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("CONNECT không có token -> Server từ chối kết nối")
    void connect_withoutToken_rejected() {
        StompHeaders connectHeaders = new StompHeaders();

        assertThatThrownBy(() -> stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS))
                .isInstanceOf(ExecutionException.class);
    }

    @Test
    @DisplayName("CONNECT với token giả / không hợp lệ -> Server từ chối kết nối")
    void connect_withInvalidToken_rejected() {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer invalid.jwt.token.here");

        assertThatThrownBy(() -> stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS))
                .isInstanceOf(ExecutionException.class);
    }

    @Test
    @DisplayName("CONNECT thành công và nhận broadcast khi tạo booking -> 1 message BOOKED")
    void createBooking_broadcastsBookedMessage() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken);

        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);

        assertThat(session.isConnected()).isTrue();

        BlockingQueue<AvailabilityMessage> queue = new LinkedBlockingQueue<>();
        session.subscribe("/topic/availability", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return AvailabilityMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                queue.offer((AvailabilityMessage) payload);
            }
        });
        Thread.sleep(300);

        // Tạo booking qua REST/Service
        authenticateUser();
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(court1.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot1.getId())
                .note("WS test booking")
                .build();

        BookingResponse created = bookingService.createBooking(request);
        assertThat(created).isNotNull();

        // Nhận đúng message trên /topic/availability
        AvailabilityMessage msg = queue.poll(5, TimeUnit.SECONDS);
        assertThat(msg).isNotNull();
        assertThat(msg.type()).isEqualTo("AVAILABILITY_CHANGED");
        assertThat(msg.courtId()).isEqualTo(court1.getId());
        assertThat(msg.bookingDate()).isEqualTo(bookingDate);
        assertThat(msg.timeSlotId()).isEqualTo(slot1.getId());
        assertThat(msg.slotStatus()).isEqualTo(SlotStatus.BOOKED);

        session.disconnect();
    }

    @Test
    @DisplayName("Hủy booking -> Nhận 1 message FREE trên /topic/availability")
    void cancelBooking_broadcastsFreeMessage() throws Exception {
        authenticateUser();
        CreateBookingRequest request = CreateBookingRequest.builder()
                .courtId(court1.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot1.getId())
                .build();
        BookingResponse created = bookingService.createBooking(request);

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken);
        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);

        BlockingQueue<AvailabilityMessage> queue = new LinkedBlockingQueue<>();
        session.subscribe("/topic/availability", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return AvailabilityMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                queue.offer((AvailabilityMessage) payload);
            }
        });
        Thread.sleep(300);

        // Hủy booking
        bookingService.cancelBooking(created.getId());

        AvailabilityMessage msg = queue.poll(5, TimeUnit.SECONDS);
        assertThat(msg).isNotNull();
        assertThat(msg.courtId()).isEqualTo(court1.getId());
        assertThat(msg.bookingDate()).isEqualTo(bookingDate);
        assertThat(msg.timeSlotId()).isEqualTo(slot1.getId());
        assertThat(msg.slotStatus()).isEqualTo(SlotStatus.FREE);

        session.disconnect();
    }

    @Test
    @DisplayName("Đổi lịch booking -> Nhận 2 message (slot cũ FREE, slot mới BOOKED)")
    void updateBooking_broadcastsTwoMessages() throws Exception {
        authenticateUser();
        CreateBookingRequest createReq = CreateBookingRequest.builder()
                .courtId(court1.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot1.getId())
                .build();
        BookingResponse created = bookingService.createBooking(createReq);

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken);
        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);

        BlockingQueue<AvailabilityMessage> queue = new LinkedBlockingQueue<>();
        session.subscribe("/topic/availability", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return AvailabilityMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                queue.offer((AvailabilityMessage) payload);
            }
        });
        Thread.sleep(300);

        // Đổi lịch sang court2 và slot2
        UpdateBookingRequest updateReq = UpdateBookingRequest.builder()
                .courtId(court2.getId())
                .timeSlotId(slot2.getId())
                .bookingDate(bookingDate)
                .build();
        bookingService.updateBooking(created.getId(), updateReq);

        List<AvailabilityMessage> received = new ArrayList<>();
        AvailabilityMessage msg1 = queue.poll(5, TimeUnit.SECONDS);
        AvailabilityMessage msg2 = queue.poll(5, TimeUnit.SECONDS);
        if (msg1 != null) received.add(msg1);
        if (msg2 != null) received.add(msg2);

        assertThat(received).hasSize(2);
        assertThat(received).anySatisfy(m -> {
            assertThat(m.courtId()).isEqualTo(court1.getId());
            assertThat(m.timeSlotId()).isEqualTo(slot1.getId());
            assertThat(m.slotStatus()).isEqualTo(SlotStatus.FREE);
        });
        assertThat(received).anySatisfy(m -> {
            assertThat(m.courtId()).isEqualTo(court2.getId());
            assertThat(m.timeSlotId()).isEqualTo(slot2.getId());
            assertThat(m.slotStatus()).isEqualTo(SlotStatus.BOOKED);
        });

        session.disconnect();
    }

    @Test
    @DisplayName("Transaction rollback (đặt trùng slot -> 409) -> Không có message nào được gửi đi")
    void transactionRollback_noMessageBroadcasted() throws Exception {
        authenticateUser();
        CreateBookingRequest firstReq = CreateBookingRequest.builder()
                .courtId(court1.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot1.getId())
                .build();
        bookingService.createBooking(firstReq);

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken);
        StompSession session = stompClient.connectAsync(
                getWsUrl(),
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);

        BlockingQueue<AvailabilityMessage> queue = new LinkedBlockingQueue<>();
        session.subscribe("/topic/availability", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return AvailabilityMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                queue.offer((AvailabilityMessage) payload);
            }
        });
        Thread.sleep(300);

        // Cố tình đặt trùng slot -> 409 SLOT_ALREADY_BOOKED
        CreateBookingRequest duplicateReq = CreateBookingRequest.builder()
                .courtId(court1.getId())
                .bookingDate(bookingDate)
                .timeSlotId(slot1.getId())
                .build();

        assertThatThrownBy(() -> bookingService.createBooking(duplicateReq))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.SLOT_ALREADY_BOOKED));

        // Kiểm tra sau 1.5 giây không nhận được message nào
        AvailabilityMessage msg = queue.poll(1500, TimeUnit.MILLISECONDS);
        assertThat(msg).isNull();

        session.disconnect();
    }
}

