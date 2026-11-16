import { useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { extractErrorMessage } from '@/lib/auth';
import { updateUserStatus } from '@/lib/user';
import type { User } from '@/types/user';

export interface LockUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirmed: (user: User, message: string) => void;
}

export function LockUserDialog({
  open,
  user,
  onClose,
  onConfirmed,
}: LockUserDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open || !user) return null;

  async function handleLock() {
    if (!user) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const updated = await updateUserStatus(user.id, { active: false });
      onConfirmed(
        updated,
        `Đã khóa tài khoản "${user.fullName}". Tất cả phiên đăng nhập đã bị vô hiệu hóa.`
      );
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(err, 'Khóa tài khoản người dùng thất bại')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-md border-zinc-200 bg-white shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-amber-700">
            Xác nhận khóa tài khoản
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Bạn có chắc chắn muốn tạm khóa tài khoản của người dùng này?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {errorMessage && (
            <AuthAlert variant="error">{errorMessage}</AuthAlert>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <p className="font-semibold">Lưu ý quan trọng:</p>
            <p className="mt-1 text-amber-800">
              Khi bị khóa, người dùng sẽ bị đăng xuất ngay lập tức khỏi mọi thiết bị và không thể đăng nhập lại cho đến khi được mở khóa.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Họ và tên:</span>
              <span className="font-medium text-zinc-900">{user.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email:</span>
              <span className="font-mono text-zinc-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vai trò:</span>
              <span className="font-medium text-zinc-900">
                {user.roles.join(', ')}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={onClose}
            className="h-8 text-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={handleLock}
            className="h-8 bg-amber-600 text-xs text-white hover:bg-amber-700"
          >
            {submitting ? 'Đang khóa...' : 'Khóa tài khoản'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
