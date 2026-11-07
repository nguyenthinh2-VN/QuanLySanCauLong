# HỆ THỐNG THIẾT KẾ UI/UX & BẢNG MÀU COURT EMERALD (FRONTEND DESIGN SYSTEM)

> **Design Read (theo `/design-taste-frontend`):**  
> *"Reading this as: Multi-role SaaS Management & Booking Web Application for Court Admins, Staff, and Players, with a modern, approachable Sport-Tech SaaS language, leaning toward **shadcn/ui Zinc/Slate neutrals** paired with **Deep Court Emerald (`#059669`)** primary brand color and **Soft Tonal Semantic Accents** (calibrated saturation < 80%, warm on the eyes, never neon or harsh all-black)."*

---

## 1. Cấu Hình 3 Trục Thiết Kế (The Three Dials)

Áp dụng từ kỹ năng `/design-taste-frontend` & `/frontend-ui-engineering`:
- **`DESIGN_VARIANCE: 4`** — Bố cục hiện đại, chuẩn mực, có điểm nhấn thị giác bằng thanh chỉ báo màu (Top Accent Bar trên Auth Card, Left Indicator Bar trên Sidebar, và Tonal Icon Badges trên từng thẻ KPI).
- **`MOTION_INTENSITY: 4`** — Chuyển động mượt mà (`transition-all duration-200`, `:active:scale-[0.99]`, hover nâng nhẹ viền `hover:border-emerald-200`).
- **`VISUAL_DENSITY: 5`** — Khoảng thở rộng rãi (`p-6`, `gap-6`), phân tách khu vực bằng đường viền `1px solid border-slate-200` và nền phân lớp (`bg-slate-50/70` vs `bg-white`).

---

## 2. Bảng Màu Chủ Đạo: **Court Emerald & Slate/Zinc** (Hiện Đại, Dịu Mắt, Không Chói)

Lấy cảm hứng từ **mặt thảm sân cầu lông tiêu chuẩn thi đấu quốc tế BWF (Deep Emerald Green)** kết hợp với hệ màu trung tính `Slate/Zinc` của `shadcn/ui`. Bảng màu mang lại cảm giác hiện đại, tươi mới, đúng chất thể thao nhưng độ bão hòa được tiết chế để nhìn lâu không mỏi mắt:

### 2.1. Nhóm Màu Nền & Thương Hiệu Chính (Core & Brand Tokens)
| Token Semantic | Tailwind Class | Mã Hex | Mục đích sử dụng trong ứng dụng |
|---|---|:---:|---|
| **App Background** | `bg-slate-50` / `bg-zinc-50` | `#F8FAFC` | Nền tổng thể của trang Login/Register và vùng nội dung chính (`main`) |
| **Card / Sidebar / Header** | `bg-white` | `#FFFFFF` | Nền của `Card`, `Sidebar`, `Header`, `DropdownMenu` |
| **Primary Brand (CTA)** | `bg-emerald-600` | `#059669` | Nút hành động chính (*Đăng nhập*, *Đăng ký*, *Về trang chủ*), Logo Badge, Checkbox |
| **Primary Hover** | `hover:bg-emerald-700` | `#047857` | Trạng thái di chuột lên nút chính (đậm hơn, tạo chiều sâu) |
| **Active Menu Surface** | `bg-emerald-50/80 text-emerald-800` | `#ECFDF5` / `#065F46` | Nền mục đang chọn trên Sidebar + thanh chỉ báo dọc `3px bg-emerald-600` bên trái |
| **Primary Text** | `text-slate-900` | `#0F172A` | Tiêu đề trang, số liệu thống kê KPI, nhãn (Label) của Form (thay vì màu đen tuyền `#000`) |
| **Secondary / Muted Text** | `text-slate-500` | `#64748B` | Mô tả phụ dưới tiêu đề, placeholder trong ô Input, mục menu chưa active |
| **Border & Divider** | `border-slate-200` | `#E2E8F0` | Viền `1px` của Card, ô Input, vạch ngăn cách Sidebar/Header (`Separator`) |
| **Focus Ring** | `focus-visible:ring-emerald-600/30 focus-visible:border-emerald-600` | `#059669` | Viền focus xanh ngọc dịu mắt khi nhập liệu trong ô `Input` |

