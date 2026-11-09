# HỆ THỐNG THIẾT KẾ UI/UX & BẢNG MÀU ZINC (FRONTEND DESIGN SYSTEM)

> **Design Read (theo `/design-taste-frontend`):**  
> *"Reading this as: Multi-role SaaS Management & Booking Web Application for Court Admins, Staff, and Players, with a modern, approachable Sport-Tech SaaS language, leaning toward **shadcn/ui Zinc/Slate neutrals** (`#18181B` primary brand accent) paired with **Soft Tonal Semantic Accents** (calibrated saturation < 80%, warm on the eyes, never neon)."*

---

## 1. Cấu Hình 3 Trục Thiết Kế (The Three Dials)

Áp dụng từ kỹ năng `/design-taste-frontend` & `/frontend-ui-engineering`:
- **`DESIGN_VARIANCE: 4`** — Bố cục hiện đại, chuẩn mực, có điểm nhấn thị giác bằng thanh chỉ báo màu (Top Accent Bar trên Auth Card, Left Indicator Bar trên Sidebar, và Tonal Badges trên từng thẻ KPI).
- **`MOTION_INTENSITY: 4`** — Chuyển động mượt mà (`transition-all duration-200`, `:active:scale-[0.99]`, hover nâng nhẹ viền `hover:border-zinc-300`).
- **`VISUAL_DENSITY: 5`** — Khoảng thở rộng rãi (`p-6`, `gap-6`), phân tách khu vực bằng đường viền `1px solid border-slate-200` và nền phân lớp (`bg-slate-50/70` vs `bg-white`).

---

## 2. Bảng Màu Chủ Đạo: **shadcn/ui Zinc & Slate** (Hiện Đại, Dịu Mắt, Không Chói)

Sử dụng hệ màu trung tính chuẩn mực **`Zinc / Slate`** của `shadcn/ui` với điểm nhấn chính `zinc-900` (`#18181B`) kết hợp các nhãn ngữ nghĩa Pastel dịu mắt:

### 2.1. Nhóm Màu Nền & Thương Hiệu Chính (Core & Brand Tokens)
| Token Semantic | Tailwind Class | Mã Hex | Mục đích sử dụng trong ứng dụng |
|---|---|:---:|---|
| **App Background** | `bg-slate-50` / `bg-zinc-50` | `#F8FAFC` | Nền tổng thể của trang Login/Register và vùng nội dung chính (`main`) |
| **Card / Sidebar / Header** | `bg-white` | `#FFFFFF` | Nền của `Card`, `Sidebar`, `Header`, `DropdownMenu` |
| **Primary Brand (CTA)** | `bg-zinc-900` | `#18181B` | Nút hành động chính (*Đăng nhập*, *Đăng ký*, *Đặt sân*, *Về trang chủ*), Logo Badge, Checkbox |
| **Primary Hover** | `hover:bg-zinc-800` | `#27272A` | Trạng thái di chuột lên nút chính |
| **Active Menu Surface** | `bg-zinc-100 text-zinc-900` | `#F4F4F5` / `#18181B` | Nền mục đang chọn trên Sidebar + thanh chỉ báo dọc `4px bg-zinc-900` bên trái |
| **Primary Text** | `text-slate-900` | `#0F172A` | Tiêu đề trang, số liệu thống kê KPI, nhãn (Label) của Form |
| **Secondary / Muted Text** | `text-slate-500` | `#64748B` | Mô tả phụ dưới tiêu đề, placeholder trong ô Input, mục menu chưa active |
| **Border & Divider** | `border-slate-200` | `#E2E8F0` | Viền `1px` của Card, ô Input, vạch ngăn cách Sidebar/Header (`Separator`) |
| **Focus Ring** | `focus-visible:ring-zinc-900/20 focus-visible:border-zinc-900` | `#18181B` | Viền focus chuẩn `Zinc` khi nhập liệu trong ô `Input` |

