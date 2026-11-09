import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/auth';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { LoginForm } from '@/components/auth/LoginForm';

interface LocationState {
  from?: {
    pathname?: string;
  };
  registeredMessage?: string;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (user) {
    const redirectTarget = state?.from?.pathname || '/';
    return <Navigate to={redirectTarget} replace />;
  }

  async function handleLogin(
    email: string,
    password: string,
    rememberMe: boolean
  ) {
    await login(email, password, rememberMe);
    const target = state?.from?.pathname || '/';
    navigate(target, { replace: true });
  }

  return (
    <AuthCardLayout
      title="Sân Cầu Lông"
      description="Đăng nhập vào hệ thống quản lý & đặt sân"
      footer={
        <>
          <span>Chưa có tài khoản?</span>
          <Link
            to="/register"
            className="ml-1.5 font-semibold text-zinc-900 hover:text-zinc-700 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <LoginForm
        initialSuccessMessage={state?.registeredMessage ?? null}
        onLoginSubmit={handleLogin}
        extractError={(err) =>
          extractErrorMessage(err, 'Email hoặc mật khẩu không chính xác')
        }
      />
    </AuthCardLayout>
  );
}
