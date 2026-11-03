# BÁO CÁO THỬ NGHIỆM TẢI & ĐÁNH GIÁ HIỆU NĂNG (LOAD & STRESS TEST BENCHMARK)

> **Dự án:** Quản Lý Sân Cầu Lông (QuanLySanCauLong Backend)  
> **Môi trường đo lường:** Java 23 (Project Loom - Virtual Threads), Spring Boot 3.3.5, Spring Data JPA, HikariCP, H2 (MySQL Mode) / In-Memory Isolation.  
> **Công cụ đo lường:** `SystemLoadBenchmarkTest` với `CountDownLatch` khởi động đồng thời 100% luồng và đồng hồ đo thời gian thực thi nano-giây (`System.nanoTime`). Không sử dụng bất kỳ hằng số thời gian giả lập nào.

---

## 1. Bảng Tổng Hợp Số Liệu Benchmark Thực Tế Trên Máy

| Kịch bản kiểm thử | Quy mô tải (Concurrent Reqs) | Công nghệ luồng | Tổng thời gian | Thông lượng (Throughput) | P50 Latency (50% users) | P95 Latency (95% users) | Tỉ lệ lỗi (500/Timeout) | Tính toàn vẹn dữ liệu |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Kịch bản 1: Đọc lịch trống (Availability)** | **1,000 reqs** | Virtual Threads | **180 ms** | **5,555.56 req/s** | **0.21 ms** | **0.61 ms** | **0.00%** | 1,000/1,000 thành công |
| **Kịch bản 2: Stress test cực hạn (Read)** | **10,000 reqs** | Virtual Threads | **9,692 ms (9.69 s)** | **1,031.78 req/s** | **2,826.92 ms** | **4,101.51 ms** | **0.00%** | 10,000/10,000 thành công |
| **Kịch bản 3: Tranh chấp Giờ Vàng (Hotspot Booking)** | **1,000 reqs** | Virtual Threads | **1,438 ms (1.44 s)** | **695.41 req/s** | **787.75 ms** | **1,369.18 ms** | **0.00%** | Đúng 1 người đặt được, 999 mã 409 |
| **Kịch bản 4: Flash Sale Voucher Contention** | **1,000 reqs** | Virtual Threads | **3,138 ms (3.14 s)** | **318.67 req/s** | **1,490.24 ms** | **2,444.04 ms** | **0.00%** | Đúng 10 suất, 990 mã 400 |

---

## 2. Phân Tích Chuyên Sâu Từng Kịch Bản

### 2.1. Kịch bản 1: Đọc dữ liệu lịch trống với 1,000 requests đồng thời
- **Kết quả:** Hệ thống xử lý hoàn tất 1,000 requests chỉ trong **180 ms (0.18 giây)**, đạt thông lượng ấn tượng **5,555.56 RPS**.
- **Phân phối độ trễ đo thực tế:**
  - Nhanh nhất (Min): `0.18 ms`
  - Trung bình (Avg): `0.67 ms`
  - Trung vị (P50): `0.21 ms`
  - 90% người dùng (P90): `0.37 ms`
  - 95% người dùng (P95): `0.61 ms`
  - 99% người dùng (P99): `10.88 ms`
  - Lâu nhất (Max): `71.52 ms`
- **Ý nghĩa:** Khi có 1,000 khách hàng cùng lúc mở app tra cứu khung giờ trống, hệ thống phản hồi cực nhanh dưới **1ms** cho 95% người dùng.

### 2.2. Kịch bản 2: Stress test cực hạn với 10,000 requests đồng thời
- **Kết quả:** Hệ thống chịu được xung lực 10,000 requests đồng thời mà **không bị sập, không tràn bộ nhớ (Out-Of-Memory) và không có bất kỳ request nào bị drop (Error Rate = 0.00%)**. Hoàn tất toàn bộ 10,000 requests trong **9.69 giây** (Đạt **1,031.78 RPS**).
- **Phân phối độ trễ đo thực tế:**
  - Nhanh nhất (Min): `0.44 ms`
  - Trung bình (Avg): `2,636.65 ms`
  - Trung vị (P50): `2,826.92 ms`
  - 95% người dùng (P95): `4,101.51 ms`
  - 99% người dùng (P99): `6,454.11 ms`
  - Lâu nhất (Max): `6,577.15 ms`
- **Điểm nghẽn phát hiện (Bottleneck Identification):**
  - Mặc dù Java 23 Virtual Threads duy trì 10,000 luồng I/O ổn định, độ trễ trung bình tăng lên **2.6s - 4.1s** do **Database Connection Pool (HikariCP)** bị nghẽn ở giới hạn kết nối mặc định. Hàng ngàn requests phải xếp hàng chờ nhận kết nối database.
- **Hướng tối ưu đề xuất (chưa đo lường):**
  - Đề xuất áp dụng In-Memory Cache (Caffeine / Redis) cho dữ liệu lịch trống (TTL 30s) để giảm tải cho DB connection pool, giúp các request đọc không phải xếp hàng chờ kết nối.

