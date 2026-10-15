# CHI TIẾT MODULE 3: COURTS, TIMESLOTS & PRICING

> **Dành cho:** AI Coding Agents và Backend Developers  
> **Phạm vi:** Quản lý cấu trúc cơ sở hạ tầng sân bãi (Cụm sân & Sân con) và Bảng giá theo khung giờ (TimeSlots) toàn hệ thống, tuân thủ ma trận phân quyền RBAC và 5 nguyên tắc thiết kế SOLID.

---

## 1. Bài Toán Nghiệp Vụ Giải Quyết (Problems Solved)

1. **Phân tách Resource RESTful cha - con sạch sẽ (`/complexes` & `/courts`):**
   - Ma trận RBAC ban đầu gộp chung cụm sân và sân con vào `/api/v1/courts/**`. Trong thực tế, Cụm sân (`CourtComplex`) và Sân con (`Court`) có mối quan hệ cha - con (1 Cụm chứa nhiều Sân con). Đặt CRUD cụm sân dưới `/courts` là phản trực giác và vi phạm nguyên tắc Resource-oriented của REST.
   - Module 3 tách độc lập thành 2 Controller: `/api/v1/complexes` và `/api/v1/courts`, giúp API trực quan, dễ mở rộng và dễ bảo trì.

2. **Ràng buộc toàn vẹn dữ liệu (Integrity & Composite Unique Constraints):**
   - **Cụm sân:** Tên cụm sân là duy nhất trên toàn hệ thống (`unique = true`).
   - **Sân con:** Các cụm sân khác nhau được phép có cùng tên sân (ví dụ Cụm Cầu Giấy và Cụm Thanh Xuân đều có "Sân 1"). Tuy nhiên, **trong cùng một cụm sân, tên sân con tuyệt đối không được trùng lặp**. Ràng buộc được bảo vệ 2 lớp: Unique Constraint tổ hợp `(complex_id, name)` ở tầng Database kết hợp Guard `existsByComplexIdAndName` ở tầng Service trả về HTTP 409 (`DUPLICATE_COURT_NAME`).

3. **Guard an toàn khi xóa Cụm sân (`COMPLEX_HAS_COURTS`):**
   - Không cho phép Admin xóa một cụm sân nếu bên trong vẫn còn sân con trực thuộc (`countByComplexId > 0`). Trả về HTTP 400 và giữ nguyên dữ liệu nhằm ngăn chặn rủi ro xóa nhầm toàn bộ sân bãi.

4. **Bảng giá khung giờ thống nhất & Thuật toán chống đè khung giờ (Non-overlapping Intervals):**
   - Khung giờ áp dụng chung cho toàn hệ thống, tạo sự đơn giản và minh bạch cho khách hàng.
   - Kiểm tra chặt chẽ `startTime < endTime` (sai -> 400 `INVALID_TIME_RANGE`).
   - Kiểm tra chống đè/trùng khoảng thời gian trực tiếp bằng Database query:
     `startTime < existingEndTime AND endTime > existingStartTime`
     Nếu phát hiện giao thoa thời gian -> trả về HTTP 409 (`OVERLAPPING_TIME_SLOT`).
   - Không hỗ trợ hard delete khung giờ để bảo vệ toàn vẹn lịch sử đơn đặt sân (Module 4 sau này).

5. **Phân quyền chuẩn mực & Whitelist Sort Validation:**
   - Các API xem danh sách và chi tiết là Public (`permitAll`), cho phép khách vãng lai tra cứu thông tin và bảng giá mà không cần đăng nhập.
   - Các thao tác thay đổi dữ liệu (POST, PUT, DELETE) bắt buộc `ROLE_ADMIN` qua SpEL `@PreAuthorize("hasRole(T(com.badminton.shared.constant.RoleConstants).ADMIN)")`.
   - Tất cả tham số `sort` được kiểm tra qua `SortUtils` với whitelist hợp lệ của từng entity; tham số lạ lập tức ném lỗi 400 (`INVALID_SORT_FIELD`) thay vì văng exception 500.

---

## 2. Cấu Trúc Các Thành Phần Code (Code Inventory)

Toàn bộ Module 3 được tổ chức độc lập trong package `com.badminton.modules.court`:

