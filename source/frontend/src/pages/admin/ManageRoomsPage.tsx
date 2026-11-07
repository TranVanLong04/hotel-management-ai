import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { DataTable } from '@components/common/DataTable';
import { TableToolbar } from '@components/common/TableToolbar';
import { ActionsMenu } from '@components/common/ActionsMenu';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useDataTable } from '@hooks/useDataTable';
import { roomApi } from '@/api/room.api';
import { roomTypeApi } from '@/api/roomType.api';
import { formatCurrency } from '@utils/format';
import type {
  Room,
  RoomStatus,
  RoomType,
  Column,
  RoomFilterParams,
  CreateRoomPayload,
  UpdateRoomPayload,
} from '@/types';
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '@/types';

export function ManageRoomsPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formRoomTypeId, setFormRoomTypeId] = useState('');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetRoom, setStatusTargetRoom] = useState<Room | null>(null);
  const [newStatus, setNewStatus] = useState<RoomStatus>('available');

  // Delete Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load danh mục loại phòng để lọc và chọn trong form
  useEffect(() => {
    roomTypeApi.list({ is_active: true }).then((res) => {
      setRoomTypes(res.data ?? []);
    });
  }, []);

  // Fetch rooms với hook useDataTable - quản lý filters tập trung
  const {
    data: rooms,
    loading,
    pagination,
    search,
    setSearch,
    filters,
    updateFilter,
    resetFilters,
    refetch,
  } = useDataTable<Room, RoomFilterParams>({
    fetchFn: (params) => roomApi.list(params),
    initialLimit: 10,
  });

  // Mở modal thêm mới phòng
  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormRoomNumber('');
    setFormRoomTypeId(roomTypes[0]?.id || '');
    setFormFloor(1);
    setFormDescription('');
    setFormOpen(true);
  };

  // Mở modal sửa phòng
  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormRoomNumber(room.room_number);
    setFormRoomTypeId(room.room_type_id);
    setFormFloor(room.floor || 1);
    setFormDescription(room.description || '');
    setFormOpen(true);
  };

  // Submit form tạo / sửa phòng
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomNumber.trim()) {
      toast.error('Số phòng không được để trống');
      return;
    }
    if (!formRoomTypeId) {
      toast.error('Vui lòng chọn loại phòng');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRoom) {
        const payload: UpdateRoomPayload = {
          room_number: formRoomNumber.trim(),
          room_type_id: formRoomTypeId,
          floor: Number(formFloor),
          description: formDescription.trim() || undefined,
        };
        await roomApi.update(editingRoom.id, payload);
        toast.success(`Cập nhật phòng ${formRoomNumber} thành công`);
      } else {
        const payload: CreateRoomPayload = {
          room_number: formRoomNumber.trim(),
          room_type_id: formRoomTypeId,
          floor: Number(formFloor),
          description: formDescription.trim() || undefined,
        };
        await roomApi.create(payload);
        toast.success(`Tạo phòng ${formRoomNumber} thành công`);
      }
      setFormOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu thông tin phòng';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cập nhật trạng thái phòng nhanh
  const handleUpdateStatus = async () => {
    if (!statusTargetRoom) return;
    setSubmitting(true);
    try {
      await roomApi.updateStatus(statusTargetRoom.id, newStatus);
      toast.success(
        `Cập nhật trạng thái phòng ${statusTargetRoom.room_number} sang ${ROOM_STATUS_LABELS[newStatus]}`
      );
      setStatusModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái phòng';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa mềm phòng
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setDeleting(true);
    try {
      await roomApi.delete(roomToDelete.id);
      toast.success(`Đã xóa phòng ${roomToDelete.room_number}`);
      setDeleteDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa phòng';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Room>[] = useMemo(
    () => [
      {
        key: 'room_number',
        label: 'Số phòng',
        width: '120px',
        render: (r) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-900 dark:bg-gray-800 dark:text-white">
              {r.room_number}
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Phòng {r.room_number}
            </span>
          </div>
        ),
      },
      {
        key: 'room_type',
        label: 'Loại phòng',
        render: (r) => {
          const typeName = r.room_types?.name ?? r.room_type?.name ?? '—';
          return (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{typeName}</span>
              {r.description && (
                <div className="max-w-xs truncate text-[11px] text-gray-400">
                  {r.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'floor',
        label: 'Tầng',
        align: 'center',
        render: (r) => (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Tầng {r.floor || 1}
          </span>
        ),
      },
      {
        key: 'price',
        label: 'Giá niêm yết',
        align: 'right',
        render: (r) => {
          const price = r.room_types?.base_price ?? r.room_type?.base_price ?? 0;
          return (
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(price)}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Trạng thái',
        align: 'center',
        render: (r) => {
          const status = r.status as RoomStatus;
          const variant =
            (ROOM_STATUS_COLORS[status] as
              | 'default'
              | 'primary'
              | 'success'
              | 'warning'
              | 'danger'
              | 'info') || 'default';
          return (
            <Badge variant={variant} size="sm">
              {ROOM_STATUS_LABELS[status] || status}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        label: 'Thao tác',
        align: 'right',
        width: '80px',
        render: (r) => (
          <ActionsMenu
            actions={[
              {
                label: 'Sửa phòng',
                icon: Edit2,
                onClick: () => handleOpenEdit(r),
              },
              {
                label: 'Đổi trạng thái',
                icon: RefreshCw,
                onClick: () => {
                  setStatusTargetRoom(r);
                  setNewStatus(r.status);
                  setStatusModalOpen(true);
                },
              },
              {
                label: 'Xóa phòng',
                icon: Trash2,
                danger: true,
                divider: true,
                onClick: () => {
                  setRoomToDelete(r);
                  setDeleteDialogOpen(true);
                },
              },
            ]}
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Danh sách Buồng phòng
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Quản lý thông tin số phòng, tầng lầu, hạng phòng và trạng thái buồng phòng
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm phòng mới</span>
        </Button>
      </div>

      {/* Toolbar & Filters */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo số phòng..."
        hasActiveFilters={
          !!filters.room_type_id || !!filters.status || !!filters.floor || !!search
        }
        onResetFilters={resetFilters}
      >
        {/* Lọc loại phòng */}
        <select
          value={filters.room_type_id || ''}
          onChange={(e) => updateFilter('room_type_id', e.target.value || undefined)}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tất cả hạng phòng</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>

        {/* Lọc trạng thái */}
        <select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', (e.target.value as RoomStatus) || undefined)}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ROOM_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Lọc tầng */}
        <select
          value={filters.floor ? String(filters.floor) : ''}
          onChange={(e) =>
            updateFilter('floor', e.target.value ? Number(e.target.value) : undefined)
          }
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tất cả tầng</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((f) => (
            <option key={f} value={f}>
              Tầng {f}
            </option>
          ))}
        </select>
      </TableToolbar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={rooms}
        loading={loading}
        rowKey={(r) => r.id}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: (p) => pagination.setPage(p),
        }}
      />

      {/* Modal Thêm / Sửa Phòng */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRoom ? `Sửa phòng ${editingRoom.room_number}` : 'Thêm phòng mới'}
        size="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Số phòng *
            </label>
            <input
              type="text"
              required
              value={formRoomNumber}
              onChange={(e) => setFormRoomNumber(e.target.value)}
              placeholder="Ví dụ: 101, 202, VIP-01"
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Hạng / Loại phòng *
              </label>
              <select
                required
                value={formRoomTypeId}
                onChange={(e) => setFormRoomTypeId(e.target.value)}
                className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatCurrency(rt.base_price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Tầng lầu *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={formFloor}
                onChange={(e) => setFormFloor(Number(e.target.value))}
                className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Mô tả thêm
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Vị trí view biển, góc hành lang, v.v..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {editingRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Đổi Trạng thái Buồng phòng */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Đổi trạng thái phòng ${statusTargetRoom?.room_number}`}
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-500 dark:text-gray-400">
            Chọn trạng thái mới cho phòng {statusTargetRoom?.room_number}:
          </p>

          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as RoomStatus)}
            className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            {Object.entries(ROOM_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              loading={submitting}
              onClick={handleUpdateStatus}
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteRoom}
        loading={deleting}
        title="Xóa phòng"
        message={`Bạn có chắc chắn muốn xóa phòng ${roomToDelete?.room_number}? Phòng sẽ chuyển sang ngừng hoạt động.`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}
