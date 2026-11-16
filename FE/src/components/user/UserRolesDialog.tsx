import React, { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/auth';
import { updateUserRoles } from '@/lib/user';
import type { Role, User } from '@/types/user';

export interface UserRolesDialogProps {
  open: boolean;
  user: User | null;
  currentUserId?: number;
  onClose: () => void;
  onSaved: (user: User, message: string) => void;
}

const ALL_ROLES: { key: Role; label: string; desc: string }[] = [
  {
    key: 'ADMIN',
    label: 'ADMIN (Quản trị viên)',
    desc: 'Toàn quyền cấu hình sân, giá, quản lý người dùng, báo cáo và hệ thống',
  },
  {
    key: 'STAFF',
    label: 'STAFF (Nhân viên)',
    desc: 'Đặt sân tại quầy POS, check-in, thu tiền và hỗ trợ khách hàng',
  },
  {
    key: 'CUSTOMER',
    label: 'CUSTOMER (Khách hàng)',
    desc: 'Xem lịch trống, đặt sân online, quản lý đơn đặt của bản thân',
  },
];

export function UserRolesDialog({
  open,
  user,
  currentUserId,
  onClose,
  onSaved,
}: UserRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSelf = Boolean(currentUserId && user?.id === currentUserId);

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles);
    } else {
      setSelectedRoles([]);
    }
    setErrorMessage(null);
  }, [user, open]);

  if (!open || !user) return null;

  function toggleRole(role: Role) {
    if (isSelf && role === 'ADMIN') {
      return; // Không cho phép tự gỡ vai trò ADMIN
    }

    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        setErrorMessage('Tài khoản phải giữ ít nhất một vai trò');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedRoles.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một vai trò');
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      const updated = await updateUserRoles(user.id, {
        roles: selectedRoles,
      });
      onSaved(updated, `Cập nhật vai trò cho "${user.fullName}" thành công`);
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(err, 'Cập nhật vai trò người dùng thất bại')
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
          <CardTitle className="text-base font-semibold text-zinc-900">
            Phân quyền vai trò
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Cập nhật nhóm quyền cho tài khoản{' '}
            <span className="font-semibold text-zinc-900">{user.fullName}</span>{' '}
            ({user.email})
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5">
            {errorMessage && (
              <AuthAlert variant="error">{errorMessage}</AuthAlert>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-700">
                Danh sách vai trò hệ thống
              </Label>
              <div className="space-y-2">
                {ALL_ROLES.map(({ key, label, desc }) => {
                  const isChecked = selectedRoles.includes(key);
                  const isSelfAdmin = isSelf && key === 'ADMIN';

                  return (
                    <div
                      key={key}
                      onClick={() => !isSelfAdmin && toggleRole(key)}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? 'border-zinc-900 bg-zinc-50/75'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
                      } ${isSelfAdmin ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}`}
                    >
                      <Checkbox
                        id={`role-${key}`}
                        checked={isChecked}
                        disabled={isSelfAdmin}
                        onCheckedChange={() => toggleRole(key)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`role-${key}`}
                            className={`text-xs font-semibold ${
                              isChecked ? 'text-zinc-900' : 'text-zinc-700'
                            } ${isSelfAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {label}
                          </label>
                          {isSelfAdmin && (
                            <span className="rounded bg-zinc-200 px-1 py-0.2 text-[9px] font-medium text-zinc-700">
                              Chính bạn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">{desc}</p>
                        {isSelfAdmin && (
                          <p className="text-[10px] font-medium text-amber-600">
                            Không thể tự gỡ vai trò ADMIN của chính mình
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-8 bg-zinc-900 text-xs text-zinc-50 hover:bg-zinc-800"
            >
              {submitting ? 'Đang lưu...' : 'Lưu vai trò'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