```
com.badminton.modules.court
├── CourtComplexController.java            # REST Controller Cụm sân (/api/v1/complexes)
├── CourtController.java                   # REST Controller Sân con (/api/v1/courts)
├── TimeSlotController.java                # REST Controller Khung giờ & Bảng giá (/api/v1/time-slots)
├── entity/
│   ├── ComplexStatus.java                 # Enum: ACTIVE, INACTIVE
│   ├── CourtComplex.java                  # Entity cụm sân (tên unique, quan hệ 1-N với Court)
│   ├── CourtStatus.java                   # Enum: AVAILABLE, MAINTENANCE
│   ├── Court.java                         # Entity sân con (composite unique constraint complex_id, name)
│   └── TimeSlot.java                      # Entity khung giờ & giá thuê/giờ (LocalTime, BigDecimal)
├── repository/
│   ├── CourtComplexRepository.java        # JPA Repository + JpaSpecificationExecutor
│   ├── CourtRepository.java               # JPA Repository + kiểm tra trùng tên theo cụm
│   └── TimeSlotRepository.java            # JPA Repository + truy vấn kiểm tra đè khung giờ
├── dto/
│   ├── request/
│   │   ├── CreateComplexRequest.java      # Validate tên, địa chỉ, định dạng SĐT Việt Nam
│   │   ├── UpdateComplexRequest.java      # Validate cập nhật cụm sân
│   │   ├── CreateCourtRequest.java        # Validate complexId, tên sân con
│   │   ├── UpdateCourtRequest.java        # Validate tên sân và trạng thái bảo trì
│   │   ├── CreateTimeSlotRequest.java     # Validate tên, startTime, endTime, pricePerHour
│   │   └── UpdateTimeSlotRequest.java     # Validate cập nhật khung giờ
│   └── response/
│       ├── ComplexResponse.java           # DTO trả về danh sách cụm sân (kèm totalCourts)
│       ├── ComplexDetailResponse.java     # DTO chi tiết cụm sân (kèm List<CourtSummaryResponse>)
│       ├── CourtSummaryResponse.java      # Tóm tắt id, name, status của sân con
│       ├── CourtResponse.java             # DTO sân con (kèm complexId, complexName)
│       └── TimeSlotResponse.java          # DTO khung giờ & mức giá
├── mapper/
│   ├── CourtComplexMapper.java            # MapStruct chuyển đổi Entity <-> DTO Cụm sân
│   ├── CourtMapper.java                   # MapStruct chuyển đổi Entity <-> DTO Sân con
│   └── TimeSlotMapper.java                # MapStruct chuyển đổi Entity <-> DTO Khung giờ
└── service/
    ├── CourtComplexService.java           # Interface nghiệp vụ Cụm sân
    ├── CourtService.java                  # Interface nghiệp vụ Sân con
    ├── TimeSlotService.java               # Interface nghiệp vụ Khung giờ & Bảng giá
    └── impl/
        ├── CourtComplexServiceImpl.java   # Triển khai nghiệp vụ Cụm sân (Guard xóa cụm)
        ├── CourtServiceImpl.java          # Triển khai nghiệp vụ Sân con (Guard trùng tên theo cụm)
        └── TimeSlotServiceImpl.java       # Triển khai nghiệp vụ Khung giờ (Guard khoảng giờ & overlap)
```

---

## 3. Phân Tích Áp Dụng SOLID Trong Module 3

| Nguyên tắc | Vị trí và Cơ chế áp dụng cụ thể trong Module 3 |
|---|---|
| **S - Single Responsibility** | Mỗi Controller phụ trách đúng 1 resource duy nhất (`CourtComplexController`, `CourtController`, `TimeSlotController`). Mỗi Service triển khai nghiệp vụ riêng biệt. `SortUtils` chỉ tập trung xử lý bóc tách và whitelist hóa tham số sắp xếp. |
| **O - Open-Closed** | Danh sách tìm kiếm và lọc sử dụng `Specification<CourtComplex>` và `Specification<Court>`. Khi cần bổ sung tiêu chí tìm kiếm mới (ví dụ: lọc theo quận huyện, sân có thảm chuẩn thi đấu), chỉ cần thêm Predicate mà không cần sửa đổi Repository hay cấu trúc SQL cốt lõi. |
| **L - Liskov Substitution** | Cấu hình MapStruct `@Mapper(builder = @Builder(disableBuilder = true))` đảm bảo các mapper thao tác trơn tru trên mọi Entity kế thừa từ `BaseEntity` (`id`, `createdAt`, `updatedAt`) mà không phá vỡ tính đa hình của class cha. |
| **I - Interface Segregation** | Phân tách DTO triệt để theo từng thao tác: Request tạo cụm (`CreateComplexRequest`) tách biệt với Request cập nhật (`UpdateComplexRequest`); Response tóm tắt trong chi tiết (`CourtSummaryResponse`) tách rời với Response đầy đủ (`CourtResponse`), tránh over-fetching dữ liệu mạng. |
| **D - Dependency Inversion** | Các Controller hoàn toàn phụ thuộc vào Interface (`CourtComplexService`, `CourtService`, `TimeSlotService`), không bao giờ phụ thuộc trực tiếp vào các class `*ServiceImpl`. 100% injection thực hiện qua Constructor (`@RequiredArgsConstructor`), nghiêm cấm field injection bằng `@Autowired`. |
