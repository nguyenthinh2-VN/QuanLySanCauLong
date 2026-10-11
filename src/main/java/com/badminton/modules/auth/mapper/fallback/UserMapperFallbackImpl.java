package com.badminton.modules.auth.mapper.fallback;

import com.badminton.modules.auth.dto.request.RegisterRequest;
import com.badminton.modules.auth.dto.response.UserResponse;
import com.badminton.modules.auth.entity.User;
import com.badminton.modules.auth.mapper.UserMapper;

import java.util.Collections;
import java.util.stream.Collectors;

public class UserMapperFallbackImpl implements UserMapper {

    @Override
    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles() != null
                        ? user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet())
                        : Collections.emptySet())
                .build();
    }

    @Override
    public User toUser(RegisterRequest request) {
        if (request == null) {
            return null;
        }
        return User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .build();
    }
}
