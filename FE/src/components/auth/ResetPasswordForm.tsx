import React, { useState } from 'react';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/auth';
import type { ApiResponse } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordField } from '@/components/auth/PasswordField';

export interface ResetPasswordFormProps {
  token: string;
  onResetSuccess: () => void;
}

export function ResetPasswordForm({
  token,
  onResetSuccess,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage(
        'Không tìm thấy mã xác thực (token) trên đường dẫn. Vui lòng kiểm tra lại liên kết trong email.'
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<ApiResponse<null>>('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      onResetSuccess();
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (15 phút)'
        )
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardContent className="space-y-4">
        {!token && (
          <AuthAlert variant="warning">
            Thiếu tham số <span className="font-mono">?token=...</span> trên URL.
            Vui lòng mở đúng liên kết từ email khôi phục mật khẩu.
          </AuthAlert>
        )}

        {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

        <PasswordField
          id="reset-password"
          label="Mật khẩu mới"
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          disabled={submitting}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Nhập lại mật khẩu mới</Label>
          <Input
            id="reset-confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
        </Button>
      </CardContent>
    </form>
  );
}
