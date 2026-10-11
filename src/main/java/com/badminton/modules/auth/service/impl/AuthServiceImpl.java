package com.badminton.modules.auth.service.impl;

import com.badminton.modules.auth.dto.request.ForgotPasswordRequest;
import com.badminton.modules.auth.dto.request.LoginRequest;
import com.badminton.modules.auth.dto.request.RefreshTokenRequest;
import com.badminton.modules.auth.dto.request.RegisterRequest;
import com.badminton.modules.auth.dto.request.ResetPasswordRequest;
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
import com.badminton.modules.auth.service.AuthService;
import com.badminton.notification.NotificationService;
import com.badminton.notification.dto.NotificationMessage;
import com.badminton.security.jwt.JwtTokenProvider;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.shared.constant.NotificationChannel;
import com.badminton.shared.constant.NotificationType;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Value("${jwt.reset-password-token-expiration-minutes:15}")
    private int resetPasswordTokenExpirationMinutes;

    @Value("${app.reset-password-url:http://localhost:3000/reset-password}")
    private String resetPasswordUrl;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER)
                .orElseThrow(
                        () -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Vai trò ROLE_CUSTOMER chưa được khởi tạo"));

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.addRole(customerRole);

        User savedUser = userRepository.save(user);

        // Gửi thông báo chào mừng qua NotificationService (DIP/OCP)
        NotificationMessage welcomeNotification = NotificationMessage.builder()
                .recipient(savedUser.getEmail())
                .subject("Chào mừng bạn gia nhập hệ thống Sân Cầu Lông!")
                .channel(NotificationChannel.EMAIL)
                .type(NotificationType.WELCOME_REGISTRATION)
                .content(String.format("Xin chào %s, tài khoản của bạn đã được đăng ký thành công.",
                        savedUser.getFullName()))
                .build();
        notificationService.send(welcomeNotification);

        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        RefreshToken refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationSeconds())
                .user(userMapper.toUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken oldRefreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (oldRefreshToken.isRevoked()) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (oldRefreshToken.isExpired()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = oldRefreshToken.getUser();

        // Token rotation: Thu hồi token cũ và sinh token mới
        oldRefreshToken.setRevoked(true);
        refreshTokenRepository.save(oldRefreshToken);

        RefreshToken newRefreshToken = createRefreshToken(user);
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        return AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationSeconds())
                .user(userMapper.toUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy người dùng với email: " + request.getEmail()));

        String tokenString = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plus(resetPasswordTokenExpirationMinutes, ChronoUnit.MINUTES);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(tokenString)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        String fullResetUrl = String.format("%s?token=%s", resetPasswordUrl, tokenString);

        // Gửi thông báo đặt lại mật khẩu qua NotificationService (DIP & OCP)
        NotificationMessage resetNotification = NotificationMessage.builder()
                .recipient(user.getEmail())
                .subject("Yêu cầu đặt lại mật khẩu - Badminton Court System")
                .channel(NotificationChannel.EMAIL)
                .type(NotificationType.PASSWORD_RESET)
                .content(String.format("Mã xác thực đặt lại mật khẩu của bạn là: %s. Mã có hiệu lực trong %d phút.",
                        tokenString, resetPasswordTokenExpirationMinutes))
                .param("token", tokenString)
                .param("expiryMinutes", resetPasswordTokenExpirationMinutes)
                .param("resetUrl", fullResetUrl)
                .build();

        notificationService.send(resetNotification);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.RESET_TOKEN_INVALID));

        if (resetToken.isExpired()) {
            throw new AppException(ErrorCode.RESET_TOKEN_EXPIRED);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Thu hồi toàn bộ refresh token hiện có để bảo mật
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshTokenExpirationMs))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }
}
