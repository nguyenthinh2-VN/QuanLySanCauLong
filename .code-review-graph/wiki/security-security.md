# security-security

## Overview

Directory-based community: src/main/java/com/badminton/security

- **Size**: 11 nodes
- **Cohesion**: 0.3250
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| SecurityConfig | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 26-91 |
| securityFilterChain | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 36-60 |
| passwordEncoder | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 62-65 |
| authenticationManager | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 67-70 |
| corsConfigurationSource | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 72-78 |
| createCorsConfiguration | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java | 80-90 |
| SecurityUtils | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java | 9-29 |
| SecurityUtils | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java | 11-12 |
| getCurrentUserDetails | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java | 14-20 |
| getCurrentUserId | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java | 22-24 |
| getCurrentUserEmail | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java | 26-28 |

## Execution Flows

- **securityFilterChain** (criticality: 0.62, depth: 2)
- **getCurrentUserId** (criticality: 0.57, depth: 1)
- **getCurrentUserEmail** (criticality: 0.57, depth: 1)

## Dependencies

### Outgoing

- `of` (5 edge(s))
- `JwtAuthenticationFilter` (1 edge(s))
- `JwtAuthenticationEntryPoint` (1 edge(s))
- `CustomAccessDeniedHandler` (1 edge(s))
- `getAuthenticationManager` (1 edge(s))
- `registerCorsConfiguration` (1 edge(s))
- `setAllowedOriginPatterns` (1 edge(s))
- `setAllowedMethods` (1 edge(s))
- `setAllowedHeaders` (1 edge(s))
- `setExposedHeaders` (1 edge(s))
- `setAllowCredentials` (1 edge(s))
- `setMaxAge` (1 edge(s))
- `csrf` (1 edge(s))
- `configurationSource` (1 edge(s))
- `sessionCreationPolicy` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityConfig.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\SecurityUtils.java` (1 edge(s))
