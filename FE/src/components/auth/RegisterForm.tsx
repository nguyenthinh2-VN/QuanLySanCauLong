import React, { useState } from 'react';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/auth';
import type { ApiResponse, RawUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordField } from '@/components/auth/PasswordField';

export interface RegisterFormProps {
  onSuccessToast: (message: string) => void;
  onRegisteredRedirect: () => void;
}

export function RegisterForm({
  onSuccessToast,
  onRegisteredRedirect,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin đăng ký');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<RawUser>>('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      const msg =
        response.data?.message ||
        'Đăng ký tài khoản thành công! Đang chuyển sang trang đăng nhập...';
      onSuccessToast(msg);

      setTimeout(() => {
        onRegisteredRedirect();
      }, 900);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể đăng ký tài khoản')
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardContent className="space-y-4">
        {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

        <div className="space-y-2">
          <Label htmlFor="reg-fullname">Họ và tên</Label>
          <Input
            id="reg-fullname"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="nguyenvana@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-phone">Số điện thoại</Label>
          <Input
            id="reg-phone"
            type="tel"
            placeholder="0987654321"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <PasswordField
          id="reg-password"
          label="Mật khẩu"
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={submitting}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />

        <div className="space-y-2">
          <Label htmlFor="reg-confirm-password">Nhập lại mật khẩu</Label>
          <Input
            id="reg-confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu ở trên"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
        </Button>
      </CardContent>
    </form>
  );
}
