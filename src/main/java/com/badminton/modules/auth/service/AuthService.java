package com.badminton.modules.auth.service;

import com.badminton.modules.auth.dto.request.ForgotPasswordRequest;
import com.badminton.modules.auth.dto.request.LoginRequest;
import com.badminton.modules.auth.dto.request.RefreshTokenRequest;
import com.badminton.modules.auth.dto.request.RegisterRequest;
import com.badminton.modules.auth.dto.request.ResetPasswordRequest;
import com.badminton.modules.auth.dto.response.AuthResponse;
import com.badminton.modules.auth.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser();
}
