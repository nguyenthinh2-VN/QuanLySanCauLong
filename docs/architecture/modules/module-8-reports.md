# THIẾT KẾ KIẾN TRÚC MODULE 8: THỐNG KÊ & BÁO CÁO (REPORTS / DASHBOARD)

> **Module:** 8 (Module cuối cùng của hệ thống)  
> **Package:** `com.badminton.modules.report`  
> **Trạng thái:** Hoàn thành & Đạt chuẩn Review  
> **Nguyên tắc cốt lõi:** Read-Only (`@Transactional(readOnly = true)`), không tạo Entity mới, mở rộng Repository có sẵn, xử lý bucketing thuần Java khả chuyển đa nền tảng.

---

## 1. Tổng Quan Kiến Trúc

Module 8 cung cấp khả năng phân tích dữ liệu kinh doanh và công suất vận hành sân cho Quản trị viên. Được thiết kế theo mô hình **Package-by-Feature**, Module 8 giao tiếp với cơ sở dữ liệu thông qua các query JPQL tổng hợp hiệu năng cao và trả về các DTO thống kê chuẩn hóa:

```
com.badminton.modules.report/
├── controller/
│   └── ReportController.java           # 2 endpoints ADMIN-only (/revenue, /occupancy)
├── service/
│   ├── ReportService.java              # Interface nghiệp vụ báo cáo
│   └── impl/
│       └── ReportServiceImpl.java      # Cài đặt gom bucket Java & tính toán tỉ lệ an toàn
├── dto/
│   ├── request/
│   │   ├── ReportGroupBy.java          # Enum: DAY, WEEK, MONTH
│   │   └── ReportRangeRequest.java     # Tham số lọc (from, to, groupBy, courtId)
│   └── response/
│       ├── RevenueReportResponse.java
│       ├── RevenueTotalsResponse.java
│       ├── PaymentMethodBreakdownResponse.java
│       ├── RevenuePeriodBucketResponse.java
│       ├── OccupancyReportResponse.java
│       ├── CourtOccupancyResponse.java
│       └── DailyOccupancyResponse.java
└── repository/
    └── projection/
        ├── DailyRevenueProjection.java
        ├── PaymentMethodRevenueProjection.java
        └── DailyCourtOccupancyProjection.java
```

---

## 2. Ba Quyết Định Thiết Kế Cốt Lõi (Architectural Decisions)

### Quyết định 1: Doanh thu Báo cáo tính theo NET (Gross − Refunded)
- **Bối cảnh:** Khi khách hàng hủy lịch theo quy định ở Module 6, hệ thống ghi nhận một bản ghi `Payment` với trạng thái `REFUNDED`.
- **Giải pháp:** Báo cáo doanh thu truy vấn tất cả các khoản thanh toán trong kỳ có `paidAt` tương ứng và `status IN (SUCCESS, REFUNDED)`.
  $$\text{netRevenue} = \text{grossRevenue} - \text{refundedAmount}$$
- **Lý do thiết kế:**
  1. Phản ánh đúng dòng tiền thực thu (Cash Flow) của cơ sở kinh doanh, tránh hiện tượng "ảo tưởng doanh thu" do các đơn đặt rồi hủy hoàn tiền.
  2. Bỏ qua các giao dịch `PENDING` và `FAILED` vì chưa hoặc không phát sinh dòng tiền thật.
  3. Lọc theo thời điểm `paidAt` (tiền về ví/tài khoản) thay vì `createdAt` (thời điểm khởi tạo đơn).

