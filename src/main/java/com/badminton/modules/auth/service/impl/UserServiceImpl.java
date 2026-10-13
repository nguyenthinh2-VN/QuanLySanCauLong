package com.badminton.modules.auth.service.impl;

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
import com.badminton.modules.auth.service.UserService;
import com.badminton.security.SecurityUtils;
import com.badminton.shared.constant.RoleType;
import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import com.badminton.shared.response.PageResponse;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String search, RoleType role, Boolean active, int page, int size,
            String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sortObj);

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate namePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(namePredicate, emailPredicate));
            }

            if (role != null) {
                Join<User, Role> roleJoin = root.join("roles");
                predicates.add(cb.equal(roleJoin.get("name"), role));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        return PageResponse.from(userPage.map(userMapper::toUserResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = findUserById(id);
        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        Set<Role> roles = resolveRoles(request.getRoles());
        // Guard: Không cho phép tạo tài khoản có quyền ADMIN qua API này
        boolean hasAdminRole = roles.stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        if (hasAdminRole) {
            throw new AppException(ErrorCode.CANNOT_CREATE_ADMIN);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(roles);

        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUserById(id);

        if (userRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        userMapper.updateUserFromRequest(user, request);
        User updatedUser = userRepository.save(user);

        return userMapper.toUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateUserRolesRequest request) {
        User user = findUserById(id);
        Set<Role> newRoles = resolveRoles(request.getRoles());
        boolean targetCurrentlyHasAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        boolean newRolesContainAdmin = newRoles.stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);

        Long currentAdminId = SecurityUtils.getCurrentUserId().orElse(null);

        // Guard 1: Admin không được tự gỡ quyền ADMIN của chính mình
        if (id.equals(currentAdminId) && targetCurrentlyHasAdmin && !newRolesContainAdmin) {
            throw new AppException(ErrorCode.CANNOT_REMOVE_OWN_ADMIN_ROLE);
        }

        // Guard 2: Không được gỡ role ADMIN của Admin duy nhất còn lại trong hệ thống
        if (targetCurrentlyHasAdmin && !newRolesContainAdmin) {
            long totalAdmins = userRepository.countByRolesName(RoleType.ROLE_ADMIN);
            if (totalAdmins <= 1) {
                throw new AppException(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED);
            }
        }

        user.setRoles(newRoles);
        User updatedUser = userRepository.save(user);

        return userMapper.toUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = findUserById(id);
        boolean targetHasAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        boolean targetWillBeLocked = Boolean.FALSE.equals(request.getActive());

        Long currentAdminId = SecurityUtils.getCurrentUserId().orElse(null);

        // Guard 1: Admin không được tự khóa chính mình
        if (id.equals(currentAdminId) && targetWillBeLocked) {
            throw new AppException(ErrorCode.CANNOT_LOCK_SELF);
        }

        // Guard 2: Không được khóa Admin duy nhất còn đang hoạt động
        if (targetHasAdmin && targetWillBeLocked) {
            long activeAdmins = userRepository.countActiveAdmins(RoleType.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new AppException(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED);
            }
        }

        user.setActive(request.getActive());
        if (targetWillBeLocked) {
            // Thu hồi phiên đăng nhập ngay lập tức khi tài khoản bị khóa
            refreshTokenRepository.revokeAllUserTokens(user);
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUserById(id);
        boolean targetHasAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);

        Long currentAdminId = SecurityUtils.getCurrentUserId().orElse(null);

        // Guard 1: Admin không được tự xóa chính mình
        if (id.equals(currentAdminId)) {
            throw new AppException(ErrorCode.CANNOT_DELETE_SELF);
        }

        // Guard 2: Không được xóa Admin duy nhất còn lại trong hệ thống
        if (targetHasAdmin) {
            long totalAdmins = userRepository.countByRolesName(RoleType.ROLE_ADMIN);
            if (totalAdmins <= 1) {
                throw new AppException(ErrorCode.LAST_ADMIN_CANNOT_BE_MODIFIED);
            }
        }

        // Xóa các token liên quan trước để đảm bảo toàn vẹn dữ liệu
        refreshTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_ROLE, "Danh sách vai trò không được để trống");
        }

        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            String normalizedName = name.trim().toUpperCase();
            if (!normalizedName.startsWith("ROLE_")) {
                normalizedName = "ROLE_" + normalizedName;
            }

            RoleType roleType;
            try {
                roleType = RoleType.valueOf(normalizedName);
            } catch (IllegalArgumentException ex) {
                throw new AppException(ErrorCode.INVALID_ROLE, "Vai trò không hợp lệ: " + name);
            }

            Role role = roleRepository.findByName(roleType)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Không tìm thấy vai trò: " + name));
            roles.add(role);
        }
        return roles;
    }

    private Sort parseSort(String sort) {
        if (!StringUtils.hasText(sort)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
