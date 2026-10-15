# Implementation Plan: Module 3 - Courts, TimeSlots & Pricing

## 1. Overview
Module 3 chịu trách nhiệm quản lý cấu trúc cơ sở hạ tầng sân bãi cầu lông và chính sách giá theo khung giờ của hệ thống **QuanLySanCauLong**.
Module bao gồm 3 resource chính:
1. **Cụm sân (`CourtComplex`)**: Đại diện cho chi nhánh/cụm sân thực tế (ví dụ: Cụm sân Cầu Giấy, Cụm sân Thanh Xuân).
2. **Sân con (`Court`)**: Các sân cầu lông cụ thể bên trong từng cụm sân (ví dụ: Sân 1, Sân 2, Sân VIP).
3. **Khung giờ & Bảng giá (`TimeSlot`)**: Bảng giá thuê sân tính theo giờ theo các khung giờ trong ngày (toàn hệ thống áp dụng chung).

Hệ thống cung cấp 13 REST API endpoints theo đúng ma trận phân quyền RBAC (Khách vãng lai và người dùng có thể xem công khai; chỉ Admin có quyền thêm/sửa/xóa).

---

## 2. Architecture & Design Decisions

### 2.1. Phân tách Resource Cụm sân (`/api/v1/complexes`) và Sân con (`/api/v1/courts`)
- **Vấn đề:** Trong ma trận RBAC ban đầu, CRUD cụm sân bị gộp chung vào đường dẫn `/api/v1/courts/**`. Tuy nhiên `CourtComplex` và `Court` có quan hệ cha - con (1 cụm có nhiều sân con). Đặt CRUD cụm sân dưới `/courts` là phản trực giác và phá vỡ nguyên tắc Resource-oriented của REST.
- **Quyết định:** Tách thành 2 controller/resource độc lập:
  - `/api/v1/complexes` quản lý Cụm sân.
  - `/api/v1/courts` quản lý Sân con.
  - Cập nhật ma trận RBAC (`docs/architecture/rbac-matrix.md`) và tài liệu kiến trúc để phản ánh chuẩn xác thiết kế này.

### 2.2. Quan hệ và Unique Constraints
- **Cụm sân (`CourtComplex`):** `name` là UNIQUE trên toàn hệ thống (`@Column(unique = true, nullable = false, length = 150)`).
- **Sân con (`Court`):** Tên sân (ví dụ: "Sân 1") được phép trùng nhau giữa các cụm sân khác nhau, nhưng **tuyệt đối không được trùng nhau trong cùng một cụm sân**.
  - Áp dụng Unique Constraint tổ hợp ở tầng Database:
    `@Table(name = "courts", uniqueConstraints = @UniqueConstraint(name = "uk_court_complex_name", columnNames = {"complex_id", "name"}))`
  - Kèm guard kiểm tra chủ động ở tầng Service: `existsByComplexIdAndName(complexId, name)` ném `AppException(ErrorCode.DUPLICATE_COURT_NAME)` (HTTP 409).

### 2.3. Khung giờ & Bảng giá (`TimeSlot`) - Global Pricing Policy
- `TimeSlot` không lưu FK tới `CourtComplex` hay `Court`, áp dụng thống nhất cho toàn bộ hệ thống (dễ quản lý, phù hợp nghiệp vụ sân cầu lông thông dụng).
- **Thuật toán kiểm tra trùng/đè khung giờ (Overlapping Guard):**
  Hai khoảng thời gian `[A_start, A_end)` và `[B_start, B_end)` overlap khi và chỉ khi:
  `A_start < B_end AND A_end > B_start`.
  - Thực thi kiểm tra trực tiếp qua Database query để đảm bảo hiệu năng và tính nhất quán cao.
  - Trùng lặp -> ném `AppException(ErrorCode.OVERLAPPING_TIME_SLOT)` (HTTP 409).
  - Validation: `startTime < endTime` (sai -> 400 `INVALID_TIME_RANGE`), `pricePerHour >= 0` (sai -> 400 `BAD_REQUEST`).
- **Không hỗ trợ Hard Delete Khung giờ:** Tránh làm hỏng lịch sử đơn đặt sân (Module 4 sau này). Muốn ngừng áp dụng, Admin cập nhật giá về 0 hoặc đổi tên khung giờ.

### 2.4. Phân Quyền & Bảo Mật (Security & RBAC)
- **Method-level Security:** Sử dụng SpEL trích xuất từ hằng số:
  `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`
  cho toàn bộ thao tác ghi (POST, PUT, DELETE). Cấm hard-code chuỗi `"ADMIN"`.
