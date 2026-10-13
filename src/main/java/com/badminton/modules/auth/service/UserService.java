package com.badminton.modules.auth.service;

import com.badminton.modules.auth.dto.request.CreateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRequest;
import com.badminton.modules.auth.dto.request.UpdateUserRolesRequest;
import com.badminton.modules.auth.dto.request.UpdateUserStatusRequest;
import com.badminton.modules.auth.dto.response.UserResponse;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.response.PageResponse;

public interface UserService {

    PageResponse<UserResponse> getUsers(String search, RoleType role, Boolean active, int page, int size, String sort);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    UserResponse updateUserRoles(Long id, UpdateUserRolesRequest request);

    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);

    void deleteUser(Long id);
}
