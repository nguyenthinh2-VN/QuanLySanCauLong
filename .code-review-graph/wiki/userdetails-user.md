# userdetails-user

## Overview

Directory-based community: src/main/java/com/badminton/security/userdetails

- **Size**: 14 nodes
- **Cohesion**: 0.5862
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| CustomUserDetails | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 12-69 |
| CustomUserDetails | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 17-19 |
| getId | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 21-23 |
| getEmail | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 25-27 |
| getFullName | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 29-31 |
| getAuthorities | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 33-38 |
| getPassword | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 40-43 |
| getUsername | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 45-48 |
| isAccountNonExpired | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 50-53 |
| isAccountNonLocked | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 55-58 |
| isCredentialsNonExpired | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 60-63 |
| isEnabled | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java | 65-68 |
| CustomUserDetailsService | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetailsService.java | 12-26 |
| loadUserByUsername | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetailsService.java | 18-25 |

## Execution Flows

- **doFilterInternal** (criticality: 0.84, depth: 2)
- **getUsername** (criticality: 0.41, depth: 1)

## Dependencies

### Outgoing

- `isActive` (2 edge(s))
- `UserDetails` (1 edge(s))
- `getRoles` (1 edge(s))
- `getName` (1 edge(s))
- `toSet` (1 edge(s))
- `UserDetailsService` (1 edge(s))
- `UserRepository` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\UserRepository.java::UserRepository.findByEmail` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetails.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\userdetails\CustomUserDetailsService.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\security\jwt\JwtAuthenticationFilter.java::JwtAuthenticationFilter.doFilterInternal` (1 edge(s))
