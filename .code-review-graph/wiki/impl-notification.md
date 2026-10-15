# impl-notification

## Overview

Directory-based community: src/main/java/com/badminton/notification/impl

- **Size**: 8 nodes
- **Cohesion**: 0.1429
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| ConsoleEmailNotificationSender | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleEmailNotificationSender.java | 9-31 |
| supports | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleEmailNotificationSender.java | 13-16 |
| send | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleEmailNotificationSender.java | 18-30 |
| ConsoleSmsNotificationSender | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleSmsNotificationSender.java | 9-27 |
| supports | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleSmsNotificationSender.java | 13-16 |
| send | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleSmsNotificationSender.java | 18-26 |
| NotificationServiceImpl | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\NotificationServiceImpl.java | 12-38 |
| send | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\NotificationServiceImpl.java | 19-37 |

## Execution Flows

- **register** (criticality: 0.92, depth: 2)
- **forgotPassword** (criticality: 0.84, depth: 2)

## Dependencies

### Outgoing

- `info` (14 edge(s))
- `getChannel` (3 edge(s))
- `NotificationSender` (2 edge(s))
- `getRecipient` (2 edge(s))
- `getContent` (2 edge(s))
- `getParams` (2 edge(s))
- `warn` (2 edge(s))
- `getSubject` (1 edge(s))
- `NotificationService` (1 edge(s))
- `List` (1 edge(s))
- `supports` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleEmailNotificationSender.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\ConsoleSmsNotificationSender.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\notification\impl\NotificationServiceImpl.java` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\service\impl\AuthServiceImpl.java::AuthServiceImpl.register` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\service\impl\AuthServiceImpl.java::AuthServiceImpl.forgotPassword` (1 edge(s))
