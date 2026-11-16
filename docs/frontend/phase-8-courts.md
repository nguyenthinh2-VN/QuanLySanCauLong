# ĐẶC TẢ CHI TIẾT PHASE 8: QUẢN LÝ SÂN, CỤM SÂN & KHUNG GIỜ (M3)

> **Màn hình:** `/courts`  
> **Quyền hạn truy cập:** Chỉ dành riêng cho Quản trị viên (`ADMIN`). `STAFF` và `CUSTOMER` truy cập sẽ bị `RoleRoute` chặn và chuyển hướng sang `/403`.  
> **API Backend:** Module 3 — `CourtComplexController`, `CourtController`, `TimeSlotController`.

---

## 1. Tổng Quan Giao Diện

Màn hình Quản lý Sân & Khung giờ được tổ chức theo bố cục **1 trang duy nhất** với thanh điều hướng phân đoạn (**Segmented Control**) chuyển đổi nhanh giữa 3 nghiệp vụ:

1. **Cụm sân:** Danh mục các chi nhánh / cơ sở sân cầu lông.
2. **Sân con:** Danh sách các sân thi đấu trực thuộc từng cụm sân.
3. **Khung giờ & giá:** Bảng khung giờ mở cửa và đơn giá thuê theo từng giờ trong ngày.

Việc chuyển đổi qua lại giữa các mục được giữ nguyên trạng thái bộ lọc (filter state) của từng mục, giúp ADMIN dễ dàng thao tác mà không phải thiết lập lại điều kiện tìm kiếm.

---

## 2. Chi Tiết Các Phân Hệ Quản Trị

### 2.1. Quản Lý Cụm Sân (Complexes)
- **Endpoint API:** `GET /api/v1/complexes?q&status&page&size&sort`
- **Bộ lọc & Tìm kiếm:**
  - `q`: Tìm kiếm gần đúng theo tên cụm sân hoặc địa chỉ.
  - `status`: Lọc theo trạng thái (`ALL` / `ACTIVE` / `INACTIVE`).
  - Phân trang chuẩn với `page=0`, `size=10`, sắp xếp mặc định theo `createdAt,desc`.
- **Bảng dữ liệu:**
  - Tên cụm sân (bấm vào để mở modal xem chi tiết).
  - Địa chỉ.
  - Số điện thoại liên hệ (định dạng Việt Nam).
  - Số lượng sân trực thuộc (`totalCourts`).
  - Trạng thái hoạt động: Badge `ACTIVE` ("Đang hoạt động") / `INACTIVE` ("Ngừng hoạt động").
  - Thao tác: **Xem chi tiết**, **Sửa**, **Xóa**.
- **Xem chi tiết:** Gọi `GET /api/v1/complexes/{id}`, hiển thị đầy đủ thông tin cơ sở và danh sách toàn bộ các sân con thuộc cụm (`courts[]`: tên sân + trạng thái).
- **Tạo mới & Cập nhật (Tái sử dụng Form Dialog):**
  - Body tạo mới (`POST /api/v1/complexes`): `name` (bắt buộc, ≤150 ký tự), `address` (bắt buộc), `phone` (tùy chọn, validate regex `^(0|\+84)[3|5|7|8|9][0-9]{8}$`), `status` (mặc định `ACTIVE`).
  - Body cập nhật (`PUT /api/v1/complexes/{id}`): Gửi đủ cả 4 trường (`name`, `address`, `phone`, `status`) theo đúng contract `UpdateComplexRequest`.
  - Trùng tên cụm sân: Backend trả về lỗi 409 `DUPLICATE_COMPLEX_NAME`, hiển thị thông báo lỗi rõ ràng trên modal.
