import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  return (
    <AuthCardLayout
      title="Đặt lại mật khẩu"
      description="Thiết lập mật khẩu mới cho tài khoản của bạn"
      footer={
        <Link
          to="/login"
          className="font-semibold text-zinc-900 hover:text-zinc-700 hover:underline"
        >
          Quay lại trang đăng nhập
        </Link>
      }
    >
      <ResetPasswordForm
        token={token}
        onResetSuccess={() =>
          navigate('/login', {
            replace: true,
            state: {
              registeredMessage:
                'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
            },
          })
        }
      />
    </AuthCardLayout>
  );
}