### 2.2. Nhóm Màu Điểm Nhấn Ngữ Nghĩa Dịu Mắt (Soft Tonal Semantic Accents)
Để giao diện rõ ràng theo ngữ cảnh, mỗi thẻ thống kê (KPI Card) và `Badge` vai trò/trạng thái sử dụng **nền Pastel nhạt (50/100) đi kèm chữ cùng tông đậm (700/800)**:

| Nhóm Ngữ Nghĩa | Nền (Surface) | Chữ (Foreground) | Viền (Border) | Ứng dụng trong Giao diện |
|---|---|---|---|---|
| **Zinc (Mặc định / ADMIN)** | `bg-zinc-100` (`#F4F4F5`) | `text-zinc-800` (`#27272A`) | `border-zinc-200` (`#E4E4E7`) | Badge `ADMIN`, Thẻ KPI đầu tiên, module tag |
| **Sky Blue (Đặt sân / STAFF)** | `bg-sky-50` (`#F0F9FF`) | `text-sky-700` (`#0369A1`) | `border-sky-200` (`#BAE6FD`) | Badge `STAFF`, trạng thái `CONFIRMED`, Thẻ *Lượt đặt sân* |
| **Indigo (Sân bãi / CUSTOMER)** | `bg-indigo-50` (`#EEF2FF`) | `text-indigo-700` (`#4338CA`) | `border-indigo-200` (`#C7D2FE`) | Badge `CUSTOMER`, trạng thái `CHECKED_IN` / `COMPLETED` |
| **Amber (Chờ xử lý / Bảo trì)** | `bg-amber-50` (`#FFFBEB`) | `text-amber-700` (`#B45309`) | `border-amber-200` (`#FDE68A`) | Trạng thái `PENDING` (chờ thanh toán), sân `MAINTENANCE`, Badge `"Phase sau"` |
| **Rose / Red (Lỗi / Đã hủy)** | `bg-rose-50` (`#FFF1F2`) | `text-rose-700` (`#BE123C`) | `border-rose-200` (`#FECDD3`) | Thông báo lỗi từ API Backend, trạng thái `CANCELLED`, nút *Đăng xuất* |
| **Success (Thông báo thành công)** | `bg-emerald-50` (`#ECFDF5`) | `text-emerald-800` (`#065F46`) | `border-emerald-200` (`#A7F3D0`) | Chỉ dùng riêng cho ngữ nghĩa thành công (`AuthAlert variant="success"` và hộp xác nhận đã gửi email khôi phục mật khẩu) |

---

## 3. Hệ Thống Chữ Viết (Typography Hierarchy)

- **Font chữ chính (`font-sans`):** `Plus Jakarta Sans`, `Geist Sans` hoặc `Inter` (hỗ trợ đầy đủ dấu tiếng Việt sắc nét).
- **Font chữ số liệu (`tabular-nums`):** Kết hợp `tabular-nums` cho các con số thống kê trên 4 thẻ KPI Card và đơn giá đặt sân.

| Cấp độ | Tailwind Classes | Nơi áp dụng |
|---|---|---|
| **Page Title (`h1`)** | `text-xl font-semibold tracking-tight text-slate-900` | Tiêu đề trên thanh `Header` (`Tổng quan`, `Đặt sân trực tuyến`...) |
| **Auth Card Title** | `text-2xl font-bold tracking-tight text-slate-900` | Tiêu đề trong Card `/login`, `/register`, `/forgot-password` |
| **Stat KPI Value** | `text-3xl font-bold tabular-nums tracking-tight text-slate-900` | Con số chính trong 4 thẻ thống kê Dashboard |
| **Section / Card Title (`h3`)** | `text-xs font-semibold uppercase tracking-wide text-slate-500` | Tiêu đề nhỏ phía trên mỗi thẻ thống kê |
| **Body / Input Text** | `text-sm text-slate-800 leading-normal` | Nội dung nhập liệu, danh sách menu Sidebar |

---

## 4. Quy Tắc Chống "AI Aesthetic" & Quy Chuẩn Icon (Anti-Slop Checklist)

