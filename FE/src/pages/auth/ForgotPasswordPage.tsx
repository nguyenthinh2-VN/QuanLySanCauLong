import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthCardLayout
      title="Quên mật khẩu"
      description={
        sent
          ? 'Yêu cầu đặt lại mật khẩu đã được ghi nhận'
          : 'Nhập email đăng ký để nhận liên kết đặt lại mật khẩu'
      }
      footer={
        <Link
          to="/login"
          className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Quay lại trang đăng nhập
        </Link>
      }
    >
      <ForgotPasswordForm sent={sent} onSentChange={setSent} />
    </AuthCardLayout>
  );
}
