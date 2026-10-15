# exception-exception

## Overview

Directory-based community: src/main/java/com/badminton/shared/exception

- **Size**: 15 nodes
- **Cohesion**: 0.2766
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| AppException | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\AppException.java | 5-19 |
| AppException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\AppException.java | 15-18 |
| BadRequestException | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\BadRequestException.java | 3-12 |
| BadRequestException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\BadRequestException.java | 9-11 |
| ErrorCode | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ErrorCode.java | 6-54 |
| ErrorCode | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ErrorCode.java | 49-53 |
| GlobalExceptionHandler | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 19-83 |
| handleAppException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 23-30 |
| handleValidationException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 32-45 |
| handleBadCredentials | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 47-54 |
| handleAccountLocked | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 56-63 |
| handleAccessDenied | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 65-72 |
| handleUncaughtException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java | 74-82 |
| ResourceNotFoundException | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ResourceNotFoundException.java | 3-12 |
| ResourceNotFoundException | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ResourceNotFoundException.java | 9-11 |

## Execution Flows

No execution flows pass through this community.

## Dependencies

### Outgoing

- `error` (7 edge(s))
- `status` (6 edge(s))
- `getMessage` (3 edge(s))
- `AppException` (2 edge(s))
- `getCode` (2 edge(s))
- `RuntimeException` (1 edge(s))
- `getErrorCode` (1 edge(s))
- `warn` (1 edge(s))
- `getHttpStatus` (1 edge(s))
- `getBindingResult` (1 edge(s))
- `put` (1 edge(s))
- `getField` (1 edge(s))
- `getDefaultMessage` (1 edge(s))
- `format` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\AppException.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\BadRequestException.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ErrorCode.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\GlobalExceptionHandler.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\shared\exception\ResourceNotFoundException.java` (1 edge(s))
