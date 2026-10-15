# Kế Hoạch Kiểm Thử & Báo Cáo Kết Quả Test (Test Plan & Report)
**Dự án:** Quản Lý Sân Cầu Lông (QuanLySanCauLong)  
**Phạm vi:** Module 1 (Auth), Module 2 (User Management), Module 3 (Courts, TimeSlots & Pricing)  
**Ngày cập nhật:** 15/10/2026  
**Trạng thái tổng thể:** **48/48 PASS (100%)** — 0 Failures, 0 Errors, 0 Skipped  

---

## 1. Mục Tiêu & Chiến Lược Kiểm Thử (Testing Strategy)

### 1.1. Mục tiêu
- Bảo đảm 100% các **Rào chắn nghiệp vụ (Business Guards)** và điều kiện tiên quyết được kích hoạt chính xác, không để lọt dữ liệu bẩn vào CSDL.
- Xác nhận các mã lỗi [`ErrorCode`](file:///e:/QuanLySanCauLong/src/main/java/com/badminton/shared/exception/ErrorCode.java) và mã trạng thái HTTP (400, 401, 403, 404, 409) trả về đúng chuẩn thiết kế RESTful.
- Đảm bảo cơ chế phân quyền RBAC và Method-level Security hoạt động nhất quán, bảo vệ toàn bộ thao tác thay đổi dữ liệu của Admin.
- Ngăn chặn lỗi máy chủ nội bộ (HTTP 500) do client truyền các tham số lạ (Sort Whitelist validation).

### 1.2. Công nghệ & Công cụ
- **Test Framework:** JUnit 5 (Jupiter), AssertJ Fluent Assertions (`assertThat`, `assertThatThrownBy`).
- **Mocking Framework:** Mockito 5 (`@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`, `verify`).
- **Phương pháp tiếp cận:** Unit Test cách ly (Isolated Unit Tests). Không khởi động Spring Context nặng nề để đạt tốc độ thực thi tối đa (< 2 giây cho toàn bộ test suite).
- **Kiểm tra chất lượng mã nguồn:** Open Code Review CLI (`ocr` v1.12.13 Delegation Mode).

---

## 2. Tổng Hợp Kết Quả Thực Thi (Execution Summary)

| STT | Test Suite Class | File Path | Số lượng Tests | Failures | Errors | Skipped | Thời gian chạy | Kết quả |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `AuthServiceTest` | [`AuthServiceTest.java`](file:///e:/QuanLySanCauLong/src/test/java/com/badminton/modules/auth/AuthServiceTest.java) | 7 | 0 | 0 | 0 | 0.82 s | **PASS** |
| 2 | `UserServiceTest` | [`UserServiceTest.java`](file:///e:/QuanLySanCauLong/src/test/java/com/badminton/modules/auth/UserServiceTest.java) | 13 | 0 | 0 | 0 | 0.35 s | **PASS** |
| 3 | `CourtComplexServiceTest` | [`CourtComplexServiceTest.java`](file:///e:/QuanLySanCauLong/src/test/java/com/badminton/modules/court/CourtComplexServiceTest.java) | 9 | 0 | 0 | 0 | 0.28 s | **PASS** |
| 4 | `CourtServiceTest` | [`CourtServiceTest.java`](file:///e:/QuanLySanCauLong/src/test/java/com/badminton/modules/court/CourtServiceTest.java) | 10 | 0 | 0 | 0 | 0.25 s | **PASS** |
| 5 | `TimeSlotServiceTest` | [`TimeSlotServiceTest.java`](file:///e:/QuanLySanCauLong/src/test/java/com/badminton/modules/court/TimeSlotServiceTest.java) | 9 | 0 | 0 | 0 | 0.18 s | **PASS** |
| **Tổng** | **5 Test Suites** | | **48** | **0** | **0** | **0** | **~1.88 s** | **100% PASS** |

---

## 3. Báo Cáo Chi Tiết Từng Module & Test Case

### 3.1. Module 3: Cụm Sân (`CourtComplexServiceTest` — 9 Tests)

Tập trung kiểm thử các nghiệp vụ quản lý chi nhánh, tìm kiếm phân trang và rào chắn bảo vệ toàn vẹn quan hệ cha - con.

| # | Tên Test Method | Mục đích kiểm thử | Kịch bản / Input | Kỳ vọng / Expected Output | Guard nghiệp vụ bảo vệ |
|---|---|---|---|---|---|
| 1 | `getComplexes_success` | Lấy danh sách cụm sân phân trang | `q="Cầu Giấy"`, `status=ACTIVE`, `page=0`, `size=10` | Trả về `PageResponse<ComplexResponse>` với 1 item tên "Cụm Sân Cầu Giấy" | Tìm kiếm đa trường (name, address) |
| 2 | `getComplexes_invalidSort_throwsInvalidSortField` | Chặn tham số sắp xếp không thuộc whitelist | `sort="invalidField,asc"` | Ném `AppException(ErrorCode.INVALID_SORT_FIELD)` (HTTP 400) | `SortUtils` Whitelist chống lỗi 500 |
| 3 | `getComplexById_success` | Xem chi tiết cụm sân | `id=1L` hợp lệ | Trả về `ComplexDetailResponse` kèm danh sách sân con trực thuộc | Tìm nạp đúng ID |
| 4 | `getComplexById_notFound` | Xem cụm sân không tồn tại | `id=999L` | Ném `AppException(ErrorCode.COMPLEX_NOT_FOUND)` (HTTP 404) | Kiểm tra tồn tại thực thể |
| 5 | `createComplex_success` | Tạo mới cụm sân hợp lệ | Tên "Cụm Sân Mỹ Đình" chưa có trong hệ thống | Tạo thành công (201), status mặc định `ACTIVE`, gọi `repository.save()` | Đảm bảo trường bắt buộc & default |
| 6 | `createComplex_duplicateName` | Ngăn tạo cụm sân trùng tên | Tên "Cụm Sân Cầu Giấy" đã tồn tại | Ném `AppException(ErrorCode.DUPLICATE_COMPLEX_NAME)` (HTTP 409), KHÔNG gọi `save()` | Unique toàn hệ thống |
| 7 | `updateComplex_duplicateName` | Ngăn đổi tên cụm sân trùng cụm khác | Cụm id=1 đổi tên thành "Cụm Sân Trùng" (đã có cụm khác mang tên này) | Ném `AppException(ErrorCode.DUPLICATE_COMPLEX_NAME)` (HTTP 409) | `existsByNameAndIdNot` |
| 8 | `deleteComplex_hasCourts_throwsComplexHasCourts` | **Critical Guard:** Ngăn xóa cụm còn sân con | Cụm id=1 có `countByComplexId(1L) = 3` | Ném `AppException(ErrorCode.COMPLEX_HAS_COURTS)` (HTTP 400), KHÔNG gọi `delete()` | Chống xóa mồ côi (Orphan Cascade) |
| 9 | `deleteComplex_success` | Xóa cụm sân rỗng | Cụm id=1 có `countByComplexId(1L) = 0` | Xóa thành công, gọi `courtComplexRepository.delete(complex)` | Cho phép xóa an toàn |

---

### 3.2. Module 3: Sân Con Trực Thuộc (`CourtServiceTest` — 10 Tests)

Tập trung kiểm thử việc gắn sân con vào cụm sân, cơ chế Scoped Unique Name (tên sân duy nhất trong cụm nhưng được trùng giữa các cụm).

| # | Tên Test Method | Mục đích kiểm thử | Kịch bản / Input | Kỳ vọng / Expected Output | Guard nghiệp vụ bảo vệ |
|---|---|---|---|---|---|
| 1 | `getCourts_success` | Lấy danh sách sân con phân trang | `complexId=1L`, `status=AVAILABLE`, `q="Sân"` | Trả về `PageResponse<CourtResponse>` kèm tên cụm cha | Phân trang & Lọc tổ hợp |
| 2 | `getCourts_invalidSort_throwsInvalidSortField` | Chặn sắp xếp theo trường lạ của sân | `sort="tenKhongHopLe,asc"` | Ném `AppException(ErrorCode.INVALID_SORT_FIELD)` (HTTP 400) | `SortUtils` Whitelist |
| 3 | `getCourtById_success` | Xem chi tiết sân con | `id=10L` | Trả về `CourtResponse` đầy đủ thông tin | Tìm nạp đúng ID |
| 4 | `getCourtById_notFound` | Xem sân con không tồn tại | `id=999L` | Ném `AppException(ErrorCode.COURT_NOT_FOUND)` (HTTP 404) | Kiểm tra tồn tại thực thể |
| 5 | `createCourt_success` | Tạo mới sân con thành công | `complexId=1L`, `name="Sân 2"` chưa có trong cụm | Tạo thành công (201), gán quan hệ cụm cha, gọi `save()` | Toàn vẹn liên kết cha - con |
| 6 | `createCourt_complexNotFound` | Tạo sân với cụm cha không tồn tại | `complexId=999L` | Ném `AppException(ErrorCode.COMPLEX_NOT_FOUND)` (HTTP 404), KHÔNG gọi `save()` | Khóa ngoại hợp lệ |
| 7 | `createCourt_duplicateNameInSameComplex_throwsDuplicateCourtName` | Ngăn 2 sân trùng tên trong CÙNG 1 cụm | `complexId=1L`, tạo thêm sân "Sân 1" đã có | Ném `AppException(ErrorCode.DUPLICATE_COURT_NAME)` (HTTP 409), KHÔNG gọi `save()` | Scoped Unique `(complex_id, name)` |
| 8 | `createCourt_sameNameDifferentComplex_success` | Cho phép trùng tên ở 2 cụm KHÁC NHAU | Cụm 1 có "Sân 1", tạo "Sân 1" ở Cụm 2 (`complexId=2L`) | Tạo thành công (201), cả 2 cụm đều có "Sân 1" độc lập | Độc lập danh mục sân bãi giữa các chi nhánh |
| 9 | `updateCourt_duplicateNameInSameComplex_throwsDuplicateCourtName` | Ngăn sửa tên sân trùng với sân khác trong cùng cụm | Sân id=10 thuộc cụm 1 đổi tên thành "Sân Đã Có" | Ném `AppException(ErrorCode.DUPLICATE_COURT_NAME)` (HTTP 409) | `existsByComplexIdAndNameAndIdNot` |
| 10 | `deleteCourt_success` | Xóa sân con thành công | `id=10L` | Xóa thành công, gọi `courtRepository.delete(court1)` | Cho phép xóa sân |

---

### 3.3. Module 3: Khung Giờ & Bảng Giá (`TimeSlotServiceTest` — 9 Tests)

Tập trung kiểm thử thuật toán kiểm tra xung đột thời gian (Interval Overlap), logic giờ hợp lệ và giá không âm.

| # | Tên Test Method | Mục đích kiểm thử | Kịch bản / Input | Kỳ vọng / Expected Output | Guard nghiệp vụ bảo vệ |
|---|---|---|---|---|---|
| 1 | `getTimeSlots_success` | Lấy danh sách khung giờ công khai | Gọi API lấy bảng giá | Trả về danh sách sắp xếp tăng dần theo `startTime` | Sắp xếp thời gian |
| 2 | `createTimeSlot_success` | Tạo khung giờ hợp lệ | `startTime=12:00`, `endTime=18:00`, `price=100.000` | Tạo thành công (201), gọi `save()` | Khung giờ chuẩn |
| 3 | `createTimeSlot_startTimeAfterOrEqualEndTime_throwsInvalidTimeRange` | Chặn giờ bắt đầu sau giờ kết thúc | `startTime=18:00`, `endTime=12:00` | Ném `AppException(ErrorCode.INVALID_TIME_RANGE)` (HTTP 400), KHÔNG gọi `save()` | `startTime.isBefore(endTime)` |
| 4 | `createTimeSlot_startTimeEqualsEndTime_throwsInvalidTimeRange` | Chặn khoảng thời gian rỗng (bằng nhau) | `startTime=12:00`, `endTime=12:00` | Ném `AppException(ErrorCode.INVALID_TIME_RANGE)` (HTTP 400) | `startTime.isBefore(endTime)` |
| 5 | `createTimeSlot_overlappingSlot_throwsOverlappingTimeSlot` | Chặn khung giờ bị gối/chèn lên khung giờ cũ | Đã có slot 06:00–12:00, tạo slot mới 08:00–14:00 | Ném `AppException(ErrorCode.OVERLAPPING_TIME_SLOT)` (HTTP 409), KHÔNG gọi `save()` | Toán học giao khoảng `start < end2 && end > start2` |
| 6 | `createTimeSlot_negativePrice_throwsBadRequest` | Chặn giá thuê mỗi giờ âm | `pricePerHour = -1000` | Ném `AppException(ErrorCode.BAD_REQUEST)` (HTTP 400) | Rào chắn tài chính `price >= 0` |
| 7 | `updateTimeSlot_success` | Cập nhật khung giờ thành công | Đổi tên, giờ 05:30–11:30 không trùng với slot nào khác | Cập nhật thành công, gọi `save()` | Cập nhật bảng giá |
| 8 | `updateTimeSlot_overlappingSlot_throwsOverlappingTimeSlot` | Chặn cập nhật giờ gối lên slot khác | Slot id=1 đổi giờ thành 11:00–15:00 (đè lên slot chiều) | Ném `AppException(ErrorCode.OVERLAPPING_TIME_SLOT)` (HTTP 409) | `existsOverlappingSlotExcludingId` |
| 9 | `updateTimeSlot_notFound` | Cập nhật khung giờ không tồn tại | `id=999L` | Ném `AppException(ErrorCode.TIMESLOT_NOT_FOUND)` (HTTP 404) | Kiểm tra tồn tại thực thể |

---

### 3.4. Module 1 & Module 2: Nền Tảng (20 Tests)

- **`AuthServiceTest` (7 tests):**
  - Đăng ký thành công (mã hóa mật khẩu, gán role mặc định `ROLE_CUSTOMER`).
  - Đăng ký email trùng lặp -> ném `DUPLICATE_EMAIL` (409).
  - Đăng ký concurrency (bắt `DataIntegrityViolationException` khi flush) -> ném `DUPLICATE_EMAIL`.
  - Đăng nhập thành công -> trả Access Token + Refresh Token.
  - Đăng nhập sai mật khẩu -> ném `UNAUTHORIZED` (401).
  - Quên mật khẩu email tồn tại -> tạo reset token, gửi mail nội bộ.
  - Quên mật khẩu email KHÔNG tồn tại -> trả response trung tính (không rò rỉ thông tin người dùng).
- **`UserServiceTest` (13 tests):**
  - Lấy danh sách người dùng phân trang, tìm kiếm theo email/fullName/phone.
  - Xem chi tiết người dùng theo ID.
  - Admin tạo mới tài khoản Staff/Customer.
  - Chặn Admin tạo tài khoản mang role `ROLE_ADMIN` qua API này (`CANNOT_CREATE_ADMIN`).
  - Cập nhật trạng thái người dùng (LOCKED, ACTIVE).
  - **Critical Guard:** Admin không được tự khóa chính mình.
  - Cập nhật vai trò người dùng (STAFF, CUSTOMER).
  - **Critical Guard:** Admin không được tự gỡ quyền ADMIN của chính mình.
  - Xóa người dùng.
  - **Critical Guard:** Admin không được tự xóa tài khoản của chính mình.

---

## 4. Báo Cáo Kiểm Tra Độc Lập Qua Open Code Review (`ocr`)

Theo phiên review với `ocr delegate` (v1.12.13):
- **Phạm vi:** 36 tệp Java được quét toàn diện.
- **Tuân thủ quy tắc bảo mật:**
  - 100% endpoint GET công khai được bảo vệ bằng permitAll chỉ định rõ HTTP method.
  - 100% endpoint thay đổi dữ liệu được bảo vệ bằng SpEL `@PreAuthorize("hasRole(...)")` trích xuất từ hằng số `RoleConstants.ADMIN`.
- **Tuân thủ SOLID:**
  - Controllers độc lập theo SRP.
  - DTOs phân chia rõ Request/Response.
  - Mappers dùng MapStruct không sinh code boilerplate dư thừa.
- **Kết luận:** **APPROVED / READY FOR PRODUCTION**.

---

## 5. Kế Hoạch Kiểm Thử Cho Module 4 (Bookings - Đặt Sân)

Khi bước sang Module 4, các test suites sau sẽ được bổ sung vào hệ thống kiểm thử:

1. **`BookingServiceTest`:**
   - Đặt sân thành công theo khung giờ và tính tổng tiền dựa trên `TimeSlot.pricePerHour`.
   - **Concurrency / Overlap Guard:** Ngăn 2 khách hàng đặt cùng 1 sân con trong cùng 1 ngày và khung giờ (`OVERLAPPING_BOOKING` - 409).
   - **Maintenance Guard:** Chặn đặt sân con đang ở trạng thái `MAINTENANCE` (400).
   - **Inactive Complex Guard:** Chặn đặt sân con thuộc cụm đang `INACTIVE` (400).
   - **Cancellation Guard:** Hủy đặt sân hợp lệ vs Hủy đặt sân quá giờ quy định.
   - **Admin Check Guard:** Khi xóa sân con (`deleteCourt`), từ chối xóa nếu sân đang có lịch đặt sân trong tương lai (Active/Pending).
