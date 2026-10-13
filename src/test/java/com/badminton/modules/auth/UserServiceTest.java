package com.badminton.modules.auth;

import com.badminton.modules.auth.dto.request.CreateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRolesRequest;
import com.badminton.modules.auth.dto.request.UpdateUserStatusRequest;
import com.badminton.modules.auth.dto.response.UserResponse;
import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.mapper.UserMapper;
import com.badminton.modules.auth.repository.PasswordResetTokenRepository;
import com.badminton.modules.auth.repository.RefreshTokenRepository;
import com.badminton.modules.auth.repository.RoleRepository;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.auth.service.impl.UserServiceImpl;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

        @Mock
        private UserRepository userRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private RefreshTokenRepository refreshTokenRepository;

        @Mock
        private PasswordResetTokenRepository passwordResetTokenRepository;

        @Mock
        private PasswordEncoder passwordEncoder;

        @Mock
        private UserMapper userMapper;

        @InjectMocks
        private UserServiceImpl userService;

        private Role adminRole;
        private Role staffRole;
        private Role customerRole;
        private User adminUser;
        private User staffUser;

        @BeforeEach
        void setUp() {
                adminRole = Role.builder().id(1L).name(RoleType.ROLE_ADMIN).description("Admin").build();
                staffRole = Role.builder().id(2L).name(RoleType.ROLE_STAFF).description("Staff").build();
                customerRole = Role.builder().id(3L).name(RoleType.ROLE_CUSTOMER).description("Customer").build();

                adminUser = User.builder()
                                .fullName("Root Admin")
                                .email("admin@badminton.com")
                                .phone("0900000001")
                                .password("encoded-pwd")
                                .active(true)
                                .roles(new HashSet<>(Set.of(adminRole)))
                                .build();
                adminUser.setId(1L);

                staffUser = User.builder()
                                .fullName("Staff Member")
                                .email("staff@badminton.com")
                                .phone("0900000002")
                                .password("encoded-pwd")
                                .active(true)
                                .roles(new HashSet<>(Set.of(staffRole)))
                                .build();
                staffUser.setId(2L);

                // Giả lập Admin đang đăng nhập (ID = 1)
                CustomUserDetails userDetails = new CustomUserDetails(adminUser);
                Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null,
                                userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
        }

        @Test
        @DisplayName("Lấy danh sách người dùng phân trang thành công")
        void getUsers_Success() {
                Page<User> page = new PageImpl<>(List.of(adminUser, staffUser));
                when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
                when(userMapper.toUserResponse(any(User.class))).thenReturn(UserResponse.builder().id(1L).build());

                PageResponse<UserResponse> result = userService.getUsers(null, null, null, 0, 10, "createdAt,desc");

                assertThat(result).isNotNull();
                assertThat(result.getItems()).hasSize(2);
                assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Lấy thông tin người dùng theo ID thành công")
        void getUserById_Success() {
                when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
                when(userMapper.toUserResponse(adminUser))
                                .thenReturn(UserResponse.builder().id(1L).email("admin@badminton.com").build());

                UserResponse result = userService.getUserById(1L);

                assertThat(result).isNotNull();
                assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Lấy thông tin người dùng theo ID thất bại khi ID không tồn tại")
        void getUserById_NotFound_ThrowsException() {
                when(userRepository.findById(999L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> userService.getUserById(999L))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.USER_NOT_FOUND.getMessage());
        }

        @Test
        @DisplayName("Tạo người dùng mới thành công với role STAFF")
        void createUser_Success() {
                CreateUserRequest request = CreateUserRequest.builder()
                                .fullName("New Staff")
                                .email("newstaff@badminton.com")
                                .phone("0912345678")
                                .password("Password@123")
                                .roles(Set.of("ROLE_STAFF"))
                                .build();

                User unmapped = User.builder().fullName("New Staff").build();
                User saved = User.builder().fullName("New Staff").email("newstaff@badminton.com").build();
                saved.setId(10L);

                when(userRepository.existsByEmail("newstaff@badminton.com")).thenReturn(false);
                when(userRepository.existsByPhone("0912345678")).thenReturn(false);
                when(roleRepository.findByName(RoleType.ROLE_STAFF)).thenReturn(Optional.of(staffRole));
                when(userMapper.toUser(request)).thenReturn(unmapped);
                when(passwordEncoder.encode(anyString())).thenReturn("encoded-pwd");
                when(userRepository.saveAndFlush(any(User.class))).thenReturn(saved);
                when(userMapper.toUserResponse(saved))
                                .thenReturn(UserResponse.builder().id(10L).fullName("New Staff").build());

                UserResponse result = userService.createUser(request);

                assertThat(result).isNotNull();
                assertThat(result.getId()).isEqualTo(10L);
                verify(userRepository).saveAndFlush(any(User.class));
        }

        @Test
        @DisplayName("Guard: Không cho phép tạo tài khoản có quyền ADMIN qua API")
        void createUser_CannotCreateAdmin_ThrowsException() {
                CreateUserRequest request = CreateUserRequest.builder()
                                .fullName("Hacker Admin")
                                .email("hacker@badminton.com")
                                .phone("0911111111")
                                .password("Password@123")
                                .roles(Set.of("ROLE_ADMIN"))
                                .build();

                when(userRepository.existsByEmail("hacker@badminton.com")).thenReturn(false);
                when(userRepository.existsByPhone("0911111111")).thenReturn(false);
                when(roleRepository.findByName(RoleType.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));

                assertThatThrownBy(() -> userService.createUser(request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.CANNOT_CREATE_ADMIN.getMessage());
        }

        @Test
        @DisplayName("Guard: Admin không thể tự gỡ quyền ADMIN của chính mình")
        void updateUserRoles_AdminCannotRemoveOwnAdminRole_ThrowsException() {
                UpdateUserRolesRequest request = UpdateUserRolesRequest.builder()
                                .roles(Set.of("ROLE_STAFF"))
                                .build();

                when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
                when(roleRepository.findByName(RoleType.ROLE_STAFF)).thenReturn(Optional.of(staffRole));

                // Admin đang đăng nhập có ID = 1 và gọi đổi roles của ID = 1
                assertThatThrownBy(() -> userService.updateUserRoles(1L, request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.CANNOT_REMOVE_OWN_ADMIN_ROLE.getMessage());
        }

        @Test
        @DisplayName("Guard: Không được gỡ role ADMIN của Admin duy nhất còn lại trong hệ thống")
        void updateUserRoles_CannotRemoveLastAdminRole_ThrowsException() {
                User otherAdmin = User.builder()
                                .fullName("Admin Two")
                                .email("admin2@badminton.com")
                                .phone("0900000099")
                                .active(true)
                                .roles(new HashSet<>(Set.of(adminRole)))
                                .build();
                otherAdmin.setId(2L);

                UpdateUserRolesRequest request = UpdateUserRolesRequest.builder()
                                .roles(Set.of("ROLE_CUSTOMER"))
                                .build();

                when(userRepository.findById(2L)).thenReturn(Optional.of(otherAdmin));
                when(roleRepository.findByName(RoleType.ROLE_CUSTOMER)).thenReturn(Optional.of(customerRole));
                when(userRepository.countByRolesName(RoleType.ROLE_ADMIN)).thenReturn(1L); // Chỉ còn 1 admin

                assertThatThrownBy(() -> userService.updateUserRoles(2L, request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED.getMessage());
        }

        @Test
        @DisplayName("Guard: Admin không thể tự khóa tài khoản của chính mình")
        void updateUserStatus_AdminCannotLockSelf_ThrowsException() {
                UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                                .active(false)
                                .build();

                when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

                assertThatThrownBy(() -> userService.updateUserStatus(1L, request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.CANNOT_LOCK_SELF.getMessage());
        }

        @Test
        @DisplayName("Guard: Không thể khóa tài khoản Admin duy nhất còn hoạt động")
        void updateUserStatus_CannotLockLastActiveAdmin_ThrowsException() {
                User otherAdmin = User.builder()
                                .fullName("Second Admin")
                                .roles(new HashSet<>(Set.of(adminRole)))
                                .active(true)
                                .build();
                otherAdmin.setId(2L);

                UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                                .active(false)
                                .build();

                when(userRepository.findById(2L)).thenReturn(Optional.of(otherAdmin));
                when(userRepository.countActiveAdmins(RoleType.ROLE_ADMIN)).thenReturn(1L);

                assertThatThrownBy(() -> userService.updateUserStatus(2L, request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED.getMessage());
        }

        @Test
        @DisplayName("Khóa tài khoản thành công và thu hồi toàn bộ token đăng nhập")
        void updateUserStatus_LockSuccess_RevokesTokens() {
                UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                                .active(false)
                                .build();

                when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
                when(userRepository.save(staffUser)).thenReturn(staffUser);
                when(userMapper.toUserResponse(staffUser))
                                .thenReturn(UserResponse.builder().id(2L).active(false).build());

                UserResponse response = userService.updateUserStatus(2L, request);

                assertThat(response.isActive()).isFalse();
                verify(refreshTokenRepository).revokeAllUserTokens(staffUser);
        }

        @Test
        @DisplayName("Guard: Admin không thể tự xóa tài khoản của chính mình")
        void deleteUser_AdminCannotDeleteSelf_ThrowsException() {
                when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

                assertThatThrownBy(() -> userService.deleteUser(1L))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.CANNOT_DELETE_SELF.getMessage());
        }

        @Test
        @DisplayName("Guard: Không thể xóa Admin duy nhất còn lại trong hệ thống")
        void deleteUser_CannotDeleteLastAdmin_ThrowsException() {
                User otherAdmin = User.builder()
                                .fullName("Lone Admin")
                                .roles(new HashSet<>(Set.of(adminRole)))
                                .build();
                otherAdmin.setId(2L);

                when(userRepository.findById(2L)).thenReturn(Optional.of(otherAdmin));
                when(userRepository.countByRolesName(RoleType.ROLE_ADMIN)).thenReturn(1L);

                assertThatThrownBy(() -> userService.deleteUser(2L))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED.getMessage());
        }

        @Test
        @DisplayName("Xóa người dùng thành công (Hard delete dọn sạch tokens)")
        void deleteUser_Success() {
                when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

                userService.deleteUser(2L);

                verify(refreshTokenRepository).deleteByUser(staffUser);
                verify(passwordResetTokenRepository).deleteByUser(staffUser);
                verify(userRepository).delete(staffUser);
        }
}
