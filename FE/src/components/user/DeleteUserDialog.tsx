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
import { deleteUser } from '@/lib/user';
import type { User } from '@/types/user';

export interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onDeleted: (user: User, message: string) => void;
}

export function DeleteUserDialog({
  open,
  user,
  onClose,
  onDeleted,
}: DeleteUserDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open || !user) return null;

  async function handleDelete() {
    if (!user) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await deleteUser(user.id);
      onDeleted(user, `Đã xóa vĩnh viễn tài khoản "${user.fullName}"`);
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(err, 'Xóa tài khoản người dùng thất bại')
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
      <Card className="w-full max-w-md border-red-200 bg-white shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-red-600">
            Xác nhận xóa tài khoản
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Hành động này mang tính vĩnh viễn và không thể hoàn tác.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {errorMessage && (
            <AuthAlert variant="error">{errorMessage}</AuthAlert>
          )}

          <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-900">
            <p className="font-semibold">Cảnh báo:</p>
            <p className="mt-1 text-red-800">
              Tài khoản sẽ bị xóa hoàn toàn khỏi hệ thống. Mọi phiên đăng nhập hiện tại sẽ bị hủy bỏ.
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
            onClick={handleDelete}
            className="h-8 bg-red-600 text-xs text-white hover:bg-red-700"
          >
            {submitting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
