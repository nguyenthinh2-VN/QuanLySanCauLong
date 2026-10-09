package com.badminton.service;

import com.badminton.dto.request.ForgotPasswordRequest;
import com.badminton.dto.request.LoginRequest;
import com.badminton.dto.request.RefreshTokenRequest;
import com.badminton.dto.request.RegisterRequest;
import com.badminton.dto.request.ResetPasswordRequest;
import com.badminton.dto.response.AuthResponse;
import com.badminton.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser();
}
