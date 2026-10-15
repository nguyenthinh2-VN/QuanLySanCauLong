# jwt-token

## Overview

Directory-based community: src/main/java/com/badminton/security/jwt

- **Size**: 15 nodes
- **Cohesion**: 0.2254
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| CustomAccessDeniedHandler | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\CustomAccessDeniedHandler.java | 16-39 |
| handle | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\CustomAccessDeniedHandler.java | 22-38 |
| JwtAuthenticationEntryPoint | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationEntryPoint.java | 16-39 |
| commence | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationEntryPoint.java | 22-38 |
| JwtAuthenticationFilter | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationFilter.java | 21-64 |
| doFilterInternal | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationFilter.java | 29-55 |
| getJwtFromRequest | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationFilter.java | 57-63 |
| JwtTokenProvider | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 19-93 |
| JwtTokenProvider | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 26-32 |
| generateAccessToken | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 34-51 |
| getUsernameFromToken | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 53-56 |
| getUserIdFromToken | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 58-65 |
| validateToken | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 67-80 |
| getAccessTokenExpirationSeconds | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 82-84 |
| getClaims | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java | 86-92 |

## Execution Flows

- **refreshToken** (criticality: 0.92, depth: 2)
- **login** (criticality: 0.84, depth: 2)
- **doFilterInternal** (criticality: 0.84, depth: 2)
- **getUserIdFromToken** (criticality: 0.53, depth: 1)

## Dependencies

### Outgoing

- `error` (4 edge(s))
- `getMessage` (3 edge(s))
- `ObjectMapper` (2 edge(s))
- `setContentType` (2 edge(s))
- `setCharacterEncoding` (2 edge(s))
- `setStatus` (2 edge(s))
- `getWriter` (2 edge(s))
- `ObjectMapper.writeValueAsString` (2 edge(s))
- `hasText` (2 edge(s))
- `getAuthorities` (2 edge(s))
- `parser` (2 edge(s))
- `AccessDeniedHandler` (1 edge(s))
- `AuthenticationEntryPoint` (1 edge(s))
- `OncePerRequestFilter` (1 edge(s))
- `JwtTokenProvider` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\service\impl\AuthServiceImpl.java::AuthServiceImpl.login` (2 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\service\impl\AuthServiceImpl.java::AuthServiceImpl.refreshToken` (2 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\CustomAccessDeniedHandler.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationEntryPoint.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationFilter.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtTokenProvider.java` (1 edge(s))