- **Hành vi Xóa cụm sân:**
  - Gọi `DELETE /api/v1/complexes/{id}` sau khi người dùng xác nhận tại dialog cảnh báo.
  - **Quy tắc bảo vệ dữ liệu:** Backend kiểm tra và từ chối xóa nếu cụm sân vẫn còn chứa sân con (mã lỗi 400 `COMPLEX_HAS_COURTS`). Giao diện sẽ hiển thị nguyên văn thông báo từ máy chủ để ADMIN dọn dẹp các sân con trước khi xóa cụm.

---

### 2.2. Quản Lý Sân Con (Courts)
- **Endpoint API:** `GET /api/v1/courts?complexId&status&q&page&size&sort`
- **Bộ lọc & Tìm kiếm:**
  - Dropdown chọn cụm sân: Tải trước toàn bộ danh sách cụm sân qua `GET /api/v1/complexes?size=100` (giả định số lượng cụm sân trong hệ thống luôn <100, 1 trang là đủ).
  - Dropdown lọc trạng thái: `ALL` / `AVAILABLE` ("Đang trống / Sẵn sàng") / `MAINTENANCE` ("Đang bảo trì").
  - Ô tìm kiếm `q` theo tên sân.
- **Bảng dữ liệu:**
  - Tên sân.
  - Tên cụm sân trực thuộc (`complexName`).
  - Trạng thái sân: Badge `AVAILABLE` ("Đang trống") / `MAINTENANCE` ("Bảo trì").
  - Ngày tạo.
  - Thao tác: **Sửa**, **Xóa**.
- **Tạo mới sân con (`POST /api/v1/courts`):**
  - Body: `complexId` (chọn từ dropdown), `name` (≤100 ký tự), `status` (`AVAILABLE` / `MAINTENANCE`).
  - Trùng tên sân trong cùng cụm: Backend trả về lỗi 409 `DUPLICATE_COURT_NAME`.
- **Cập nhật sân con (`PUT /api/v1/courts/{id}`):**
  - **Lưu ý đặc biệt về contract:** DTO `UpdateCourtRequest` của Backend **không có trường `complexId`** (không cho phép đổi cụm sân của sân đã tạo).
  - Form cập nhật hiển thị tên cụm sân dạng Read-only, chỉ gửi `{ name, status }`. Tuyệt đối không gửi thừa `complexId`.
- **Hành vi Xóa sân con (`DELETE /api/v1/courts/{id}`):**
  - Backend thực hiện xóa thẳng bản ghi sân con mà hiện tại chưa có guard kiểm tra đơn đặt liên quan (theo thiết kế hiện tại của Module 3).
  - Giao diện cung cấp dialog xác nhận cảnh báo hành động xóa là vĩnh viễn và không thể hoàn tác.

---

### 2.3. Quản Lý Khung Giờ & Bảng Giá (Time Slots)
- **Endpoint API:** `GET /api/v1/time-slots`
- **Đặc điểm kiến trúc:**
  - Backend trả về danh sách mảng thuần (`List<TimeSlotResponse>`), **không phân trang**.
  - Client tự động sắp xếp danh sách theo giờ bắt đầu (`startTime`) tăng dần để bảng giờ luôn hiển thị tuần tự theo thứ tự sáng đến tối trong ngày.
- **Bảng dữ liệu:**
  - Tên khung giờ (VD: `Sáng sớm 05:00–08:00`, `Giờ vàng 16:00–21:00`).
  - Giờ bắt đầu – kết thúc: Chuẩn hóa hiển thị định dạng `HH:mm` (cắt bỏ phần giây `:ss` nếu Backend trả về).
  - Đơn giá thuê: Hiển thị định dạng tiền tệ Việt Nam `xxx.xxxđ / giờ`.
  - Ngày tạo.
  - Thao tác: **Sửa**.
  - **LƯU Ý VỀ XÓA KHUNG GIỜ:** Backend **hoàn toàn không có endpoint `DELETE /api/v1/time-slots`**. Giao diện tuyệt đối không tự chế nút xóa.