### 2.3. Kịch bản 3: Tranh chấp giờ vàng (Hotspot Booking Contention)
- **Tình huống:** 1,000 khách hàng cùng bấm nút đặt duy nhất 1 slot sân trong cùng 1 thời điểm.
- **Kết quả đo thực tế:**
  - Đúng **1 giao dịch thành công (0.10%)**, tạo duy nhất 1 booking trong DB.
  - Đúng **999 giao dịch bị chặn an toàn (99.90%)** với mã lỗi `409 Conflict (SLOT_ALREADY_BOOKED)`.
  - **Lỗi hệ thống ngoài ý muốn:** `0.00%` (Không lỗi 500, không timeout).
  - Hoàn thành toàn bộ 1,000 requests trong **1.44 giây** (Đạt **695.41 RPS**).
- **Phân phối độ trễ đo thực tế:**
  - Nhanh nhất (Min): `27.92 ms` (request thắng lock và hoàn tất giao dịch đầu tiên)
  - Trung vị (P50): `787.75 ms`
  - 95% người dùng (P95): `1,369.18 ms`
  - Lâu nhất (Max): `1,420.96 ms`
- **Giải thích kỹ thuật:** Khi có tranh chấp đồng thời cao, cơ chế khóa bi quan (`PESSIMISTIC_WRITE`) tuần tự hóa các giao dịch tại hàng cơ sở dữ liệu. Request đầu tiên hoàn tất trong ~28ms; các request xếp sau trong hàng đợi khóa nhận `409 Conflict` ngay khi kiểm tra guard mà không gây sai lệch dữ liệu.

### 2.4. Kịch bản 4: Tranh chấp Flash Sale Voucher
- **Tình huống:** 1,000 khách hàng cùng áp mã tranh 10 suất voucher giảm giá giới hạn.
- **Kết quả đo thực tế:**
  - Đúng **10 giao dịch thành công (1.00%)** và ghi nhận vào bảng `voucher_usages`.
  - Đúng **990 giao dịch bị chặn (99.00%)** với mã lỗi `400 Bad Request (VOUCHER_USAGE_EXCEEDED)`.
  - **Thất thoát ngân sách:** `0.00 VNĐ`.
  - **Lỗi hệ thống ngoài ý muốn:** `0.00%`.
  - Hoàn thành toàn bộ 1,000 requests trong **3.14 giây** (Đạt **318.67 RPS**).
- **Phân phối độ trễ đo thực tế:**
  - Nhanh nhất (Min): `17.54 ms`
  - Trung vị (P50): `1,490.24 ms`
  - 95% người dùng (P95): `2,444.04 ms`
  - Lâu nhất (Max): `2,541.41 ms`
- **Giải thích kỹ thuật:** Khóa bi quan kép trên cả `Booking` và `Voucher` kết hợp `entityManager.refresh()` đảm bảo mọi luồng đều đọc đúng giá trị `usedCount` mới nhất từ DB, bảo vệ 100% ngân sách khuyến mãi.

---

## 3. Gợi Ý Mục Viết Vào CV / Portfolio (Dành Cho Ứng Viên)

Bạn có thể đưa các gạch đầu dòng trung thực và ấn tượng sau vào mục **Kinh nghiệm dự án (Project Experience)** trong CV của mình:

### 🌟 Tiêu đề dự án: Backend Quản Lý Sân Cầu Lông (Spring Boot 3 & Java 23)
> - **Tối ưu hóa hiệu năng & Chịu tải cao (High Concurrency & Load Optimization):**
>   - Ứng dụng **Java 23 Virtual Threads (Project Loom)** giúp hệ thống duy trì độ ổn định tuyệt đối dưới tải xung lực **10,000 requests đồng thời** với tỷ lệ lỗi **0.00%** (đo trên H2 in-memory, máy cá nhân).
>   - Đạt thông lượng **5,500+ RPS** cho các truy vấn tra cứu lịch sân trống với độ trễ phản hồi **P95 < 1ms** (đo trên H2 in-memory, máy cá nhân) dưới tải 1,000 luồng đồng thời.
>
> - **Kiểm soát đồng thời & Bảo vệ dữ liệu tài chính (Concurrency Control & Data Integrity):**
>   - Thiết kế cơ chế **Pessimistic Write Lock kép (`SELECT ... FOR UPDATE`)** trên cả tài nguyên `Booking` và `Voucher`, loại bỏ hoàn toàn hiện tượng Race Condition và nguy cơ Double-Booking.
>   - Giải quyết triệt để lỗi Hibernate 1st-level cache stale data trong môi trường đa luồng bằng `entityManager.refresh()`.
>   - Kiểm chứng thực tế qua bài stress test **1,000 requests tranh chấp 1 slot giờ vàng** trong cùng 1 thời điểm: **100% dữ liệu toàn vẹn** (đúng 1 đơn thành công, 999 đơn nhận phản hồi `409 Conflict`, 0 lỗi hệ thống 500, thời gian hoàn tất toàn bộ 1,000 requests là **1.44s** — đo trên H2 in-memory, máy cá nhân).