- **Public Endpoints (permitAll):**
  Cấu hình tại `SecurityConfig.java`:
  - `HttpMethod.GET, "/api/v1/complexes/**"`
  - `HttpMethod.GET, "/api/v1/courts/**"`
  - `HttpMethod.GET, "/api/v1/time-slots/**"`
  cho phép khách vãng lai (không cần token) xem danh sách và chi tiết sân bãi, giá cả.

### 2.5. Sort Whitelist Validation (Chống lỗi 500 khi Client gửi sort bừa)
- Mọi endpoint GET có phân trang sẽ validate field sắp xếp dựa trên whitelist của từng entity (`ComplexSortFields`, `CourtSortFields`).
- Nếu field không nằm trong whitelist -> ném `AppException(ErrorCode.INVALID_SORT_FIELD, "Trường sắp xếp không hợp lệ: " + field)` trả về HTTP 400 thay vì để Hibernate văng lỗi 500.

---

## 3. Danh Mục 13 REST API Endpoints

| # | HTTP Method | Endpoint URI | Quyền hạn | Mô tả |
|---|---|---|---|---|
| **A** | **CỤM SÂN (CourtComplex)** | | | |
| 1 | `GET` | `/api/v1/complexes` | Public | Danh sách cụm sân (phân trang, search `q`, filter `status`) |
| 2 | `GET` | `/api/v1/complexes/{id}` | Public | Chi tiết 1 cụm sân kèm danh sách sân con tóm tắt |
| 3 | `POST` | `/api/v1/complexes` | `ROLE_ADMIN` | Tạo mới cụm sân (201 Created) |
| 4 | `PUT` | `/api/v1/complexes/{id}` | `ROLE_ADMIN` | Cập nhật thông tin cụm sân |
| 5 | `DELETE` | `/api/v1/complexes/{id}` | `ROLE_ADMIN` | Xóa cụm sân (Guard: còn sân con -> 400) |
| **B** | **SÂN CON (Court)** | | | |
| 6 | `GET` | `/api/v1/courts` | Public | Danh sách sân con (phân trang, filter `complexId`, `status`, `q`) |
| 7 | `GET` | `/api/v1/courts/{id}` | Public | Chi tiết 1 sân con |
| 8 | `POST` | `/api/v1/courts` | `ROLE_ADMIN` | Tạo sân con trong cụm (Guard: trùng tên cùng cụm -> 409) |
| 9 | `PUT` | `/api/v1/courts/{id}` | `ROLE_ADMIN` | Cập nhật thông tin sân con |
| 10 | `DELETE` | `/api/v1/courts/{id}` | `ROLE_ADMIN` | Xóa sân con |
| **C** | **KHUNG GIỜ & BẢNG GIÁ (TimeSlot)** | | | |
| 11 | `GET` | `/api/v1/time-slots` | Public | Danh sách khung giờ & giá (sắp xếp theo `startTime` tăng dần) |
| 12 | `POST` | `/api/v1/time-slots` | `ROLE_ADMIN` | Tạo khung giờ (Guard: start < end, không overlap, price >= 0) |
| 13 | `PUT` | `/api/v1/time-slots/{id}` | `ROLE_ADMIN` | Cập nhật khung giờ (áp dụng cùng các guards) |

---

## 4. Cấu Trúc File & Package Tổ Chức

```
src/main/java/com/badminton/modules/court/
├── CourtComplexController.java            # REST API cho Cụm sân (/api/v1/complexes)
├── CourtController.java                   # REST API cho Sân con (/api/v1/courts)
├── TimeSlotController.java                # REST API cho Khung giờ (/api/v1/time-slots)
├── entity/
│   ├── CourtComplex.java                  # Entity cụm sân
│   ├── Court.java                         # Entity sân con
│   ├── TimeSlot.java                      # Entity khung giờ & bảng giá
│   ├── ComplexStatus.java                 # Enum: ACTIVE, INACTIVE
│   └── CourtStatus.java                   # Enum: AVAILABLE, MAINTENANCE
├── repository/
│   ├── CourtComplexRepository.java        # Repository + JpaSpecificationExecutor
│   ├── CourtRepository.java               # Repository + JpaSpecificationExecutor
│   └── TimeSlotRepository.java            # Repository kiểm tra overlap khung giờ
├── dto/
│   ├── request/
│   │   ├── CreateComplexRequest.java
│   │   ├── UpdateComplexRequest.java
│   │   ├── CreateCourtRequest.java
│   │   ├── UpdateCourtRequest.java
│   │   ├── CreateTimeSlotRequest.java
│   │   └── UpdateTimeSlotRequest.java
│   └── response/
│       ├── ComplexResponse.java
│       ├── ComplexDetailResponse.java
│       ├── CourtSummaryResponse.java
│       ├── CourtResponse.java
│       └── TimeSlotResponse.java
├── mapper/
│   ├── CourtComplexMapper.java
│   ├── CourtMapper.java
│   └── TimeSlotMapper.java
└── service/
    ├── CourtComplexService.java
    ├── CourtService.java
    ├── TimeSlotService.java
    └── impl/
        ├── CourtComplexServiceImpl.java
        ├── CourtServiceImpl.java
        └── TimeSlotServiceImpl.java
```

