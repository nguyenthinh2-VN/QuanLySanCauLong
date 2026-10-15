# config-seed

## Overview

Directory-based community: src/main/java/com/badminton/config

- **Size**: 4 nodes
- **Cohesion**: 0.1389
- **Dominant Language**: java

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| DataSeeder | Class | E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java | 17-107 |
| run | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java | 26-31 |
| seedRoles | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java | 33-50 |
| seedUsers | Function | E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java | 52-106 |

## Execution Flows

- **run** (criticality: 0.77, depth: 2)

## Dependencies

### Outgoing

- `builder` (4 edge(s))
- `info` (4 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\UserRepository.java::UserRepository.existsByEmail` (3 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\RoleRepository.java::RoleRepository.findByName` (3 edge(s))
- `PasswordEncoder.encode` (3 edge(s))
- `of` (3 edge(s))
- `UserRepository.save` (3 edge(s))
- `CommandLineRunner` (1 edge(s))
- `RoleRepository` (1 edge(s))
- `UserRepository` (1 edge(s))
- `PasswordEncoder` (1 edge(s))
- `values` (1 edge(s))
- `E:\QuanLySanCauLong\src\main\java\com\badminton\modules\auth\repository\RoleRepository.java::RoleRepository.existsByName` (1 edge(s))
- `RoleRepository.save` (1 edge(s))

### Incoming

- `E:\QuanLySanCauLong\src\main\java\com\badminton\config\DataSeeder.java` (1 edge(s))