### Quyết định 2: Occupancy tính cả booking `COMPLETED` (Khác biệt với API Availability)
- **Bối cảnh:** Endpoint `GET /api/v1/bookings/availability` của Module 4 chỉ lọc các trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN` để kiểm tra slot sân trống trong tương lai.
- **Giải pháp:** Module 8 định nghĩa slot đã lấp đầy khi tồn tại booking có `status IN (PENDING, CONFIRMED, CHECKED_IN, COMPLETED)`.
- **Lý do thiết kế:**
  1. Báo cáo thống kê nhìn về dữ liệu quá khứ. Các booking ở trạng thái `COMPLETED` là những lượt đặt sân đã diễn ra thành công và khách hàng đã chơi xong, đại diện cho công suất sử dụng thực tế.
  2. Ngược lại, API availability nhìn về tương lai và hiện tại nên chỉ cần giữ chỗ cho những đơn chưa kết thúc.
  3. Trạng thái `CANCELLED` luôn bị loại bỏ trong cả hai trường hợp.
  4. Mẫu số chỉ tính các sân đang `AVAILABLE` (sân `MAINTENANCE` không tính vào mẫu số để phản ánh đúng năng lực phục vụ).

### Quyết định 3: Gom nhóm Bucketing (DAY / WEEK / MONTH) bằng Java thay vì SQL
- **Bối cảnh:** Các hàm xử lý ngày tháng trong SQL (`DATE_FORMAT()`, `WEEK()`, `DATE_TRUNC()`) không đồng nhất giữa MySQL (môi trường Production) và H2 In-Memory DB (môi trường Test CI/CD).
- **Giải pháp:** Cơ sở dữ liệu chỉ thực hiện gom nhóm cấp ngày (`CAST(p.paidAt AS LocalDate)`). Tầng Service Java sử dụng Java Date-Time API (`LocalDate`, `YearMonth`, `TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)`) để gom thành các bucket theo Ngày, Tuần, Tháng.
- **Lý do thiết kế:**
  1. **Tính khả chuyển (Database Portability):** Chạy chính xác tuyệt đối trên cả MySQL và H2 Database mà không cần Native SQL hay Dialect-specific functions.
  2. **Biểu đồ Frontend liền mạch (Gapless Timeline):** SQL `GROUP BY` chỉ trả về những ngày có phát sinh dữ liệu, dẫn đến trục hoành của biểu đồ FE bị thủng lỗ. Thuật toán Java chủ động sinh dải bucket liên tục từ `from` đến `to`, tự động điền giá trị 0 cho những ngày không có giao dịch.
  3. **Khả năng kiểm thử (Testability):** Dễ dàng viết Mockito unit tests kiểm thử mọi trường hợp biên (ngày đầu tuần Thứ Hai, chuyển tháng, năm nhuận) mà không cần phụ thuộc vào database engine.

---

## 3. Đối Chiếu 5 Nguyên Tắc SOLID

| Nguyên tắc | Mức độ áp dụng trong Module 8 |
|---|---|
| **S - Single Responsibility Principle (SRP)** | - `ReportController`: Chỉ đảm nhận nhiệm vụ routing HTTP và phân quyền SpEL.<br>- `ReportServiceImpl`: Chỉ đảm nhận tính toán thống kê và thuật toán gom bucket.<br>- Projections: Chỉ định nghĩa schema dữ liệu trả về từ JPQL. |
| **O - Open/Closed Principle (OCP)** | - Dễ dàng bổ sung các chế độ gom nhóm mới (như `QUARTER`, `YEAR`) trong `ReportGroupBy` và `ReportServiceImpl` mà không phải thay đổi cấu trúc bảng hay repository.<br>- Tương thích mở rộng các phương thức thanh toán mới mà không cần sửa query breakdown. |
| **L - Liskov Substitution Principle (LSP)** | - Sử dụng `ReportService` interface; tầng Controller hoàn toàn phụ thuộc vào interface trừu tượng. |
| **I - Interface Segregation Principle (ISP)** | - Các interface projection (`DailyRevenueProjection`, `PaymentMethodRevenueProjection`, `DailyCourtOccupancyProjection`) được tách nhỏ vừa vặn với từng mục đích query, không thừa thãi thuộc tính. |
| **D - Dependency Inversion Principle (DIP)** | - 100% Constructor Injection thông qua `@RequiredArgsConstructor`.<br>- Không phụ thuộc vào lớp triển khai cụ thể của Spring Data JPA. |

---

## 4. Gợi Ý Trả Lời Phỏng Vấn Kỹ Thuật (Senior Technical Interview Tips)

### Câu hỏi 1: *"Vì sao doanh thu trong báo cáo tài chính của hệ thống phải tính theo Net Revenue (trừ hoàn tiền)?"*
> **Gợi ý trả lời:**  
> Trong mô hình kinh doanh đặt sân thể thao, khách hàng có quyền hủy lịch trước giờ chơi và nhận lại tiền cọc hoặc tiền thanh toán theo chính sách hủy sân (Module 6). Nếu báo cáo chỉ tính doanh thu gộp (Gross), số liệu tài chính sẽ bị phóng đại ảo và không khớp với số dư thực tế trong tài khoản ngân hàng của chủ sân. Bằng cách lấy `netRevenue = grossRevenue - refundedAmount`, hệ thống phản ánh chính xác dòng tiền ròng thực thu tại thời điểm tiền vào/ra (`paidAt`).

### Câu hỏi 2: *"Vì sao khi tính Occupancy Rate (tỉ lệ lấp đầy sân), hệ thống lại tính cả booking `COMPLETED`, trong khi API kiểm tra slot trống (Availability) thì không?"*
> **Gợi ý trả lời:**  
> Hai API phục vụ hai bài toán mang tính chất thời gian hoàn toàn trái ngược nhau. API Availability nhìn về **hiện tại và tương lai** để tìm khoảng trống đặt lịch mới, do đó các booking đã `COMPLETED` trong quá khứ không còn chiếm chỗ của tương lai. Ngược lại, API Báo cáo thống kê Occupancy nhìn về **quá khứ** để đánh giá hiệu suất khai thác của sân; một booking ở trạng thái `COMPLETED` chính là bằng chứng xác thực nhất cho thấy sân đã được khách hàng sử dụng thực tế trong khung giờ đó.

