import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from '@/router/guards';
import { AppShell } from '@/components/layout/AppShell';
import { FeaturePlaceholder } from '@/components/layout/FeaturePlaceholder';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CustomerBookingPage } from '@/pages/booking/CustomerBookingPage';
import { MyBookingsPage } from '@/pages/booking/MyBookingsPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Explicit Forbidden Route */}
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Protected Application Shell Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard / Overview (Accessible to all authenticated roles) */}
          <Route index element={<DashboardPage />} />

          {/* ADMIN Routes */}
          <Route element={<RoleRoute allowed={['ADMIN']} />}>
            <Route
              path="bookings"
              element={
                <FeaturePlaceholder
                  title="Quản lý Đặt sân"
                  description="Theo dõi toàn bộ lịch đặt sân, lọc theo trạng thái (PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED) và điều phối sân."
                  moduleTag="Module 4 · Bookings (ADMIN)"
                  endpointHint="GET /api/v1/bookings"
                />
              }
            />
            <Route
              path="courts"
              element={
                <FeaturePlaceholder
                  title="Quản lý Sân cầu lông & Khung giờ"
                  description="Cấu hình danh sách sân (AVAILABLE / MAINTENANCE), bảng giá theo khung giờ (Time Slots) và hình ảnh sân."
                  moduleTag="Module 3 · Courts & Pricing (ADMIN)"
                  endpointHint="GET /api/v1/courts"
                />
              }
            />
            <Route
              path="users"
              element={
                <FeaturePlaceholder
                  title="Quản lý Người dùng & Phân quyền"
                  description="Tra cứu tài khoản Quản trị viên, Nhân viên và Khách hàng; khóa/mở khóa tài khoản và cấp quyền hệ thống."
                  moduleTag="Module 2 · Users (ADMIN)"
                  endpointHint="GET /api/v1/users"
                />
              }
            />
            <Route
              path="reports"
              element={
                <FeaturePlaceholder
                  title="Báo cáo Doanh thu & Công suất sân"
                  description="Thống kê doanh thu gộp, hoàn tiền, doanh thu thuần (Net Revenue) và tỷ lệ lấp đầy sân theo Ngày / Tuần / Tháng."
                  moduleTag="Module 8 · Reports (ADMIN)"
                  endpointHint="GET /api/v1/reports/revenue & /api/v1/reports/occupancy"
                />
              }
            />
          </Route>

          {/* STAFF & ADMIN Shared Operational Routes */}
          <Route element={<RoleRoute allowed={['STAFF', 'ADMIN']} />}>
            <Route
              path="pos"
              element={
                <FeaturePlaceholder
                  title="Đặt sân tại quầy & Bán hàng (POS)"
                  description="Tạo lịch đặt sân trực tiếp cho khách vãng lai, bán phụ kiện/nước uống và tính tổng hóa đơn tại quầy."
                  moduleTag="Module 5 · POS & Inventory (STAFF / ADMIN)"
                  endpointHint="POST /api/v1/pos/orders"
                />
              }
            />
            <Route
              path="check-in"
              element={
                <FeaturePlaceholder
                  title="Check-in Khách đến sân"
                  description="Xác nhận khách nhận sân theo mã đặt sân hoặc số điện thoại, chuyển trạng thái CONFIRMED sang CHECKED_IN."
                  moduleTag="Module 4 · Check-in (STAFF / ADMIN)"
                  endpointHint="PATCH /api/v1/bookings/{id}/check-in"
                />
              }
            />
            <Route
              path="payments"
              element={
                <FeaturePlaceholder
                  title="Quản lý Giao dịch Thanh toán"
                  description="Theo dõi lịch sử thanh toán tiền mặt / chuyển khoản, xác nhận thanh toán và xử lý hoàn tiền."
                  moduleTag="Module 6 · Payments (ADMIN / STAFF)"
                  endpointHint="POST /api/v1/payments"
                />
              }
            />
          </Route>

          {/* Vouchers Route (ADMIN manages, CUSTOMER views available vouchers) */}
          <Route element={<RoleRoute allowed={['ADMIN', 'CUSTOMER']} />}>
            <Route
              path="vouchers"
              element={
                <FeaturePlaceholder
                  title="Chương trình Ưu đãi & Mã giảm giá (Voucher)"
                  description="Danh sách mã giảm giá theo phần trăm hoặc số tiền cố định, kiểm tra điều kiện đơn tối thiểu và áp dụng vào booking."
                  moduleTag="Module 7 · Vouchers (ADMIN / CUSTOMER)"
                  endpointHint="GET /api/v1/vouchers"
                />
              }
            />
          </Route>

          {/* CUSTOMER Routes */}
          <Route element={<RoleRoute allowed={['CUSTOMER']} />}>
            <Route path="booking" element={<CustomerBookingPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

