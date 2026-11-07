import React, { useState } from 'react';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/auth';
import type { ApiResponse } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert } from '@/components/auth/AuthAlert';

export interface ForgotPasswordFormProps {
  sent: boolean;
  onSentChange: (sent: boolean) => void;
}

export function ForgotPasswordForm({
  sent,
  onSentChange,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<ApiResponse<null>>('/auth/forgot-password', {
        email: email.trim(),
      });
      onSentChange(true);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, 'Không thể gửi yêu cầu khôi phục mật khẩu')
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          <p className="font-semibold text-emerald-800">Đã gửi email</p>
          <p className="mt-1 text-emerald-700">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới địa chỉ{' '}
            <span className="font-semibold">{email}</span>.
          </p>
          <p className="mt-2 text-xs text-emerald-700/90">
            Lưu ý: Liên kết đặt lại mật khẩu sẽ hết hạn sau{' '}
            <span className="font-semibold">15 phút</span>.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            onSentChange(false);
            setEmail('');
          }}
        >
          Gửi lại bằng email khác
        </Button>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardContent className="space-y-4">
        {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="nguyenvana@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? 'Đang gửi yêu cầu...'
            : 'Gửi liên kết đặt lại mật khẩu'}
        </Button>
      </CardContent>
    </form>
  );
}
