import { useState } from 'react';
import { Edit, Power, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { serviceApi } from '@/api/service.api';
import type { Service } from '@/types';

interface ServiceActionsMenuProps {
  service: Service;
  onEdit: (service: Service) => void;
  onRefresh: () => void;
}

/**
 * Menu thao tác cho từng dòng dịch vụ (Sửa, Bật/Tắt, Xóa mềm)
 */
export function ServiceActionsMenu({ service, onEdit, onRefresh }: ServiceActionsMenuProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bật / Tắt trạng thái hoạt động
  const handleToggleActive = async () => {
    try {
      setIsToggling(true);
      await serviceApi.update(service.id, { is_active: !service.is_active });
      toast.success(
        service.is_active
          ? `Đã tạm ngừng cung cấp dịch vụ "${service.name}"`
          : `Đã kích hoạt lại dịch vụ "${service.name}"`
      );
      onRefresh();
    } catch {
      toast.error('Không thể thay đổi trạng thái dịch vụ');
    } finally {
      setIsToggling(false);
    }
  };

  // Xác nhận xóa mềm
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await serviceApi.delete(service.id);
      toast.success(`Đã xóa dịch vụ "${service.name}"`);
      setDeleteModalOpen(false);
      onRefresh();
    } catch {
      toast.error('Không thể xóa dịch vụ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        {/* Nút Sửa */}
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
          title="Chỉnh sửa dịch vụ"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Nút Bật/Tắt is_active */}
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isToggling}
          className={`rounded-lg p-1.5 transition-colors ${
            service.is_active
              ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
              : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800'
          }`}
          title={service.is_active ? 'Nhấn để tạm dừng dịch vụ' : 'Nhấn để kích hoạt dịch vụ'}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </button>

        {/* Nút Xóa (Soft delete) */}
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600 transition-colors dark:text-gray-500 dark:hover:bg-danger-950/40 dark:hover:text-danger-400"
          title="Xóa dịch vụ (Soft delete)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Modal xác nhận xóa */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xác nhận xóa dịch vụ"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-danger-100 p-2 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Bạn có chắc chắn muốn xóa dịch vụ này?
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Dịch vụ <strong>"{service.name}"</strong> sẽ được chuyển sang trạng thái ngừng cung cấp (soft-delete). Các đơn phòng đã sử dụng trước đó không bị ảnh hưởng.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

