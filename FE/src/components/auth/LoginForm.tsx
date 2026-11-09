import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordField } from '@/components/auth/PasswordField';

export interface LoginFormProps {
  initialSuccessMessage?: string | null;
  onLoginSubmit: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  extractError: (error: unknown) => string;
}

export function LoginForm({
  initialSuccessMessage = null,
  onLoginSubmit,
  extractError,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      await onLoginSubmit(email, password, rememberMe);
    } catch (error) {
      setErrorMessage(extractError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardContent className="space-y-4">
        {initialSuccessMessage && !errorMessage && (
          <AuthAlert variant="success">{initialSuccessMessage}</AuthAlert>
        )}

        {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="tenban@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <PasswordField
          id="login-password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          disabled={submitting}
          rightLabelSlot={
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          }
        />

        <div className="flex items-center space-x-2 pt-0.5">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={submitting}
          />
          <Label
            htmlFor="remember-me"
            className="cursor-pointer text-sm font-normal text-slate-600"
          >
            Ghi nhớ đăng nhập
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </CardContent>
    </form>
  );
}
