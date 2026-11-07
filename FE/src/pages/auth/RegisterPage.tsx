import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  const navigate = useNavigate();
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  return (
    <AuthCardLayout
      title="Tạo tài khoản mới"
      description="Đăng ký thành viên để đặt sân cầu lông trực tuyến nhanh chóng"
      topNotification={
        toastSuccess ? (
          <div
            role="status"
            className="fixed right-5 top-5 z-50 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
          >
            {toastSuccess}
          </div>
        ) : null
      }
      footer={
        <>
          <span>Đã có tài khoản?</span>
          <Link
            to="/login"
            className="ml-1.5 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm
        onSuccessToast={setToastSuccess}
        onRegisteredRedirect={() =>
          navigate('/login', {
            replace: true,
            state: {
              registeredMessage:
                'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
            },
          })
        }
      />
    </AuthCardLayout>
  );
}
