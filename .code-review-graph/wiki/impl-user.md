# impl-user

## Overview

Directory-based community: src/main/java/com/badminton/modules/auth

- **Size**: 101 nodes
- **Cohesion**: 0.3446
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| AdminUserController | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 31-109 |
| getUsers | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 41-53 |
| getUserById | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 55-61 |
| createUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 63-70 |
| updateUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 72-80 |
| updateUserRoles | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 82-90 |
| updateUserStatus | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 92-100 |
| deleteUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java | 102-108 |
| AuthController | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 25-83 |
| register | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 33-39 |
| login | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 41-46 |
| refreshToken | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 48-53 |
| logout | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 55-60 |
| forgotPassword | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 62-68 |
| resetPassword | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 70-75 |
| getCurrentUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java | 77-82 |
| CreateUserRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\CreateUserRequest.java | 16-41 |
| ForgotPasswordRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\ForgotPasswordRequest.java | 11-21 |
| LoginRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\LoginRequest.java | 11-24 |
| RefreshTokenRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\RefreshTokenRequest.java | 10-19 |
| RegisterRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\RegisterRequest.java | 13-35 |
| ResetPasswordRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\ResetPasswordRequest.java | 11-24 |
| UpdateUserRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserRequest.java | 12-26 |
| UpdateUserRolesRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserRolesRequest.java | 12-21 |
| UpdateUserStatusRequest | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserStatusRequest.java | 10-19 |
| AuthResponse | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\response\AuthResponse.java | 9-26 |
| UserResponse | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\response\UserResponse.java | 12-26 |
| PasswordResetToken | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\PasswordResetToken.java | 18-48 |
| isExpired | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\PasswordResetToken.java | 41-43 |
| isValid | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\PasswordResetToken.java | 45-47 |
| RefreshToken | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\RefreshToken.java | 18-48 |
| isExpired | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\RefreshToken.java | 41-43 |
| isValid | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\RefreshToken.java | 45-47 |
| Role | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\Role.java | 18-37 |
| User | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\User.java | 20-62 |
| addRole | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\User.java | 54-61 |
| MapperConfig | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\MapperConfig.java | 8-16 |
| userMapper | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\MapperConfig.java | 11-15 |
| UserMapper | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\UserMapper.java | 19-59 |
| toUserResponse | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\UserMapper.java | 22-23 |
| toUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\UserMapper.java | 33-39 |
| updateUserFromRequest | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\UserMapper.java | 41-48 |
| mapRolesToStrings | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\UserMapper.java | 50-58 |
| UserMapperFallbackImpl | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\fallback\UserMapperFallbackImpl.java | 11-65 |
| toUserResponse | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\fallback\UserMapperFallbackImpl.java | 13-29 |
| toUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\fallback\UserMapperFallbackImpl.java | 44-55 |
| updateUserFromRequest | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\mapper\fallback\UserMapperFallbackImpl.java | 57-64 |
| PasswordResetTokenRepository | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\PasswordResetTokenRepository.java | 13-21 |
| findByTokenAndUsedFalse | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\PasswordResetTokenRepository.java | 16-16 |
| deleteByUser | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\PasswordResetTokenRepository.java | 18-20 |

*... and 51 more members.*

## Execution Flows

- **createUser** (criticality: 0.93, depth: 3)
- **updateUserRoles** (criticality: 0.93, depth: 3)
- **updateUserStatus** (criticality: 0.92, depth: 2)
- **deleteUser** (criticality: 0.92, depth: 2)
- **register** (criticality: 0.92, depth: 2)
- **refreshToken** (criticality: 0.92, depth: 2)
- **updateUser** (criticality: 0.84, depth: 2)
- **login** (criticality: 0.84, depth: 2)
- **forgotPassword** (criticality: 0.84, depth: 2)
- **resetPassword** (criticality: 0.84, depth: 2)
- *... and 8 more flows.*

## Dependencies

### Outgoing

- `success` (14 edge(s))
- `ok` (12 edge(s))
- `getEmail` (12 edge(s))
- `builder` (9 edge(s))
- `getName` (7 edge(s))
- `getPhone` (7 edge(s))
- `getRoles` (7 edge(s))
- `getFullName` (5 edge(s))
- `get` (5 edge(s))
- `now` (4 edge(s))
- `UserRepository.save` (4 edge(s))
- `add` (4 edge(s))
- `BaseEntity` (3 edge(s))
- `stream` (3 edge(s))
- `UserMapper` (3 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java::DataSeeder.seedUsers` (6 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AdminUserController.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\AuthController.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\CreateUserRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\ForgotPasswordRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\LoginRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\RefreshTokenRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\RegisterRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\ResetPasswordRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserRolesRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\request\UpdateUserStatusRequest.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\response\AuthResponse.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\dto\response\UserResponse.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\entity\PasswordResetToken.java` (1 edge(s))
