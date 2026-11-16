import { useCallback, useEffect, useState } from 'react';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { DeleteUserDialog } from '@/components/user/DeleteUserDialog';
import { LockUserDialog } from '@/components/user/LockUserDialog';
import { UserFilterBar } from '@/components/user/UserFilterBar';
import { UserFormDialog } from '@/components/user/UserFormDialog';
import { UserRolesDialog } from '@/components/user/UserRolesDialog';
import { UserTable } from '@/components/user/UserTable';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/auth';
import { getUsers, updateUserStatus } from '@/lib/user';
import type { Role, User } from '@/types/user';

export function UsersPage() {
  const { user: currentUser } = useAuth();

  // Bộ lọc danh sách
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [page, setPage] = useState(0);

  // Dữ liệu bảng
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Trạng thái các dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [rolesUser, setRolesUser] = useState<User | null>(null);
  const [lockUser, setLockUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsersData = useCallback(async () => {
    setLoading(true);
    setPageError(null);

    try {
      const roleParam = role !== 'ALL' ? (role as Role) : undefined;
      const activeParam =
        activeStatus === 'ACTIVE'
          ? true
          : activeStatus === 'LOCKED'
            ? false
            : undefined;

      const data = await getUsers({
        search: search.trim() || undefined,
        role: roleParam,
        active: activeParam,
        page,
        size: 10,
        sort: 'createdAt,desc',
      });

      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setPageError(extractErrorMessage(err, 'Không thể tải danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  }, [search, role, activeStatus, page]);

  useEffect(() => {
    void fetchUsersData();
  }, [fetchUsersData]);

  // Đổi trạng thái khóa / mở khóa
  async function handleToggleStatus(targetUser: User) {
    if (targetUser.active) {
      // Khóa: mở dialog xác nhận cảnh báo thu hồi phiên
      setLockUser(targetUser);
    } else {
      // Mở khóa: kích hoạt lại tài khoản ngay
      try {
        await updateUserStatus(targetUser.id, { active: true });
        setSuccessMessage(`Đã mở khóa tài khoản "${targetUser.fullName}" thành công`);
        void fetchUsersData();
      } catch (err) {
        setPageError(extractErrorMessage(err, 'Mở khóa tài khoản thất bại'));
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Quản Lý Người Dùng & Phân Quyền
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Tra cứu tài khoản, cập nhật thông tin, gán vai trò quyền hạn và quản lý trạng thái tài khoản
        </p>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="relative">
          <AuthAlert variant="success">{successMessage}</AuthAlert>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="absolute right-3 top-3 text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Thông báo lỗi danh sách */}
      {pageError && <AuthAlert variant="error">{pageError}</AuthAlert>}

      {/* Thanh tìm kiếm & bộ lọc */}
      <UserFilterBar
        search={search}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(0);
        }}
        role={role}
        onRoleChange={(r) => {
          setRole(r);
          setPage(0);
        }}
        activeStatus={activeStatus}
        onActiveStatusChange={(st) => {
          setActiveStatus(st);
          setPage(0);
        }}
        onReset={() => {
          setSearch('');
          setRole('ALL');
          setActiveStatus('ALL');
          setPage(0);
        }}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Bảng danh sách người dùng */}
      <UserTable
        users={users}
        currentUserId={currentUser?.id}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onEdit={(u) => setEditingUser(u)}
        onManageRoles={(u) => setRolesUser(u)}
        onToggleStatus={handleToggleStatus}
        onDelete={(u) => setDeletingUser(u)}
      />

      {/* Dialog tạo mới người dùng */}
      <UserFormDialog
        open={isCreateOpen}
        initialData={null}
        onClose={() => setIsCreateOpen(false)}
        onSaved={(_, msg) => {
          setSuccessMessage(msg);
          void fetchUsersData();
        }}
      />

      {/* Dialog cập nhật thông tin người dùng */}
      <UserFormDialog
        open={Boolean(editingUser)}
        initialData={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={(_, msg) => {
          setSuccessMessage(msg);
          void fetchUsersData();
        }}
      />

      {/* Dialog phân quyền vai trò */}
      <UserRolesDialog
        open={Boolean(rolesUser)}
        user={rolesUser}
        currentUserId={currentUser?.id}
        onClose={() => setRolesUser(null)}
        onSaved={(_, msg) => {
          setSuccessMessage(msg);
          void fetchUsersData();
        }}
      />

      {/* Dialog xác nhận khóa tài khoản */}
      <LockUserDialog
        open={Boolean(lockUser)}
        user={lockUser}
        onClose={() => setLockUser(null)}
        onConfirmed={(_, msg) => {
          setSuccessMessage(msg);
          void fetchUsersData();
        }}
      />

      {/* Dialog xác nhận xóa người dùng */}
      <DeleteUserDialog
        open={Boolean(deletingUser)}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onDeleted={(_, msg) => {
          setSuccessMessage(msg);
          void fetchUsersData();
        }}
      />
    </div>
  );
}
export default UsersPage;
