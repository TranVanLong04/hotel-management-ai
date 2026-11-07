import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { formatCurrency } from '@utils/format';
import { serviceApi } from '@/api/service.api';
import { serviceUsageApi } from '@/api/serviceUsage.api';
import type { Service } from '@/types';

interface AddServiceModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess: () => void;
}

/**
 * Modal thêm dịch vụ phát sinh cho đơn đặt phòng (Staff/Admin)
 * Chỉ khả dụng khi đơn đang ở trạng thái 'checked_in'
 */
export function AddServiceModal({ open, onClose, bookingId, onSuccess }: AddServiceModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tải danh sách dịch vụ đang hoạt động
  useEffect(() => {
    if (open) {
      const fetchServices = async () => {
        setLoadingServices(true);
        setError(null);
        try {
          const res = await serviceApi.list({ is_active: true });
          const activeServices = (res.data ?? []).filter((s) => s.is_active);
          setServices(activeServices);
          if (activeServices.length > 0) {
            setSelectedServiceId(activeServices[0].id);
          }
        } catch {
          setError('Không thể tải danh sách dịch vụ đang hoạt động');
        } finally {
          setLoadingServices(false);
        }
      };

      fetchServices();
      setQuantity(1);
      setNote('');
    }
  }, [open]);

  // Dịch vụ đang được chọn
  const currentService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) ?? null;
  }, [services, selectedServiceId]);

  // Tính thành tiền realtime
  const totalAmount = useMemo(() => {
    if (!currentService) return 0;
    return (currentService.price || 0) * (quantity || 0);
  }, [currentService, quantity]);

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId) {
      toast.error('Vui lòng chọn dịch vụ');
      return;
    }

    if (!quantity || quantity <= 0) {
      toast.error('Số lượng dịch vụ phải lớn hơn 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await serviceUsageApi.add(bookingId, {
        service_id: selectedServiceId,
        quantity: Number(quantity),
        note: note.trim() ? note.trim() : null,
      });

      toast.success('Ghi nhận dịch vụ thành công');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errResponse = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const msg =
        errResponse?.response?.data?.error?.message ??
        errResponse?.message ??
        'Không thể thêm dịch vụ vào đơn đặt phòng';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm dịch vụ phát sinh"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingServices ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600 mb-2" />
            <p className="text-xs text-gray-500">Đang tải danh mục dịch vụ...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-danger-50 p-4 text-xs text-danger-700 dark:bg-danger-950/40 dark:text-danger-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            Hiện không có dịch vụ nào khả dụng để thêm. Vui lòng liên hệ Admin kích hoạt dịch vụ.
          </div>
        ) : (
          <>
            {/* Chọn dịch vụ */}
            <div>
              <label htmlFor="service-select" className="label">
                Dịch vụ <span className="text-danger-500">*</span>
              </label>
              <select
                id="service-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="input"
                required
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.price)} / {s.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Chi tiết đơn giá & Đơn vị tính */}
            {currentService && (
              <div className="rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800 space-y-1">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Đơn vị tính:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentService.unit}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Đơn giá snapshot:</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400 font-mono">
                    {formatCurrency(currentService.price)}
                  </span>
                </div>
                {currentService.description && (
                  <div className="pt-1 text-gray-500 italic line-clamp-2">
                    {currentService.description}
                  </div>
                )}
              </div>
            )}

            {/* Số lượng */}
            <div>
              <Input
                label="Số lượng"
                type="number"
                min={1}
                max={100}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label htmlFor="service-usage-note" className="label">
                Ghi chú (Tùy chọn)
              </label>
              <input
                id="service-usage-note"
                type="text"
                placeholder="VD: Giao lên phòng lúc 19h, yêu cầu thêm đá..."
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Thành tiền realtime */}
            <div className="flex items-center justify-between rounded-2xl bg-primary-50 p-4 border border-primary-100 dark:bg-primary-950/40 dark:border-primary-900/40">
              <span className="text-xs font-semibold text-primary-900 dark:text-primary-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                Tổng tiền dịch vụ:
              </span>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300 font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Nút hành động */}
            <div className="mt-6 flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                <Plus className="mr-1.5 h-4 w-4" />
                Xác nhận thêm
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

