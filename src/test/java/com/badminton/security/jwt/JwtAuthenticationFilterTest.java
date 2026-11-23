package com.badminton.security.jwt;

import com.badminton.modules.auth.entity.User;
import com.badminton.security.userdetails.CustomUserDetails;
import com.badminton.security.userdetails.CustomUserDetailsService;
import com.badminton.shared.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Chặn và trả về HTTP 403 USER_LOCKED khi tài khoản người dùng bị khóa/vô hiệu hóa")
    void doFilterInternal_WhenUserIsLocked_Returns403AndStopsFilter() throws ServletException, IOException {
        String token = "valid-token-for-locked-user";
        String username = "locked@badminton.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);

        User lockedUser = User.builder()
                .email(username)
                .active(false)
                .roles(Set.of())
                .build();
        CustomUserDetails userDetails = new CustomUserDetails(lockedUser);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        printWriter.flush();
        String json = stringWriter.toString();
        assertThat(json).contains(ErrorCode.USER_LOCKED.getCode());
        assertThat(json).contains(ErrorCode.USER_LOCKED.getMessage());

        verify(filterChain, never()).doFilter(any(), any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Cho phép và thiết lập Authentication khi tài khoản người dùng hoạt động bình thường")
    void doFilterInternal_WhenUserIsActive_SetsAuthenticationAndProceeds() throws ServletException, IOException {
        String token = "valid-token-for-active-user";
        String username = "active@badminton.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);

        User activeUser = User.builder()
                .email(username)
                .active(true)
                .roles(Set.of())
                .build();
        CustomUserDetails userDetails = new CustomUserDetails(activeUser);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(username);
    }
}