1. **Quy tắc Tinh giản Icon (Typography-First Navigation & Cards):**
   - **BỎ icon trang trí dư thừa** ở các mục menu trên `Sidebar`, trong 4 thẻ `Stat KPI Cards`, `Header` và các khung `Placeholder` nội bộ — phân cấp thị giác bằng Typography sắc nét, khoảng trắng, dải chỉ báo màu (`bg-zinc-900`) và các nhãn `Badge` màu Pastel dịu mắt.
   - **Giữ icon có chủ đích:** Logo biểu tượng sân cầu lông + nút ẩn/hiện mật khẩu trên các màn hình Auth, và icon hướng dẫn trong Empty State khi danh sách lịch đặt sân trống.
2. **Không dùng Card lồng trong Card quá 2 cấp:** Trong Dashboard, 4 thẻ KPI nằm trực tiếp trên nền `bg-slate-50`, không bọc thêm một khung Card bao ngoài dư thừa.
3. **Trạng thái Tương tác Đầy đủ:** Mọi form đều có 4 trạng thái rõ ràng: *Idle* $\rightarrow$ *Submitting (disabled + text "Đang xử lý...")* $\rightarrow$ *Error (khung thông báo đỏ từ server)* $\rightarrow$ *Success (thông báo thành công / điều hướng)*.

| # | Tên Component (`shadcn/ui`) | File tại `src/components/ui/` | Tùy biến Màu sắc & Nơi sử dụng |
|:---:|---|---|---|
| 1 | **`Button`** | `button.tsx` | - `default`: `bg-zinc-900 hover:bg-zinc-800 text-zinc-50 shadow-sm` cho các nút chính (*Đăng nhập*, *Đăng ký*, *Đặt sân*, *Về trang chủ*).<br>- `ghost`: Nút ẩn/hiện mật khẩu.<br>- `outline`: Nút phụ viền `border-slate-200 hover:bg-slate-50`. |
| 2 | **`Input`** | `input.tsx` | Ô nhập liệu cao `h-10`, viền `border-slate-200`, khi focus chuyển sang viền `focus-visible:ring-zinc-900/20 focus-visible:border-zinc-900`. |
| 3 | **`Label`** | `label.tsx` | Nhãn `text-slate-700 font-medium` nằm phía trên từng ô `Input` và `Checkbox`. |
| 4 | **`Card`** | `card.tsx` | - Auth Card: Có đường viền nhấn `border-t-4 border-t-zinc-900`.<br>- 4 Stat KPI Cards: Thanh chỉ báo màu ở cạnh trên (`bg-zinc-900`, `bg-sky-500`, `bg-indigo-500`, `bg-amber-500`). |
| 5 | **`Checkbox`** | `checkbox.tsx` | Ô chọn *"Ghi nhớ đăng nhập"* (`data-[state=checked]:bg-zinc-900`). |
| 6 | **`Avatar`** | `avatar.tsx` | Hiển thị 2 chữ cái đầu tên user trên nền `bg-zinc-900 text-zinc-50`. |
| 7 | **`DropdownMenu`** | `dropdown-menu.tsx` | Menu tài khoản góc phải Header (*Hồ sơ*, vạch chia, và *Đăng xuất* màu `text-rose-600`). |
| 8 | **`Badge`** | `badge.tsx` | Hỗ trợ các biến thể màu Tonal dịu mắt: `zinc` (`ADMIN`), `sky` (`STAFF` / `CONFIRMED`), `indigo` (`CUSTOMER` / `COMPLETED`), `amber` (`PENDING` / `Phase sau`), `destructive` (`CANCELLED`). |
| 9 | **`Separator`** | `separator.tsx` | Đường kẻ ngang `1px bg-slate-200`. |
| 10 | **`Skeleton`** | `skeleton.tsx` | Khung tải dữ liệu `animate-pulse bg-slate-200/70` khi kiểm tra phiên đăng nhập hoặc tải lưới lịch trống. |
