# auth-user

## Overview

Directory-based community: src/test/java/com/badminton/modules/auth

- **Size**: 25 nodes
- **Cohesion**: 0.0409
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| AuthServiceTest | Class | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 52-298 |
| setUp | Function | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 88-108 |
| register_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 110-150 |
| register_DuplicateEmail_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 152-167 |
| login_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 169-201 |
| refreshToken_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 203-236 |
| forgotPassword_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 238-251 |
| forgotPassword_EmailNotFound_DoesNotThrowAndDoesNotSendNotification | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 253-266 |
| register_ConcurrencyDuplicateEmail_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\AuthServiceTest.java | 268-297 |
| UserServiceTest | Class | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 50-339 |
| setUp | Function | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 80-111 |
| tearDown | Function | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 113-116 |
| getUsers_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 118-130 |
| getUserById_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 132-143 |
| getUserById_NotFound_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 145-153 |
| createUser_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 155-184 |
| createUser_CannotCreateAdmin_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 186-204 |
| updateUserRoles_AdminCannotRemoveOwnAdminRole_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 206-220 |
| updateUserRoles_CannotRemoveLastAdminRole_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 222-245 |
| updateUserStatus_AdminCannotLockSelf_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 247-259 |
| updateUserStatus_CannotLockLastActiveAdmin_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 261-281 |
| updateUserStatus_LockSuccess_RevokesTokens | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 283-299 |
| deleteUser_AdminCannotDeleteSelf_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 301-309 |
| deleteUser_CannotDeleteLastAdmin_ThrowsException | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 311-326 |
| deleteUser_Success | Test | E:\QuanLySanCauLong\src\test\java\com\badminton\modules\auth\UserServiceTest.java | 328-338 |

## Execution Flows

No execution flows pass through this community.

## Dependencies

### Outgoing

- `when` (54 edge(s))
- `builder` (36 edge(s))
- `of` (29 edge(s))
- `assertThat` (17 edge(s))
- `any` (13 edge(s))
- `assertThatThrownBy` (10 edge(s))
- `findById` (10 edge(s))
- `verify` (8 edge(s))
- `findByName` (6 edge(s))
- `setId` (6 edge(s))
- `existsByEmail` (5 edge(s))
- `anyString` (5 edge(s))
- `toUserResponse` (5 edge(s))
- `existsByPhone` (4 edge(s))
- `now` (3 edge(s))

### Incoming

- `when` (54 edge(s))
- `builder` (29 edge(s))
- `of` (26 edge(s))
- `assertThat` (17 edge(s))
- `any` (13 edge(s))
- `assertThatThrownBy` (10 edge(s))
- `findById` (10 edge(s))
- `verify` (8 edge(s))
- `findByName` (6 edge(s))
- `existsByEmail` (5 edge(s))
- `anyString` (5 edge(s))
- `toUserResponse` (5 edge(s))
- `existsByPhone` (4 edge(s))
- `setId` (4 edge(s))
- `now` (3 edge(s))
