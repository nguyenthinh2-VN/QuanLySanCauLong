package com.badminton.modules.auth;

import com.badminton.modules.auth.dto.request.ForgotPasswordRequest;
import com.badminton.modules.auth.dto.request.LoginRequest;
import com.badminton.modules.auth.dto.request.RefreshTokenRequest;
import com.badminton.modules.auth.dto.request.RegisterRequest;
import com.badminton.modules.auth.dto.response.AuthResponse;
import com.badminton.modules.auth.dto.response.UserResponse;
import com.badminton.modules.auth.entity.PasswordResetToken;
import com.badminton.modules.auth.entity.RefreshToken;
import com.badminton.modules.auth.entity.Role;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.mapper.UserMapper;
import com.badminton.modules.auth.repository.PasswordResetTokenRepository;
import com.badminton.modules.auth.repository.RefreshTokenRepository;
import com.badminton.modules.auth.repository.RoleRepository;
import com.badminton.modules.auth.repository.UserRepository;
import com.badminton.modules.auth.service.impl.AuthServiceImpl;
import com.badminton.notification.NotificationService;
import com.badminton.notification.dto.NotificationMessage;
import com.badminton.security.jwt.JwtTokenProvider;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

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
        private AuthenticationManager authenticationManager;

        @Mock
        private JwtTokenProvider jwtTokenProvider;

        @Mock
        private UserMapper userMapper;

        @Mock
        private NotificationService notificationService;

        @InjectMocks
        private AuthServiceImpl authService;

        private Role customerRole;
        private User user;

        @BeforeEach
        void setUp() {
                ReflectionTestUtils.setField(authService, "refreshTokenExpirationMs", 604800000L);
                ReflectionTestUtils.setField(authService, "resetPasswordTokenExpirationMinutes", 15);
                ReflectionTestUtils.setField(authService, "resetPasswordUrl", "http://localhost:3000/reset-password");

                customerRole = Role.builder()
                                .id(1L)
                                .name(RoleType.ROLE_CUSTOMER)
                                .description("Customer role")
                                .build();

                user = User.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .password("encoded-password")
                                .active(true)
                                .roles(new HashSet<>(Set.of(customerRole)))
                                .build();
        }

        @Test
        @DisplayName("Đăng ký thành công - gán role CUSTOMER và mã hóa mật khẩu")
        void register_Success() {
                RegisterRequest request = RegisterRequest.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .password("Password@123")
                                .build();

                User unmappedUser = User.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .active(true)
                                .roles(new HashSet<>())
                                .build();

                when(userRepository.existsByEmail(anyString())).thenReturn(false);
                when(userRepository.existsByPhone(anyString())).thenReturn(false);
                when(roleRepository.findByName(RoleType.ROLE_CUSTOMER)).thenReturn(Optional.of(customerRole));
                when(userMapper.toUser(request)).thenReturn(unmappedUser);
                when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
                when(userRepository.saveAndFlush(any(User.class))).thenReturn(user);

                UserResponse expectedResponse = UserResponse.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .active(true)
                                .roles(Set.of("ROLE_CUSTOMER"))
                                .build();

                when(userMapper.toUserResponse(user)).thenReturn(expectedResponse);

                UserResponse result = authService.register(request);

                assertThat(result).isNotNull();
                assertThat(result.getEmail()).isEqualTo("test@example.com");
                verify(userRepository).saveAndFlush(any(User.class));
        }

        @Test
        @DisplayName("Đăng ký thất bại khi email đã tồn tại")
        void register_DuplicateEmail_ThrowsException() {
                RegisterRequest request = RegisterRequest.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .password("Password@123")
                                .build();

                when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

                assertThatThrownBy(() -> authService.register(request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.EMAIL_ALREADY_EXISTS.getMessage());
        }

        @Test
        @DisplayName("Đăng nhập thành công trả về accessToken và refreshToken")
        void login_Success() {
                LoginRequest request = LoginRequest.builder()
                                .email("test@example.com")
                                .password("Password@123")
                                .build();

                CustomUserDetails userDetails = new CustomUserDetails(user);
                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
                                userDetails.getAuthorities());

                when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                                .thenReturn(authentication);
                when(jwtTokenProvider.generateAccessToken(userDetails)).thenReturn("mock-access-token");
                when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

                RefreshToken savedRefreshToken = RefreshToken.builder()
                                .token(UUID.randomUUID().toString())
                                .user(user)
                                .expiryDate(Instant.now().plusMillis(604800000L))
                                .revoked(false)
                                .build();

                when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(savedRefreshToken);

                AuthResponse response = authService.login(request);

                assertThat(response).isNotNull();
                assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
                assertThat(response.getTokenType()).isEqualTo("Bearer");
                assertThat(response.getRefreshToken()).isNotNull();
        }

        @Test
        @DisplayName("Refresh token thành công và xoay vòng token (Token Rotation)")
        void refreshToken_Success() {
                String tokenStr = "valid-refresh-token";
                RefreshTokenRequest request = RefreshTokenRequest.builder()
                                .refreshToken(tokenStr)
                                .build();

                RefreshToken existingToken = RefreshToken.builder()
                                .token(tokenStr)
                                .user(user)
                                .expiryDate(Instant.now().plusSeconds(3600))
                                .revoked(false)
                                .build();

                when(refreshTokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(existingToken));
                when(jwtTokenProvider.generateAccessToken(any(CustomUserDetails.class))).thenReturn("new-access-token");
                when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

                RefreshToken newRefreshToken = RefreshToken.builder()
                                .token("new-refresh-token")
                                .user(user)
                                .expiryDate(Instant.now().plusSeconds(3600))
                                .revoked(false)
                                .build();

                when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(newRefreshToken);

                AuthResponse response = authService.refreshToken(request);

                assertThat(response).isNotNull();
                assertThat(response.getAccessToken()).isEqualTo("new-access-token");
                assertThat(existingToken.isRevoked()).isTrue();
        }

        @Test
        @DisplayName("Quên mật khẩu - tạo reset token và gửi thông báo qua NotificationService")
        void forgotPassword_Success() {
                ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                                .email("test@example.com")
                                .build();

                when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

                authService.forgotPassword(request);

                verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
                verify(notificationService).send(any(NotificationMessage.class));
        }

        @Test
        @DisplayName("Quên mật khẩu - email không tồn tại thì không throw exception và không gửi thông báo")
        void forgotPassword_EmailNotFound_DoesNotThrowAndDoesNotSendNotification() {
                ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                                .email("nonexistent@example.com")
                                .build();

                when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

                org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> authService.forgotPassword(request));

                org.mockito.Mockito.verifyNoInteractions(passwordResetTokenRepository);
                org.mockito.Mockito.verifyNoInteractions(notificationService);
        }

        @Test
        @DisplayName("Đăng ký - bắt lỗi DataIntegrityViolationException khi trùng email do Race Condition")
        void register_ConcurrencyDuplicateEmail_ThrowsException() {
                RegisterRequest request = RegisterRequest.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .password("Password@123")
                                .build();

                User unmappedUser = User.builder()
                                .fullName("Test User")
                                .email("test@example.com")
                                .phone("0987654321")
                                .active(true)
                                .roles(new HashSet<>())
                                .build();

                when(userRepository.existsByEmail(anyString())).thenReturn(false).thenReturn(true);
                when(userRepository.existsByPhone(anyString())).thenReturn(false);
                when(roleRepository.findByName(RoleType.ROLE_CUSTOMER)).thenReturn(Optional.of(customerRole));
                when(userMapper.toUser(request)).thenReturn(unmappedUser);
                when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
                when(userRepository.saveAndFlush(any(User.class)))
                                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Unique constraint violation"));

                assertThatThrownBy(() -> authService.register(request))
                                .isInstanceOf(AppException.class)
                                .hasMessage(ErrorCode.EMAIL_ALREADY_EXISTS.getMessage());
        }
}
