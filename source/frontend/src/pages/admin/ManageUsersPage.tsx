import { useState, useMemo } from 'react';
import {
  Edit2,
  Lock,
  Unlock,
  Trash2,
  Shield,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { DataTable } from '@components/common/DataTable';
import { TableToolbar } from '@components/common/TableToolbar';
import { ActionsMenu } from '@components/common/ActionsMenu';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useDataTable } from '@hooks/useDataTable';
import { userApi } from '@/api/user.api';
import { useAuthStore } from '@stores/authStore';
import { formatDate } from '@utils/format';
import type {
  User,
  UserRole,
  Column,
  UserFilterParams,
  UpdateUserPayload,
} from '@/types';
import { ROLE_LABELS } from '@/types';

export function ManageUsersPage() {
  const currentUser = useAuthStore((state) => state.user);

  // Form Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('customer');
  const [submitting, setSubmitting] = useState(false);

  // Status Toggle Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // useDataTable quản lý filters trực tiếp
  const {
    data: users,
    loading,
    pagination,
    search,
    setSearch,
    filters,
    updateFilter,
    resetFilters,
    refetch,
  } = useDataTable<User, UserFilterParams>({
    fetchFn: (params) => userApi.list(params),
    initialLimit: 10,
  });

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormFullName(u.full_name);
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formFullName.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateUserPayload = {
        full_name: formFullName.trim(),
        phone: formPhone.trim() || undefined,
        ...(editingUser.id !== currentUser?.id ? { role: formRole } : {}),
      };
      await userApi.update(editingUser.id, payload);
      toast.success(`Cập nhật người dùng "${formFullName}" thành công`);
      setEditModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật người dùng';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    setSubmitting(true);
    try {
      const newStatus = !targetUser.is_active;
      await userApi.updateStatus(targetUser.id, { is_active: newStatus });
      toast.success(
        `${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản "${targetUser.full_name}" thành công`
      );
      setStatusDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi thay đổi trạng thái';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await userApi.delete(userToDelete.id);
      toast.success(`Đã xóa tài khoản "${userToDelete.full_name}"`);
      setDeleteDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa người dùng';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'full_name',
        label: 'Người dùng',
        render: (u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-xs font-bold text-white shadow-xs">
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                  <span>{u.full_name}</span>
                  {isSelf && (
                    <span className="rounded-md bg-primary-100 px-1.5 py-0.2 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      Tôi
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">{u.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'phone',
        label: 'Số điện thoại',
        render: (u) => (
          <span className="text-gray-600 dark:text-gray-300">
            {u.phone || 'Chưa cung cấp'}
          </span>
        ),
      },
      {
        key: 'role',
        label: 'Vai trò',
        align: 'center',
        render: (u) => {
          const isRoleAdmin = u.role === 'admin';
          const isRoleStaff = u.role === 'staff';
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isRoleAdmin
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                  : isRoleStaff
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {isRoleAdmin ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : isRoleStaff ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              <span>{ROLE_LABELS[u.role] || u.role}</span>
            </span>
          );
        },
      },
      {
        key: 'is_active',
        label: 'Trạng thái',
        align: 'center',
        render: (u) =>
          u.is_active ? (
            <Badge variant="success" size="sm">
              Hoạt động
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              Đã khóa
            </Badge>
          ),
      },
      {
        key: 'created_at',
        label: 'Ngày tham gia',
        render: (u) => (
          <span className="text-gray-500 dark:text-gray-400">
            {formatDate(u.created_at)}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Thao tác',
        align: 'right',
        width: '80px',
        render: (u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <ActionsMenu
              actions={[
                {
                  label: 'Sửa thông tin',
                  icon: Edit2,
                  onClick: () => handleOpenEdit(u),
                },
                {
                  label: u.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
                  icon: u.is_active ? Lock : Unlock,
                  disabled: isSelf,
                  onClick: () => {
                    setTargetUser(u);
                    setStatusDialogOpen(true);
                  },
                },
                {
                  label: 'Xóa tài khoản',
                  icon: Trash2,
                  danger: true,
                  divider: true,
                  disabled: isSelf,
                  onClick: () => {
                    setUserToDelete(u);
                    setDeleteDialogOpen(true);
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [currentUser]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Quản trị Người dùng & Nhân sự
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Phân quyền tài khoản quản trị, nhân viên lễ tân và khách hàng
          </p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm theo tên hoặc email..."
        hasActiveFilters={!!filters.role || filters.is_active !== undefined || !!search}
        onResetFilters={resetFilters}
      >
        <select
          value={filters.role || ''}
          onChange={(e) => updateFilter('role', (e.target.value as UserRole) || undefined)}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản trị viên (Admin)</option>
          <option value="staff">Lễ tân (Staff)</option>
          <option value="customer">Khách hàng</option>
        </select>

        <select
          value={
            filters.is_active === undefined
              ? ''
              : filters.is_active === true || (filters.is_active as unknown) === 'true'
              ? 'true'
              : 'false'
          }
          onChange={(e) =>
            updateFilter(
              'is_active',
              e.target.value === ''
                ? undefined
                : (e.target.value as unknown as boolean)
            )
          }
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã bị khóa</option>
        </select>
      </TableToolbar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        rowKey={(u) => u.id}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: (p) => pagination.setPage(p),
        }}
      />

      {/* Modal Sửa Người Dùng */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Chỉnh sửa tài khoản: ${editingUser?.full_name}`}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Email đăng nhập (Chỉ đọc)
            </label>
            <input
              type="email"
              disabled
              value={editingUser?.email || ''}
              className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Họ và tên *
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="0901234567"
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Phân quyền vai trò
            </label>
            <select
              value={formRole}
              disabled={editingUser?.id === currentUser?.id}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="staff">Lễ tân (Staff)</option>
              <option value="customer">Khách hàng</option>
            </select>
            {editingUser?.id === currentUser?.id && (
              <span className="mt-1 block text-[11px] text-amber-500">
                Không thể tự thay đổi vai trò của tài khoản đang đăng nhập.
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Toggle Status Dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleToggleStatus}
        loading={submitting}
        title={targetUser?.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={
          targetUser?.is_active
            ? `Bạn có chắc chắn muốn khóa tài khoản "${targetUser?.full_name}"? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Mở khóa tài khoản cho "${targetUser?.full_name}"?`
        }
        confirmText={targetUser?.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
        variant={targetUser?.is_active ? 'danger' : 'primary'}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        loading={deleting}
        title="Xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete?.full_name}"? Tài khoản sẽ chuyển sang ngừng hoạt động.`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}