---

## 5. Các Bước Triển Khai (Phases)

- **Phase 1: Foundation & Shared Updates**
  - Mở rộng `ErrorCode` với các mã lỗi mới của Module 3 (`COMPLEX_NOT_FOUND`, `COURT_NOT_FOUND`, `TIMESLOT_NOT_FOUND`, `COMPLEX_HAS_COURTS`, `DUPLICATE_COURT_NAME`, `DUPLICATE_COMPLEX_NAME`, `INVALID_TIME_RANGE`, `OVERLAPPING_TIME_SLOT`, `INVALID_SORT_FIELD`).
  - Cập nhật `SecurityConfig` mở quyền truy cập `permitAll` cho các endpoint `GET /api/v1/complexes/**`, `GET /api/v1/courts/**`, `GET /api/v1/time-slots/**`.
  - Tạo Helper tiện ích kiểm tra Whitelist Sort field.

- **Phase 2: CourtComplex Subsystem**
  - Tạo Entity `CourtComplex`, Enum `ComplexStatus`.
  - Tạo Repository `CourtComplexRepository` hỗ trợ Specification.
  - Tạo DTOs (`CreateComplexRequest`, `UpdateComplexRequest`, `ComplexResponse`, `ComplexDetailResponse`).
  - Tạo MapStruct Mapper `CourtComplexMapper`.
  - Viết Service `CourtComplexService` & `CourtComplexServiceImpl` (kèm guard chống xóa khi còn sân con).
  - Viết `CourtComplexController` với đầy đủ Swagger OpenAPI & Security annotations.

- **Phase 3: Court Subsystem**
  - Tạo Entity `Court`, Enum `CourtStatus` (với unique constraint `uk_court_complex_name`).
  - Tạo Repository `CourtRepository` hỗ trợ đếm số sân theo cụm và kiểm tra trùng tên trong cùng cụm.
  - Tạo DTOs (`CreateCourtRequest`, `UpdateCourtRequest`, `CourtResponse`, `CourtSummaryResponse`).
  - Tạo MapStruct Mapper `CourtMapper`.
  - Viết Service `CourtService` & `CourtServiceImpl` (kèm guard check cụm tồn tại, trùng tên sân trong cụm).
  - Viết `CourtController` với đầy đủ Swagger OpenAPI & Security annotations.

- **Phase 4: TimeSlot Subsystem**
  - Tạo Entity `TimeSlot`.
  - Tạo Repository `TimeSlotRepository` với query check overlap intervals.
  - Tạo DTOs (`CreateTimeSlotRequest`, `UpdateTimeSlotRequest`, `TimeSlotResponse`).
  - Tạo MapStruct Mapper `TimeSlotMapper`.
  - Viết Service `TimeSlotService` & `TimeSlotServiceImpl` (kèm các guards: start < end, overlap check, price >= 0).
  - Viết `TimeSlotController` với đầy đủ Swagger OpenAPI & Security annotations.

- **Phase 5: Seeder & Verification**
  - Cập nhật `DataSeeder` để seed dữ liệu mẫu: 2 Cụm sân, mỗi cụm 3-4 sân con, 4 khung giờ chuẩn trong ngày (Sáng sớm, Sáng, Chiều, Tối).
  - Viết Unit Tests kiểm thử các guards quan trọng: Overlap TimeSlot, Duplicate Court Name cùng cụm, Delete Complex có sân con.
  - Biên dịch toàn bộ dự án (`mvnw clean compile`) và chạy tests (`mvnw test`).

- **Phase 6: Đồng Bộ Tài Liệu Dự Án**
  - Tạo `docs/api/module-3-courts.md` (đủ mẫu request/response 13 endpoints và các case lỗi 400, 401, 403, 404, 409).
  - Tạo `docs/architecture/modules/module-3-courts.md` (mô tả kiến trúc + bảng phân tích SOLID).
  - Cập nhật `docs/architecture/architecture-and-rbac.md` (sửa 2 dòng trạng thái Module 2 & Module 3).
  - Cập nhật `docs/architecture/rbac-matrix.md` (khớp thiết kế tách Cụm sân và Sân con).

- **Phase 7: Kế Hoạch & Báo Cáo Kiểm Thử Toàn Diện**
  - Xem chi tiết tại [tasks/test-plan.md](file:///e:/QuanLySanCauLong/tasks/test-plan.md): Báo cáo 48/48 tests PASS 100%, ma trận test cases, phân tích guards nghiệp vụ và kết quả audit qua `open-code-review-delegate`.

