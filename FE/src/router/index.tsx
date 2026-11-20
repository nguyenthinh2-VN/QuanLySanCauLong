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
import { RecurringBookingPage } from '@/pages/booking/RecurringBookingPage';
import { MyBookingsPage } from '@/pages/booking/MyBookingsPage';
import { PosBookingPage } from '@/pages/booking/PosBookingPage';
import { CheckInPage } from '@/pages/booking/CheckInPage';
import { VouchersPage } from '@/pages/voucher/VouchersPage';
import { PaymentsPage } from '@/pages/payment/PaymentsPage';
import { ReportsPage } from '@/pages/report/ReportsPage';
import { CourtsPage } from '@/pages/court/CourtsPage';
import { UsersPage } from '@/pages/user/UsersPage';

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
            <Route path="courts" element={<CourtsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* STAFF & ADMIN Shared Operational Routes */}
          <Route element={<RoleRoute allowed={['STAFF', 'ADMIN']} />}>
            <Route path="pos" element={<PosBookingPage />} />
            <Route path="check-in" element={<CheckInPage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>

          {/* Vouchers Route (ADMIN manages, CUSTOMER views available vouchers) */}
          <Route element={<RoleRoute allowed={['ADMIN', 'CUSTOMER']} />}>
            <Route path="vouchers" element={<VouchersPage />} />
          </Route>

          {/* CUSTOMER Routes */}
          <Route element={<RoleRoute allowed={['CUSTOMER']} />}>
            <Route path="booking" element={<CustomerBookingPage />} />
            <Route path="recurring" element={<RecurringBookingPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

