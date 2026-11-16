import React, { useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordField } from '@/components/auth/PasswordField';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/auth';
import { VN_PHONE_REGEX } from '@/lib/court';
import { createUser, updateUser } from '@/lib/user';
import type { Role, User } from '@/types/user';

export interface UserFormDialogProps {
  open: boolean;
  initialData: User | null;
  onClose: () => void;
  onSaved: (user: User, message: string) => void;
}

export function UserFormDialog({
  open,
  initialData,
  onClose,
  onSaved,
}: UserFormDialogProps) {
  const isEditing = Boolean(initialData);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Khi tạo mới: chỉ cho phép chọn STAFF và CUSTOMER (cấm tạo ADMIN)
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['CUSTOMER']);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName);
      setEmail(initialData.email);
      setPhone(initialData.phone || '');
      setPassword('');
      setSelectedRoles(initialData.roles);
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setSelectedRoles(['CUSTOMER']);
    }
    setErrorMessage(null);
  }, [initialData, open]);

  if (!open) return null;

  function toggleRole(role: 'STAFF' | 'CUSTOMER') {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        return; // Bắt buộc giữ ít nhất 1 role
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      setErrorMessage('Họ và tên phải từ 2 đến 100 ký tự');
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage('Số điện thoại không được để trống');
      return;
    }

    if (!VN_PHONE_REGEX.test(trimmedPhone)) {
      setErrorMessage('Số điện thoại không đúng định dạng Việt Nam (10 số, VD: 0988776655 hoặc +84988776655)');
      return;
    }

    if (!isEditing) {
      if (!trimmedEmail) {
        setErrorMessage('Email không được để trống');
        return;
      }
      if (!password || password.length < 6 || password.length > 50) {
        setErrorMessage('Mật khẩu phải từ 6 đến 50 ký tự');
        return;
      }
      if (selectedRoles.length === 0) {
        setErrorMessage('Vui lòng chọn ít nhất một vai trò');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        // Chỉ gửi fullName và phone theo UpdateUserRequest
        const updated = await updateUser(initialData.id, {
          fullName: trimmedName,
          phone: trimmedPhone,
        });
        onSaved(updated, `Cập nhật thông tin "${updated.fullName}" thành công`);
      } else {
        const created = await createUser({
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password,
          roles: selectedRoles,
        });
        onSaved(created, `Tạo tài khoản người dùng "${created.fullName}" thành công`);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          isEditing ? 'Cập nhật người dùng thất bại' : 'Tạo tài khoản thất bại'
        )
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
      <Card className="w-full max-w-md shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-zinc-100 pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900">
              {isEditing ? 'Sửa Thông Tin Người Dùng' : 'Tạo Tài Khoản Mới'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {isEditing
                ? 'Chỉnh sửa họ tên và số điện thoại của người dùng'
                : 'Thêm tài khoản nhân viên hoặc khách hàng mới vào hệ thống'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 pt-4 text-xs">
            {errorMessage && <AuthAlert variant="error">{errorMessage}</AuthAlert>}

            {/* Họ và tên */}
            <div className="space-y-1">
              <Label htmlFor="user-fullname" className="text-xs font-medium text-zinc-700">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user-fullname"
                type="text"
                minLength={2}
                maxLength={100}
                required
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="user-email" className="text-xs font-medium text-zinc-700">
                Email đăng nhập <span className="text-red-500">*</span>
              </Label>
              {isEditing ? (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
                  {email}
                  <span className="ml-1.5 text-[10px] text-zinc-400 font-sans">
                    (Email không thể thay đổi)
                  </span>
                </div>
              ) : (
                <Input
                  id="user-email"
                  type="email"
                  required
                  placeholder="VD: nguyen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              )}
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <Label htmlFor="user-phone" className="text-xs font-medium text-zinc-700">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user-phone"
                type="tel"
                required
                placeholder="VD: 0988776655"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            {/* Mật khẩu (chỉ khi tạo mới) */}
            {!isEditing && (
              <div className="space-y-1">
                <PasswordField
                  id="user-password"
                  label="Mật khẩu khởi tạo"
                  required
                  value={password}
                  onChange={(val) => setPassword(val)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            )}

            {/* Chọn vai trò (chỉ khi tạo mới) */}
            {!isEditing && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-medium text-zinc-700">
                  Vai trò tài khoản <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap items-center gap-4 rounded-md border border-zinc-200 bg-zinc-50/60 p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox
                      checked={selectedRoles.includes('CUSTOMER')}
                      onCheckedChange={() => toggleRole('CUSTOMER')}
                    />
                    <span className="font-medium text-zinc-800">Khách hàng (CUSTOMER)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox
                      checked={selectedRoles.includes('STAFF')}
                      onCheckedChange={() => toggleRole('STAFF')}
                    />
                    <span className="font-medium text-zinc-800">Nhân viên (STAFF)</span>
                  </label>
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  * Không thể cấp vai trò Quản trị viên (ADMIN) khi tạo mới để đảm bảo an toàn hệ thống. Bạn có thể phân quyền ADMIN sau khi tạo thông qua nút &quot;Vai trò&quot;.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={onClose}
              className="h-8 text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-8 bg-zinc-900 px-3.5 text-xs text-zinc-50 shadow-xs hover:bg-zinc-800"
            >
              {submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