### 2.2. Nhóm Màu Điểm Nhấn Ngữ Nghĩa Dịu Mắt (Soft Tonal Semantic Accents)
Để giao diện sinh động, mỗi thẻ thống kê (KPI Card), hộp Icon và `Badge` vai trò sử dụng **nền Pastel nhạt (50/100) đi kèm chữ & icon cùng tông đậm (700)** — tạo màu sắc phong phú nhưng không bao giờ bị chói:

| Nhóm Ngữ Nghĩa | Nền (Surface) | Chữ & Icon (Foreground) | Viền (Border) | Ứng dụng trong Giao diện |
|---|---|---|---|---|
| **Emerald (Tài chính / ADMIN)** | `bg-emerald-50` (`#ECFDF5`) | `text-emerald-700` (`#047857`) | `border-emerald-200` (`#A7F3D0`) | Badge `ADMIN`, Thẻ *Tổng doanh thu*, trạng thái hoàn thành |
| **Sky Blue (Đặt sân / STAFF)** | `bg-sky-50` (`#F0F9FF`) | `text-sky-700` (`#0369A1`) | `border-sky-200` (`#BAE6FD`) | Badge `STAFF`, Avatar nền xanh dịu, Thẻ *Lượt đặt sân hôm nay* |
| **Indigo (Sân bãi / CUSTOMER)** | `bg-indigo-50` (`#EEF2FF`) | `text-indigo-700` (`#4338CA`) | `border-indigo-200` (`#C7D2FE`) | Badge `CUSTOMER`, Thẻ *Sân đang hoạt động* |
| **Amber (Công suất / Phase sau)** | `bg-amber-50` (`#FFFBEB`) | `text-amber-700` (`#B45309`) | `border-amber-200` (`#FDE68A`) | Badge `"Phase sau"`, Thẻ *Tỉ lệ lấp đầy*, cảnh báo bảo trì |
| **Rose / Red (Lỗi / Đăng xuất)** | `bg-rose-50` (`#FFF1F2`) | `text-rose-700` (`#BE123C`) | `border-rose-200` (`#FECDD3`) | Thông báo lỗi từ API Backend, lỗi khớp mật khẩu, nút *Đăng xuất* |

---

## 3. Hệ Thống Chữ Viết (Typography Hierarchy)

- **Font chữ chính (`font-sans`):** `Plus Jakarta Sans`, `Geist Sans` hoặc `Inter` (hỗ trợ đầy đủ dấu tiếng Việt sắc nét).
- **Font chữ số liệu (`font-mono`):** `JetBrains Mono` / `Geist Mono` kết hợp `tabular-nums` cho các con số thống kê trên 4 thẻ KPI Card.

| Cấp độ | Tailwind Classes | Nơi áp dụng |
|---|---|---|
| **Page Title (`h1`)** | `text-xl font-semibold tracking-tight text-slate-900` | Tiêu đề trên thanh `Header` (`Tổng quan`, `Quản lý sân`...) |
| **Auth Card Title** | `text-2xl font-bold tracking-tight text-slate-900` | Tiêu đề trong Card `/login`, `/register`, `/forgot-password` |
| **Stat KPI Value** | `text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900` | Con số chính trong 4 thẻ thống kê Dashboard |
| **Section / Card Title (`h3`)** | `text-sm font-medium text-slate-500` | Tiêu đề nhỏ phía trên mỗi thẻ thống kê |
| **Body / Input Text** | `text-sm text-slate-800 leading-normal` | Nội dung nhập liệu, danh sách menu Sidebar |

## 5. Quy Tắc Chống "AI Aesthetic" & Quy Chuẩn Icon (Anti-Slop Checklist)

