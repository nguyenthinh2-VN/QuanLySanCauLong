package com.badminton.security;

import com.badminton.security.userdetails.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<CustomUserDetails> getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return Optional.of(userDetails);
        }
        return Optional.empty();
    }

    public static Optional<Long> getCurrentUserId() {
        return getCurrentUserDetails().map(CustomUserDetails::getId);
    }

    public static Optional<String> getCurrentUserEmail() {
        return getCurrentUserDetails().map(CustomUserDetails::getEmail);
    }
}