- **Tạo mới & Cập nhật Khung giờ:**
  - Endpoint: `POST /api/v1/time-slots` (tạo) và `PUT /api/v1/time-slots/{id}` (sửa).
  - Các trường: `name` (≤100 ký tự), `startTime` (`type="time"` -> chuỗi `"HH:mm"`), `endTime` (`type="time"` -> chuỗi `"HH:mm"`), `pricePerHour` (số nguyên, ≥ 0).
  - **Client-side Guards:**
    - Kiểm tra `startTime < endTime` trước khi gửi request.
    - Kiểm tra đơn giá thuê không âm.
  - **Server-side Guards:**
    - Lỗi 400 `INVALID_TIME_RANGE`: Giờ bắt đầu không được lớn hơn hoặc bằng giờ kết thúc.
    - Lỗi 409 `OVERLAPPING_TIME_SLOT`: Khoảng thời gian bị trùng hoặc giao nhau với khung giờ khác đã tồn tại trong hệ thống (khi sửa, Backend tự loại trừ chính slot đang cập nhật).

---

## 3. Danh Mục Tệp Mã Nguồn Mới & Chỉnh Sửa

| Tệp tin | Thư mục | Vai trò |
|---|---|---|
| `court.ts` | `FE/src/types/` | Định nghĩa toàn bộ TypeScript interfaces cho Cụm sân, Sân con và Khung giờ |
| `court.ts` | `FE/src/lib/` | Cung cấp các hàm gọi API RESTful qua axios instance (`/complexes`, `/courts`, `/time-slots`) |
| `CourtSegmentedControl.tsx` | `FE/src/components/court/` | Thanh chuyển tab segmented 3 mục với số lượng count |
| `ComplexFilterBar.tsx` | `FE/src/components/court/` | Thanh tìm kiếm, lọc trạng thái và nút thêm cụm sân |
| `ComplexTable.tsx` | `FE/src/components/court/` | Bảng hiển thị danh sách cụm sân kèm phân trang |
| `ComplexDetailDialog.tsx` | `FE/src/components/court/` | Modal xem chi tiết cụm sân và danh sách sân con trực thuộc |
| `ComplexFormDialog.tsx` | `FE/src/components/court/` | Modal tạo mới và chỉnh sửa cụm sân (tái sử dụng form) |
| `DeleteComplexDialog.tsx` | `FE/src/components/court/` | Modal xác nhận xóa cụm sân (bắt lỗi 400 nếu còn sân con) |
| `CourtFilterBar.tsx` | `FE/src/components/court/` | Thanh lọc theo cụm, trạng thái và tìm kiếm sân con |
| `CourtTable.tsx` | `FE/src/components/court/` | Bảng hiển thị danh sách sân con kèm phân trang |
| `CourtFormDialog.tsx` | `FE/src/components/court/` | Modal tạo mới (chọn cụm) và sửa sân (read-only cụm, không gửi `complexId`) |
| `DeleteCourtDialog.tsx` | `FE/src/components/court/` | Modal xác nhận xóa sân con |
| `TimeSlotTable.tsx` | `FE/src/components/court/` | Bảng hiển thị khung giờ & giá (sắp xếp client, không có nút xóa) |
| `TimeSlotFormDialog.tsx` | `FE/src/components/court/` | Modal tạo mới và chỉnh sửa khung giờ (kiểm tra giờ đè nhau) |
| `CourtsPage.tsx` | `FE/src/pages/court/` | Page Composer mỏng quản lý trạng thái 3 tabs |
| `ReportsPage.tsx` | `FE/src/pages/report/` | Fix nit 1: Clear `occupancyError` khi bắt đầu gọi refetch |
| `PaymentInvoiceDialog.tsx` | `FE/src/components/payment/` | Fix nit 2: Hiển thị nhãn "Thành viên" / "Khách vãng lai" + dòng email riêng |
| `index.tsx` | `FE/src/router/` | Thay thế `FeaturePlaceholder` bằng `CourtsPage` tại route `courts` |