1. **Quy tắc Tinh giản Icon (Typography-First Navigation & Cards):**
   - **BỎ toàn bộ icon** ở các mục menu trên `Sidebar`, trong 4 thẻ `Stat KPI Cards`, `Header` và các khung `Placeholder` nội bộ — phân cấp thị giác hoàn toàn bằng Typography sắc nét, khoảng trắng, dải chỉ báo màu (`3px bg-emerald-600`) và các nhãn `Badge` màu Pastel dịu mắt.
   - **CHỈ GIỮ LẠI icon tại các màn hình Auth (`/login`, `/register`, `/forgot-password`, `/reset-password`):** Logo biểu tượng sân cầu lông trên đỉnh Card và nút ẩn/hiện mật khẩu trong ô nhập mật khẩu.
2. **Không dùng Card lồng trong Card quá 2 cấp:** Trong Dashboard, 4 thẻ KPI nằm trực tiếp trên nền `bg-slate-50`, không bọc thêm một khung Card bao ngoài dư thừa.
3. **Trạng thái Tương tác Đầy đủ:** Mọi form đều có 4 trạng thái rõ ràng: *Idle* $\rightarrow$ *Submitting (disabled + text "Đang xử lý...")* $\rightarrow$ *Error (khung thông báo đỏ từ server hoặc lỗi khớp mật khẩu)* $\rightarrow$ *Success (thông báo thành công / điều hướng)*.

| # | Tên Component (`shadcn/ui`) | File tại `src/components/ui/` | Tùy biến Màu sắc & Nơi sử dụng trong Phase 1 |
|:---:|---|---|---|
| 1 | **`Button`** | `button.tsx` | - `default`: `bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm` cho các nút chính (*Đăng nhập*, *Đăng ký*, *Về trang chủ*).<br>- `ghost`: Nút ẩn/hiện mật khẩu.<br>- `outline`: Nút phụ viền `border-slate-200 hover:bg-slate-50`. |
| 2 | **`Input`** | `input.tsx` | Ô nhập liệu cao `h-10`, viền `border-slate-200`, khi focus chuyển sang viền xanh ngọc `focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600`. |
| 3 | **`Label`** | `label.tsx` | Nhãn `text-slate-700 font-medium` nằm phía trên từng ô `Input` và `Checkbox`. |
| 4 | **`Card`** | `card.tsx` | - Auth Card: Có đường viền nhấn `border-t-4 border-t-emerald-600` tạo điểm nhấn thương hiệu.<br>- 4 Stat KPI Cards: Mỗi thẻ có hộp icon màu Pastel (`emerald`, `sky`, `indigo`, `amber`) ở góc phải trên. |
| 5 | **`Checkbox`** | `checkbox.tsx` | Ô chọn *"Ghi nhớ đăng nhập"* (`data-[state=checked]:bg-emerald-600`). |
| 6 | **`Avatar`** | `avatar.tsx` | Hiển thị 2 chữ cái đầu tên user trên nền Tonal (`bg-emerald-100 text-emerald-800` hoặc `bg-sky-100 text-sky-800`). |
| 7 | **`DropdownMenu`** | `dropdown-menu.tsx` | Menu tài khoản góc phải Header (*Hồ sơ cá nhân*, vạch chia, và *Đăng xuất* màu `text-rose-600`). |
| 8 | **`Badge`** | `badge.tsx` | Hỗ trợ các biến thể màu Tonal dịu mắt: `emerald` (`ADMIN`), `sky` (`STAFF`), `indigo` (`CUSTOMER`), `amber` (`Phase sau`). |
| 9 | **`Separator`** | `separator.tsx` | Đường kẻ ngang `1px bg-slate-200`. |
| 10 | **`Skeleton`** | `skeleton.tsx` | Khung tải dữ liệu `animate-pulse bg-slate-200/70` khi kiểm tra phiên đăng nhập lúc F5. |
