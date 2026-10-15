package com.badminton.config;

import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.repository.RoleRepository;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.court.entity.ComplexStatus;
import com.badminton.modules.court.entity.Court;
import com.badminton.modules.court.entity.CourtComplex;
import com.badminton.modules.court.entity.CourtStatus;
import com.badminton.modules.court.entity.TimeSlot;
import com.badminton.modules.court.repository.CourtComplexRepository;
import com.badminton.modules.court.repository.CourtRepository;
import com.badminton.modules.court.repository.TimeSlotRepository;
import com.badminton.shared.constant.RoleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CourtComplexRepository courtComplexRepository;
    private final CourtRepository courtRepository;
    private final TimeSlotRepository timeSlotRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedUsers();
        seedComplexesAndCourts();
        seedTimeSlots();
    }

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (!roleRepository.existsByName(roleType)) {
                String description = switch (roleType) {
                    case ROLE_ADMIN -> "Quản trị viên toàn quyền hệ thống";
                    case ROLE_STAFF -> "Nhân viên vận hành sân và check-in";
                    case ROLE_CUSTOMER -> "Khách hàng đặt sân và dịch vụ";
                };

                Role role = Role.builder()
                        .name(roleType)
                        .description(description)
                        .build();
                roleRepository.save(role);
                log.info("Khởi tạo Role mẫu: {}", roleType);
            }
        }
    }

    private void seedUsers() {
        // 1. Tạo tài khoản ADMIN mặc định
        if (!userRepository.existsByEmail("admin@badminton.com")) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN chưa được khởi tạo"));

            User admin = User.builder()
                    .fullName("Quản Trị Viên Hệ Thống")
                    .email("admin@badminton.com")
                    .phone("0900000001")
                    .password(passwordEncoder.encode("Admin@123"))
                    .active(true)
                    .roles(Set.of(adminRole))
                    .build();

            userRepository.save(admin);
            log.info("Khởi tạo tài khoản ADMIN mẫu: email=admin@badminton.com, password=Admin@123");
        }

        // 2. Tạo tài khoản STAFF mẫu
        if (!userRepository.existsByEmail("staff@badminton.com")) {
            Role staffRole = roleRepository.findByName(RoleType.ROLE_STAFF)
                    .orElseThrow(() -> new IllegalStateException("ROLE_STAFF chưa được khởi tạo"));

            User staff = User.builder()
                    .fullName("Nhân Viên Quầy Lễ Tân")
                    .email("staff@badminton.com")
                    .phone("0900000002")
                    .password(passwordEncoder.encode("Staff@123"))
                    .active(true)
                    .roles(Set.of(staffRole))
                    .build();

            userRepository.save(staff);
            log.info("Khởi tạo tài khoản STAFF mẫu: email=staff@badminton.com, password=Staff@123");
        }

        // 3. Tạo tài khoản CUSTOMER mẫu
        if (!userRepository.existsByEmail("customer@badminton.com")) {
            Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER)
                    .orElseThrow(() -> new IllegalStateException("ROLE_CUSTOMER chưa được khởi tạo"));

            User customer = User.builder()
                    .fullName("Khách Hàng Thân Thiết")
                    .email("customer@badminton.com")
                    .phone("0900000003")
                    .password(passwordEncoder.encode("Customer@123"))
                    .active(true)
                    .roles(Set.of(customerRole))
                    .build();

            userRepository.save(customer);
            log.info("Khởi tạo tài khoản CUSTOMER mẫu: email=customer@badminton.com, password=Customer@123");
        }
    }

    private void seedComplexesAndCourts() {
        if (courtComplexRepository.count() > 0) {
            return;
        }

        // Cụm sân 1: Cầu Giấy
        CourtComplex complex1 = CourtComplex.builder()
                .name("Cụm Sân Cầu Lông Cầu Giấy")
                .address("123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội")
                .phone("0912345678")
                .status(ComplexStatus.ACTIVE)
                .build();
        courtComplexRepository.save(complex1);

        Court court11 = Court.builder().complex(complex1).name("Sân 1 (Thảm Victor)").status(CourtStatus.AVAILABLE).build();
        Court court12 = Court.builder().complex(complex1).name("Sân 2 (Thảm Yonex)").status(CourtStatus.AVAILABLE).build();
        Court court13 = Court.builder().complex(complex1).name("Sân 3 (Thảm Lining VIP)").status(CourtStatus.AVAILABLE).build();
        courtRepository.saveAll(List.of(court11, court12, court13));

        // Cụm sân 2: Thanh Xuân
        CourtComplex complex2 = CourtComplex.builder()
                .name("Cụm Sân Cầu Lông Thanh Xuân")
                .address("456 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội")
                .phone("0987654321")
                .status(ComplexStatus.ACTIVE)
                .build();
        courtComplexRepository.save(complex2);

        Court court21 = Court.builder().complex(complex2).name("Sân 1 (Thảm Victor)").status(CourtStatus.AVAILABLE).build();
        Court court22 = Court.builder().complex(complex2).name("Sân 2 (Thảm Yonex)").status(CourtStatus.AVAILABLE).build();
        Court court23 = Court.builder().complex(complex2).name("Sân 3 (Đang bảo trì)").status(CourtStatus.MAINTENANCE).build();
        courtRepository.saveAll(List.of(court21, court22, court23));

        log.info("Khởi tạo thành công 2 Cụm sân mẫu và 6 Sân con");
    }

    private void seedTimeSlots() {
        if (timeSlotRepository.count() > 0) {
            return;
        }

        List<TimeSlot> slots = List.of(
                TimeSlot.builder()
                        .name("Sáng sớm 05:00–08:00")
                        .startTime(LocalTime.of(5, 0))
                        .endTime(LocalTime.of(8, 0))
                        .pricePerHour(new BigDecimal("80000"))
                        .build(),
                TimeSlot.builder()
                        .name("Giờ hành chính 08:00–16:00")
                        .startTime(LocalTime.of(8, 0))
                        .endTime(LocalTime.of(16, 0))
                        .pricePerHour(new BigDecimal("100000"))
                        .build(),
                TimeSlot.builder()
                        .name("Giờ vàng chiều tối 16:00–21:00")
                        .startTime(LocalTime.of(16, 0))
                        .endTime(LocalTime.of(21, 0))
                        .pricePerHour(new BigDecimal("150000"))
                        .build(),
                TimeSlot.builder()
                        .name("Đêm muộn 21:00–23:00")
                        .startTime(LocalTime.of(21, 0))
                        .endTime(LocalTime.of(23, 0))
                        .pricePerHour(new BigDecimal("120000"))
                        .build()
        );

        timeSlotRepository.saveAll(slots);
        log.info("Khởi tạo thành công 4 Khung giờ & Bảng giá chuẩn");
    }
}
