package com.badminton.config;

import com.badminton.common.enums.RoleType;
import com.badminton.entity.Role;
import com.badminton.entity.User;
import com.badminton.repository.RoleRepository;
import com.badminton.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedUsers();
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
}
